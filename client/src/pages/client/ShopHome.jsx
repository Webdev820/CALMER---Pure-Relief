import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Loader } from '../../components/Shared'
import api from '../../utils/api'

const CATEGORIES = ['All', 'Flower', 'Edibles', 'Oils', 'Vapes', 'Concentrates', 'Accessories']
const CAT_IMG = { Flower: '/assets/products/cat-flower.jpg', Edibles: '/assets/products/cat-edibles.jpg', Concentrates: '/assets/products/cat-concentrates.jpg', Vapes: '/assets/products/cat-vaporizers.jpg' }

export default function ShopHome() {
  const { addToCart } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const search = new URLSearchParams(loc.search).get('search') || ''
  const [products, setProducts] = useState(null)
  const [cat, setCat] = useState('All')

  useEffect(() => {
    api.get('/products', { params: { category: cat, search } }).then(r => setProducts(r.data))
  }, [cat, search])

  const newArrivals = (products || []).filter(p => p.isNewArrival)

  return (
    <main className="max-w-7xl mx-auto px-4 pb-28 pt-6">
      {newArrivals.length > 0 && (
        <section id="latest-arrivals" className="glass rounded-3xl p-6 mb-8 relative overflow-hidden fade-up">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FFD700]/10 blur-3xl rounded-full" />
          <h2 className="font-serif text-2xl gold-grad-text font-bold mb-1">New This Week</h2>
          <p className="text-muted text-sm mb-5">Fresh premium arrivals, curated for you</p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {newArrivals.map(p => (
              <button key={p._id} onClick={() => nav(`/shop/checkout?product=${p._id}`)} className="shrink-0 w-44 text-left group">
                <div className="relative img-zoom rounded-2xl h-40 border border-[rgba(255,215,0,0.28)]">
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-2xl" loading="lazy" />
                  <span className="absolute top-2 left-2 badge gold-grad">NEW</span>
                </div>
                <p className="gold-text text-sm font-semibold mt-2 truncate group-hover:underline">{p.name}</p>
                <p className="text-cream text-sm font-bold">${p.price}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6" role="tablist" aria-label="Product categories">
        {CATEGORIES.map(c => (
          <button key={c} role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
            className={`shrink-0 px-5 py-2 rounded-full text-sm transition ${cat === c ? 'gold-grad font-semibold' : 'glass text-cream hover:text-[#FFD700]'}`}>
            {c}
          </button>
        ))}
      </div>

      {!products ? <Loader label="Loading products" /> : (
        <section id="product-grid" className="grid lg:grid-cols-3 sm:grid-cols-2 gap-6">
          {products.map(p => (
            <article key={p._id} className="glass rounded-3xl overflow-hidden card-hover">
              <div className="img-zoom h-52 relative">
                <img src={p.imageUrl || CAT_IMG[p.category] || '/assets/products/cat-flower.jpg'} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                {p.isNewArrival && <span className="absolute top-3 left-3 badge gold-grad">NEW</span>}
                {p.stock <= 5 && <span className="absolute top-3 right-3 badge bg-[#FF5C5C]/80 text-white">LOW STOCK</span>}
              </div>
              <div className="p-5">
                <h3 className="font-serif text-lg gold-text font-bold leading-snug">{p.name}</h3>
                <p className="text-cream text-xs mt-1.5 line-clamp-2">{p.description}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {p.thcContent && <span className="badge bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">{p.thcContent}</span>}
                  {p.cbdContent && <span className="badge bg-[#39D98A]/10 text-[#39D98A] border border-[#39D98A]/30">{p.cbdContent}</span>}
                </div>
                <div className="flex items-center justify-between mt-4 gap-2">
                  <span className="text-2xl gold-text font-bold">${p.price}</span>
                  <div className="flex gap-2">
                    <button onClick={() => addToCart(p)} className="btn-outline px-3.5 py-2 text-xs">ADD TO CART</button>
                    <button onClick={() => nav(`/shop/checkout?product=${p._id}`)} className="btn-gold px-3.5 py-2 text-xs">ORDER NOW</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {products.length === 0 && <p className="text-muted col-span-full text-center py-16">No products found.</p>}
        </section>
      )}
    </main>
  )
}
