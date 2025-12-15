from playwright.sync_api import sync_playwright
from urllib.parse import quote_plus
from typing import List, Dict
import asyncio
from concurrent.futures import ThreadPoolExecutor


_executor = ThreadPoolExecutor(max_workers=1)


def _search_sync(product_name: str, limit: int = 5) -> List[Dict]:
    base_url = "https://www.made-in-china.com"
    results = []
    
    try:
        with sync_playwright() as p:
            browser = p.firefox.launch(headless=False)
            page = browser.new_page(viewport={'width': 1920, 'height': 1080})
            page.goto(base_url, wait_until='domcontentloaded', timeout=20000)
            
            page.wait_for_timeout(1000)
            
            search_input = page.query_selector('input.nail-search-input[name="word"]')
            if not search_input:
                search_input = page.query_selector('input[type="text"][name="word"]')
            
            if search_input:
                search_input.fill(product_name)
                page.wait_for_timeout(300)
                search_input.press('Enter')
            else:
                search_url = f"{base_url}/search?word={quote_plus(product_name)}"
                page.goto(search_url, wait_until='domcontentloaded', timeout=20000)
            
            page.wait_for_timeout(2000)
            
            prod_list = page.wait_for_selector('div.prod-list', timeout=30000)
            if not prod_list:
                print("No products list found. Waiting 30 seconds before closing...")
                page.wait_for_timeout(30000)
                browser.close()
                return results
            
            print("Products list loaded. Setting maximum items per page...")
            page.wait_for_timeout(2000)
            
            max_items_links = page.query_selector_all('a[onclick*="savePageNoCookieD"]')
            max_value = 0
            max_link = None
            
            for link in max_items_links:
                onclick_attr = link.get_attribute('onclick')
                if onclick_attr and 'savePageNoCookieD' in onclick_attr:
                    try:
                        import re
                        match = re.search(r'savePageNoCookieD\((\d+)\)', onclick_attr)
                        if match:
                            value = int(match.group(1))
                            if value > max_value:
                                max_value = value
                                max_link = link
                    except:
                        continue
            
            if max_link and max_value > 0:
                try:
                    max_link.click()
                    print(f"Clicked on max items link: {max_value}")
                    page.wait_for_timeout(2000)
                    
                    print("Waiting for products to load after selecting max items...")
                    page.wait_for_selector('div.prod-list', timeout=30000)
                    page.wait_for_timeout(3000)
                    
                    prod_list = page.query_selector('div.prod-list')
                    if not prod_list:
                        print("Products list not found after selecting max items")
                        page.wait_for_timeout(30000)
                        browser.close()
                        return results
                    
                    print(f"Selected maximum items per page: {max_value}")
                except Exception as e:
                    print(f"Could not click max items link or load products: {e}")
                    import traceback
                    traceback.print_exc()
            else:
                print("Could not find max items selector, continuing with default...")
            
            page.wait_for_timeout(2000)
            
            prod_list = page.query_selector('div.prod-list')
            if not prod_list:
                print("Products list not found. Waiting 30 seconds before closing...")
                page.wait_for_timeout(30000)
                browser.close()
                return results
            
            print("Parsing products...")
            product_items = prod_list.query_selector_all('div.list-node')
            print(f"Found {len(product_items)} product items in the list")
            
            all_products = []
            seen_suppliers = set()
            
            for idx, item in enumerate(product_items):
                try:
                    star_container = item.query_selector('.auth-icon-item.icon-star.J-tooltip-ele')
                    if not star_container:
                        continue
                    
                    star_images = star_container.query_selector_all('img')
                    star_count = len(star_images)
                    
                    if star_count == 0:
                        continue
                    
                    print(f"Product {idx+1}: Found {star_count} stars")
                    
                    company_elem = item.query_selector('.company-name-txt')
                    if not company_elem:
                        continue
                    
                    company_link = company_elem.query_selector('a')
                    if not company_link:
                        continue
                    
                    supplier_name = company_elem.inner_text().strip()
                    if not supplier_name:
                        continue
                    
                    supplier_url = company_link.get_attribute('href')
                    if supplier_url:
                        if supplier_url.startswith('//'):
                            supplier_url = 'https:' + supplier_url
                        elif not supplier_url.startswith('http'):
                            supplier_url = base_url + (supplier_url if supplier_url.startswith('/') else '/' + supplier_url)
                    else:
                        supplier_url = ""
                    
                    supplier_key = supplier_name.lower().strip()
                    if supplier_key in seen_suppliers:
                        continue
                    
                    product_link = item.query_selector('a[href*="/product/"]')
                    product_name_text = "Product"
                    product_url = ""
                    
                    if product_link:
                        product_name_text = product_link.inner_text().strip()
                        if not product_name_text:
                            product_name_text = "Product"
                        product_href = product_link.get_attribute('href')
                        if product_href:
                            if product_href.startswith('http'):
                                product_url = product_href
                            else:
                                product_url = base_url + (product_href if product_href.startswith('/') else '/' + product_href)
                    
                    price_elem = item.query_selector('.info.price-info')
                    price = "Price not available"
                    if price_elem:
                        price = price_elem.inner_text().strip()
                    
                    quantity_elem = item.query_selector('.price_hint')
                    moq = "Not available"
                    if quantity_elem:
                        moq = quantity_elem.inner_text().strip()
                    
                    all_products.append({
                        'product_name': product_name_text,
                        'product_url': product_url,
                        'price': price,
                        'detailed_price': price,
                        'moq': moq,
                        'rating': f"{star_count} out of 5 stars",
                        'rating_stars': star_count,
                        'store_name': supplier_name,
                        'store_url': supplier_url,
                        'orders': "N/A"
                    })
                    
                    seen_suppliers.add(supplier_key)
                    print(f"Added product {idx+1}: {supplier_name} - {star_count} stars")
                    
                except Exception as e:
                    print(f"Error processing product {idx+1}: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
            
            print(f"Found {len(all_products)} unique products with ratings")
            
            if len(all_products) > 0:
                print("Products before sorting:")
                for p in all_products[:10]:
                    print(f"  - {p['store_name']}: {p['rating_stars']} stars")
            
            all_products.sort(key=lambda x: x['rating_stars'], reverse=True)
            
            if len(all_products) > 0:
                print("Products after sorting (top 10):")
                for p in all_products[:10]:
                    print(f"  - {p['store_name']}: {p['rating_stars']} stars")
            
            results = all_products[:limit]
            print(f"Selected top {len(results)} suppliers with highest star ratings:")
            for r in results:
                print(f"  - {r['store_name']}: {r['rating']}")
            
            for supplier in results:
                del supplier['rating_stars']
            
            print("Waiting 10 seconds before closing browser...")
            page.wait_for_timeout(10000)
            
            browser.close()
        
        return results
    except Exception as e:
        print(f"Error searching for suppliers: {e}")
        import traceback
        traceback.print_exc()
        return []


async def search_aliexpress(product_name, limit=5):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, _search_sync, product_name, limit)


class AliExpressService:
    async def search_suppliers(self, product_name: str, limit: int = 5) -> List[Dict]:
        return await search_aliexpress(product_name, limit)
