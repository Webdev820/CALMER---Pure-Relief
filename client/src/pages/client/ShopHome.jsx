import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import api from '../../utils/api'

function ProductSkeleton() {
  return (
    <div className="glass rounded-3xl overflow-hidden">
      <div className="skeleton h-52 !rounded-b-none" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton h-7 w-16" />
          <div className="skeleton h-8 w-32 !rounded-full" />
        </div>
      </div>
    </div>
  )
}

const CATEGORIES = ['All', 'Flower', 'Edibles', 'Oils', 'Vapes', 'Concentrates', 'Accessories']
const CAT_IMG = { Flower: '/assets/products/golden-serenity.jpg', Edibles: '/assets/products/gummies.jpg', Oils: '/assets/products/cbd-tincture.jpg', Concentrates: '/assets/products/thc-diamonds.jpg', Vapes: '/assets/products/vaporizer.jpg', Accessories: '/assets/products/rolling-tray.jpg' }

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
                <div className="relative img-zoom rounded-2xl h-40 border border-[rgba(255,215,0,0.28)] bg-[#050505]">
                  <div className="absolute inset-0 rounded-2xl bg-cover bg-center blur-xl scale-110 opacity-40" style={{ backgroundImage: `url(${p.imageUrl})` }} aria-hidden="true" />
                  <img src={p.imageUrl} alt={p.name} className="relative w-full h-full object-contain rounded-2xl" loading="lazy" />
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

      {!products ? (
        <section className="grid lg:grid-cols-3 sm:grid-cols-2 gap-6" aria-busy="true" aria-label="Loading products">
          {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
        </section>
      ) : (
        <section id="product-grid" className="grid lg:grid-cols-3 sm:grid-cols-2 gap-6">
          {products.map(p => (
            <article key={p._id} className="glass rounded-3xl overflow-hidden card-hover">
              <div className="img-zoom h-52 relative bg-[#050505]">
                <div className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40" style={{ backgroundImage: `url(${p.imageUrl || CAT_IMG[p.category] || '/assets/products/golden-serenity.jpg'})` }} aria-hidden="true" />
                <img src={p.imageUrl || CAT_IMG[p.category] || '/assets/products/golden-serenity.jpg'} alt={p.name} className="relative w-full h-full object-contain" loading="lazy" />
                {p.isNewArrival && <span className="absolute top-3 left-3 badge gold-grad">NEW</span>}
                {p.stock === 0
                  ? <span className="absolute top-3 right-3 badge bg-black/80 text-[#FF5C5C] border border-[#FF5C5C]/60">SOLD OUT</span>
                  : p.stock <= 5 && <span className="absolute top-3 right-3 badge bg-[#FF5C5C]/80 text-white">LOW STOCK · {p.stock} LEFT</span>}
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
                    {p.stock === 0 ? (
                      <span className="px-4 py-2 text-xs rounded-full border border-[#FF5C5C]/40 text-[#FF5C5C] font-semibold">SOLD OUT</span>
                    ) : (
                      <>
                        <button onClick={() => addToCart(p)} className="btn-outline px-3.5 py-2 text-xs">ADD TO CART</button>
                        <button onClick={() => nav(`/shop/checkout?product=${p._id}`)} className="btn-gold px-3.5 py-2 text-xs">ORDER NOW</button>
                      </>
                    )}
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
