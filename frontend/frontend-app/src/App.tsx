import { useState } from 'react'

interface Supplier {
  product_name: string
  product_url: string
  price: string
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

function App() {
  const [productName, setProductName] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

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
                onChange={(e) => setProductName(e.target.value)}
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
          <div className="mt-16">
            <div className="space-y-6 max-w-6xl mx-auto">
              {suppliers.map((supplier, index) => (
                <div 
                  key={index} 
                  className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] hover:shadow-[12px_12px_0_0_#000] transition-all duration-200"
                >
                  <div className="p-8 md:p-10">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-black text-white flex items-center justify-center text-4xl font-bold">
                          {index + 1}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl md:text-3xl font-bold text-black mb-6 leading-tight">
                          {supplier.product_name}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                          <div className="border-2 border-gray-300 p-4 bg-gray-50">
                            <div className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Store</div>
                            <a 
                              href={supplier.store_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-lg font-bold text-black hover:text-purple-600 transition-colors underline"
                            >
                              {supplier.store_name}
                            </a>
                          </div>
                          <div className="border-2 border-gray-300 p-4 bg-gray-50">
                            <div className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">Rating</div>
                            <div className="text-lg font-bold text-black">{supplier.rating}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <a 
                          href={supplier.store_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 px-8 py-5 bg-black text-white text-base font-bold hover:bg-gray-800 transition-colors duration-200 uppercase tracking-wide border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000]"
                        >
                          View Store
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
