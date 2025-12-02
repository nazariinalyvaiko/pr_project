from playwright.async_api import async_playwright
from urllib.parse import quote_plus
from typing import List, Dict


async def search_aliexpress(product_name, limit=5):
    base_url = "https://www.made-in-china.com"
    
    results = []
    
    try:
        async with async_playwright() as p:
            browser = await p.firefox.launch(headless=True)
            page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
            await page.goto(base_url, wait_until='domcontentloaded', timeout=20000)
            
            await page.wait_for_timeout(500)
            
            search_input = await page.query_selector('input.nail-search-input[name="word"]')
            
            if not search_input:
                search_input = await page.query_selector('input[type="text"][name="word"]')
            
            if search_input:
                await search_input.fill(product_name)
                await page.wait_for_timeout(100)
                await search_input.press('Enter')
            else:
                search_url = f"{base_url}/search?word={quote_plus(product_name)}"
                await page.goto(search_url, wait_until='domcontentloaded', timeout=20000)
            
            await page.wait_for_timeout(500)
            
            supplier_list_links = await page.query_selector_all('a')
            for link in supplier_list_links:
                text = await link.inner_text()
                if text and 'Supplier List' in text.strip():
                    await link.click()
                    await page.wait_for_timeout(500)
                    break
            
            await page.wait_for_timeout(500)
            
            all_links = await page.query_selector_all('a')
            items_per_page_link = None
            for link in all_links:
                text = await link.inner_text()
                href = await link.get_attribute('href')
                if text and text.strip() == '50' and (href == 'javascript:;' or href == 'javascript:void(0);'):
                    items_per_page_link = link
                    break
            
            if items_per_page_link:
                class_attr = await items_per_page_link.get_attribute('class')
                if not class_attr or 'selected' not in class_attr:
                    await items_per_page_link.click()
                    await page.wait_for_timeout(500)
            
            await page.wait_for_timeout(500)
            
            suppliers_list = await page.query_selector('div.search-list')
            if not suppliers_list:
                await browser.close()
                return results
            
            supplier_items = await suppliers_list.query_selector_all('div.list-node')
            seen_urls = set()
            all_suppliers = []
            
            for item in supplier_items:
                try:
                    supplier_link = await item.query_selector('a[target="_blank"][href*=".made-in-china.com"]')
                    if not supplier_link:
                        supplier_link = await item.query_selector('a[href*=".made-in-china.com"]')
                    
                    if not supplier_link:
                        continue
                    
                    href = await supplier_link.get_attribute('href')
                    if not href or href in seen_urls:
                        continue
                    
                    if '.made-in-china.com' not in href or '/product/' in href:
                        continue
                    
                    seen_urls.add(href)
                    
                    supplier_name = await supplier_link.inner_text()
                    supplier_name = supplier_name.strip()
                    
                    if not supplier_name or len(supplier_name) < 2:
                        continue
                    
                    supplier_url = href.strip()
                    if supplier_url.startswith('//'):
                        supplier_url = 'https:' + supplier_url
                    
                    rating = "No rating"
                    star_count = 0
                    
                    rating_elem = await item.query_selector('span.icon-star, span[class*="icon-star"], span[class*="star"]')
                    if rating_elem:
                        star_images = await rating_elem.query_selector_all('img[src*="star"]')
                        star_count = len(star_images)
                        if star_count > 0:
                            rating = f"{star_count} out of 5 stars"
                        else:
                            rating_text = await rating_elem.inner_text()
                            if rating_text:
                                rating = rating_text.strip()
                    else:
                        rating_elem = await item.query_selector('div:nth-child(2) > div:nth-child(1) > li:nth-child(1) > span:nth-child(2)')
                        if rating_elem:
                            star_images = await rating_elem.query_selector_all('img[src*="star"]')
                            star_count = len(star_images)
                            if star_count > 0:
                                rating = f"{star_count} out of 5 stars"
                            else:
                                rating_text = await rating_elem.inner_text()
                                if rating_text:
                                    rating = rating_text.strip()
                    
                    product_link = await item.query_selector('a[href*="/product/"]')
                    product_name = "Product from " + supplier_name
                    product_url = supplier_url
                    
                    if product_link:
                        product_name = await product_link.inner_text()
                        product_href = await product_link.get_attribute('href')
                        if product_href:
                            if product_href.startswith('http'):
                                product_url = product_href
                            else:
                                product_url = base_url + (product_href if product_href.startswith('/') else '/' + product_href)
                    
                    price_elem = await item.query_selector('[class*="price"]')
                    price = "Price not available"
                    if price_elem:
                        price = await price_elem.inner_text()
                        price = price.strip()
                    
                    all_suppliers.append({
                        'product_name': product_name.strip(),
                        'product_url': product_url,
                        'price': price,
                        'rating': rating,
                        'rating_stars': star_count,
                        'store_name': supplier_name,
                        'store_url': supplier_url,
                        'orders': "N/A"
                    })
                    
                except Exception as e:
                    print(f"Error processing supplier: {e}")
                    continue
            
            all_suppliers.sort(key=lambda x: x['rating_stars'], reverse=True)
            results = all_suppliers[:limit]
            
            for supplier in results:
                del supplier['rating_stars']
            
            await browser.close()
        
        return results
    except Exception as e:
        print(f"Error searching for suppliers: {e}")
        import traceback
        traceback.print_exc()
        return []


class AliExpressService:
    async def search_suppliers(self, product_name: str, limit: int = 5) -> List[Dict]:
        return await search_aliexpress(product_name, limit)
