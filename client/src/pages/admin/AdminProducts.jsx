import React, { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Loader, Modal } from '../../components/Shared.jsx'
import { Plus, Edit, Trash, Leaf, Star } from '../../utils/icons.jsx'

const CATEGORIES = ['Flower', 'Edibles', 'Oils', 'Vapes', 'Concentrates', 'Accessories']
const EMPTY = { name: '', description: '', price: '', category: 'Flower', thcContent: '', cbdContent: '', imageUrl: '/assets/products/golden-serenity.jpg', stock: 50, featured: false, isNewArrival: false }

export default function AdminProducts() {
  const { api, toast } = useApp()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null) // null = closed, {} = new, {_id} = edit
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  const load = async () => {
    try { setProducts((await api.get('/products')).data) } catch { }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name || !form.price) return toast('Missing Fields', 'Name and price are required', 'error')
    setBusy(true)
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) || 0 }
    try {
      if (form._id) {
        await api.put(`/products/${form._id}`, payload)
        toast('Product Updated', `${form.name} saved`, 'success')
      } else {
        await api.post('/products', payload)
        toast('Product Added', form.isNewArrival ? `${form.name} added — all clients notified of the new arrival` : `${form.name} added to the catalog`, 'success')
      }
      setForm(null); await load()
    } catch { toast('Error', 'Save failed', 'error') }
    setBusy(false)
  }

  const del = async () => {
    setBusy(true)
    try {
      await api.delete(`/products/${confirmDel._id}`)
      toast('Product Removed', `${confirmDel.name} deleted`, 'success')
      setConfirmDel(null); await load()
    } catch { toast('Error', 'Delete failed', 'error') }
    setBusy(false)
  }

  if (loading) return <Loader label="Loading products" />

  return (
    <section id="admin-products" className="space-y-6 animate-fadeInUp">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-3xl text-cream">Product <span className="gold-grad-text">Management</span></h1>
          <p className="text-muted text-sm mt-1">Add, edit and retire products. New arrivals notify every client instantly.</p>
        </div>
        <button onClick={() => setForm({ ...EMPTY })} className="btn-gold flex items-center gap-2 text-sm"><Plus size={16} /> Add Product</button>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <article key={p._id} className="glass rounded-2xl overflow-hidden card-hover">
            <div className="relative h-40 overflow-hidden bg-[#050505]">
              <div className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-40" style={{ backgroundImage: `url(${p.imageUrl})` }} aria-hidden="true" />
              <img src={p.imageUrl} alt={p.name} className="relative w-full h-full object-contain img-zoom" />
              {p.isNewArrival && <span className="absolute top-3 left-3 bg-rich-gold text-deep-black text-[10px] font-bold px-2 py-1 rounded-full">NEW ARRIVAL</span>}
              <span className="absolute top-3 right-3 bg-black/70 text-cream text-[10px] px-2 py-1 rounded-full">{p.category}</span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-cream font-semibold">{p.name}</h3>
                <span className="text-rich-gold font-bold">${Number(p.price).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted mt-1 line-clamp-2">{p.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted mt-2">
                {p.thcContent && <span>{p.thcContent}</span>}
                {p.cbdContent && <span>{p.cbdContent}</span>}
                <span className={p.stock > 0 ? 'text-success' : 'text-alert'}>{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setForm({ ...EMPTY, ...p })} className="btn-outline flex-1 !py-2 text-xs flex items-center justify-center gap-1"><Edit size={13} /> Edit</button>
                <button onClick={() => setConfirmDel(p)} className="flex-1 py-2 rounded-xl border border-[rgba(255,92,92,0.4)] text-alert text-xs flex items-center justify-center gap-1 hover:bg-[rgba(255,92,92,0.1)] transition"><Trash size={13} /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} wide>
        {form && (
          <div className="space-y-4">
            <h3 className="font-serif text-2xl text-cream flex items-center gap-2">
              <Leaf size={20} className="text-rich-gold" /> {form._id ? 'Edit Product' : 'Add New Product'}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2">
                <span className="text-xs text-muted">Product Name</span>
                <input className="field mt-1" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Zkittlez Premium Flower" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs text-muted">Description</span>
                <textarea className="field mt-1 min-h-[70px]" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Smooth, fruity and relaxing..." />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Price (USD)</span>
                <input type="number" min="0" step="0.01" className="field mt-1" value={form.price} onChange={e => set('price', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Category</span>
                <select className="field mt-1" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted">THC Content</span>
                <input className="field mt-1" value={form.thcContent} onChange={e => set('thcContent', e.target.value)} placeholder="e.g. 24% THC" />
              </label>
              <label className="block">
                <span className="text-xs text-muted">CBD Content</span>
                <input className="field mt-1" value={form.cbdContent} onChange={e => set('cbdContent', e.target.value)} placeholder="e.g. 1% CBD" />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Stock</span>
                <input type="number" min="0" className="field mt-1" value={form.stock} onChange={e => set('stock', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs text-muted">Image URL</span>
                <input className="field mt-1" value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="/assets/products/..." />
              </label>
              {form.imageUrl && (
                <div className="sm:col-span-2 flex items-center gap-3">
                  <img src={form.imageUrl} alt="preview" className="w-20 h-20 rounded-xl object-contain bg-[#050505] border border-[rgba(255,215,0,0.3)]" onError={e => e.target.style.opacity = .2} />
                  <p className="text-xs text-muted">Image preview. Use /assets/products/* paths or any hosted image URL.</p>
                </div>
              )}
              <label className="flex items-center gap-3 sm:col-span-2 glass rounded-xl px-4 py-3 cursor-pointer">
                <input type="checkbox" checked={!!form.isNewArrival} onChange={e => set('isNewArrival', e.target.checked)} className="accent-[#FFD700] w-4 h-4" />
                <span className="text-sm text-cream flex items-center gap-2"><Star size={14} /> Mark as NEW ARRIVAL — broadcasts a notification to all clients</span>
              </label>
              <label className="flex items-center gap-3 sm:col-span-2 glass rounded-xl px-4 py-3 cursor-pointer">
                <input type="checkbox" checked={!!form.featured} onChange={e => set('featured', e.target.checked)} className="accent-[#FFD700] w-4 h-4" />
                <span className="text-sm text-cream">Featured — highlighted on the shop home carousel</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setForm(null)} className="btn-outline flex-1">Cancel</button>
              <button disabled={busy} onClick={save} className="btn-gold flex-1">{busy ? 'Saving…' : form._id ? 'Save Changes' : 'Add Product'}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)}>
        {confirmDel && (
          <div className="text-center space-y-4">
            <h3 className="font-serif text-xl text-cream">Delete {confirmDel.name}?</h3>
            <p className="text-sm text-muted">This will remove the product from the catalog permanently.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)} className="btn-outline flex-1">Cancel</button>
              <button disabled={busy} onClick={del} className="flex-1 py-3 rounded-xl bg-alert text-white font-semibold hover:opacity-90 transition">{busy ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}
