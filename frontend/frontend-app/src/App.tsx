import { useState, useMemo } from 'react'
import type { FormEvent, ChangeEvent } from 'react'

interface Supplier {
  product_name: string
  product_url: string
  price: string
  detailed_price: string
  moq: string
  rating: string
  store_name: string
  store_url: string
  orders: string
}

interface SearchResponse {
  suppliers: Supplier[]
  query: string
}

const API_URL = 'http://localhost:8000/api/v1/suppliers'

// Helper function to parse price from string
const parsePrice = (priceStr: string): number => {
  if (!priceStr || priceStr.toLowerCase().includes('not available') || priceStr.toLowerCase().includes('n/a')) {
    return Infinity
  }
  // Extract numbers and decimal separators
  const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? Infinity : parsed
}

type SortField = 'price' | 'rating' | 'name' | null
type SortDirection = 'asc' | 'desc'

function App() {
  const [productName, setProductName] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!productName.trim()) {
      setError('Please enter a product name')
      return
    }

    setLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      const response = await fetch(`${API_URL}/search?product_name=${encodeURIComponent(productName.trim())}`)
      
      if (!response.ok) {
        throw new Error('Error searching for suppliers')
      }

      const data: SearchResponse = await response.json()
      setSuppliers(data.suppliers)
      setSortField(null)
      setSortDirection('asc')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedSuppliers = useMemo(() => {
    if (!sortField) return suppliers

    return [...suppliers].sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sortField) {
        case 'price':
          aValue = parsePrice(a.price)
          bValue = parsePrice(b.price)
          break
        case 'rating':
          const aRating = parseInt(a.rating) || 0
          const bRating = parseInt(b.rating) || 0
          aValue = aRating
          bValue = bRating
          break
        case 'name':
          aValue = a.store_name.toLowerCase()
          bValue = b.store_name.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [suppliers, sortField, sortDirection])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b-2 border-black py-20 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
            Supplier Search
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-medium">
            Made in China • Top 5 Best Suppliers
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-16 bg-white">
        <form onSubmit={handleSearch} className="mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 border-4 border-black shadow-[8px_8px_0_0_#000] bg-white p-2">
              <input
                type="text"
                value={productName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
                placeholder="Enter product name to search..."
                className="flex-1 px-6 py-5 text-lg border-0 outline-none bg-transparent text-black placeholder-gray-500 font-medium"
                disabled={loading}
              />
              <button 
                type="submit" 
                className="px-10 py-5 bg-black text-white text-base font-bold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide flex items-center gap-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="relative w-8 h-8 overflow-hidden">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                        </svg>
                      </div>
                    </div>
                    Searching...
                  </>
                ) : (
                  'Find Suppliers'
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="max-w-4xl mx-auto mb-12 border-4 border-red-500 bg-red-50 p-6">
            <p className="text-lg text-red-700 font-semibold flex items-center gap-3">
              <span className="text-2xl">!</span>
              {error}
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-32">
            <div className="inline-flex flex-col items-center gap-6">
              <div className="relative w-64 h-16 overflow-hidden">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 animate-[drive_2s_linear_infinite]">
                  <svg className="w-16 h-16 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div className="h-full bg-black animate-[road_2s_linear_infinite]"></div>
                </div>
              </div>
              <p className="text-xl text-black font-bold uppercase tracking-wide">Searching for the best suppliers...</p>
            </div>
          </div>
        )}

        {!loading && hasSearched && suppliers.length === 0 && !error && (
          <div className="max-w-4xl mx-auto text-center py-32 border-4 border-gray-300 bg-gray-50">
            <p className="text-2xl text-gray-700 font-semibold mb-2">No suppliers found</p>
            <p className="text-lg text-gray-500">Try a different product name</p>
          </div>
        )}

        {!loading && suppliers.length > 0 && (
          <div className="mt-16 space-y-12">
            {/* Suppliers Table */}
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 text-center">
                Постачальники
              </h2>
              <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">#</th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide cursor-pointer hover:bg-gray-800 transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            Постачальник
                            {sortField === 'name' && (
                              <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wide">Товар</th>
                        <th 
                          className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wide cursor-pointer hover:bg-gray-800 transition-colors"
                          onClick={() => handleSort('price')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Ціна
                            {sortField === 'price' && (
                              <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wide">MOQ</th>
                        <th 
                          className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wide cursor-pointer hover:bg-gray-800 transition-colors"
                          onClick={() => handleSort('rating')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            Рейтинг
                            {sortField === 'rating' && (
                              <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wide">Дія</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSuppliers.map((supplier: Supplier, index: number) => {
                        const priceValue = parsePrice(supplier.price);
                        const allPrices = sortedSuppliers.map((s: Supplier) => parsePrice(s.price)).filter((p: number) => p !== Infinity);
                        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : Infinity;
                        const isBestPrice = priceValue !== Infinity && priceValue === minPrice;
                        
                        return (
                          <tr 
                            key={index}
                            className={`border-b-2 border-gray-300 hover:bg-gray-50 transition-colors ${
                              isBestPrice ? 'bg-green-50 border-green-400' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <div className="w-12 h-12 bg-black text-white flex items-center justify-center text-xl font-bold">
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <a 
                                href={supplier.store_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-lg font-bold text-black hover:text-purple-600 transition-colors underline"
                              >
                                {supplier.store_name}
                              </a>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-base font-semibold text-gray-800">{supplier.product_name}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-2xl font-bold ${isBestPrice ? 'text-green-600' : 'text-black'}`}>
                                  {supplier.detailed_price !== 'Not available' ? supplier.detailed_price : supplier.price}
                                </span>
                                {isBestPrice && (
                                  <span className="text-xs font-bold text-green-600 uppercase bg-green-100 px-2 py-1 rounded">
                                    Найкраща ціна
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="text-base font-semibold text-gray-700">
                                {supplier.moq !== 'Not available' ? supplier.moq : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="text-lg font-bold text-black">{supplier.rating}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <a 
                                href={supplier.product_url || supplier.store_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors duration-200 uppercase tracking-wide border-2 border-black"
                              >
                                Переглянути
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                                </svg>
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t-2 border-black py-12 px-6 bg-black text-white mt-auto">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-base font-semibold">
            © 2025 Supplier Search
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
