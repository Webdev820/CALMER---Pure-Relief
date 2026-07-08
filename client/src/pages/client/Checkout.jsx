import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Modal } from '../../components/Shared'
import LiveMap from '../../components/LiveMap'
import { Pin, Check, Box, Bike, ArrowR, Shield, Lock, Wallet, Cash, Card } from '../../utils/icons'
import api from '../../utils/api'

export default function Checkout() {
  const { cart, clearCart, toast } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const singleId = new URLSearchParams(loc.search).get('product')
  const [single, setSingle] = useState(null)
  const [addr, setAddr] = useState({ street: '', city: '', landmark: '', notes: '' })
  const [pinned, setPinned] = useState(null)
  const [payMethod, setPayMethod] = useState('paypal')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const [showPinPrompt, setShowPinPrompt] = useState(false)

  useEffect(() => { if (singleId) api.get(`/products/${singleId}`).then(r => setSingle(r.data)).catch(() => { }) }, [singleId])

  const items = single ? [{ ...single, quantity: 1 }] : cart
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const total = subtotal + 10

  const pinLocation = (after) => {
    if (!navigator.geolocation) return toast('Location', 'Geolocation is not supported by this browser', 'error')
    navigator.geolocation.getCurrentPosition(
      pos => { setPinned({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }); toast('Location Pinned', 'Your live location has been pinned for faster delivery', 'success'); after && after(pos) },
      () => toast('Location', 'Could not access your location. Check permissions.', 'error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const pay = async () => {
    if (!items.length) return toast('Cart Empty', 'Add products before checkout', 'error')
    if (!addr.street || !addr.city) return toast('Delivery Details', 'Street and city are required', 'error')
    setBusy(true)
    try {
      const { data: order } = await api.post('/orders', {
        products: items.map(i => ({ productId: i._id, quantity: i.quantity })),
        deliveryAddress: addr,
        liveLocation: pinned || undefined
      })
      await api.post('/payments/create-intent', { orderId: order._id })
      const { data } = await api.post('/payments/confirm', { orderId: order._id, paymentMethod: payMethod })
      if (!single) clearCart()
      setDone(data.order)
      if (!pinned) setShowPinPrompt(true)
    } catch (err) {
      toast('Payment Failed', err.response?.data?.error || 'Try again', 'error')
    } finally { setBusy(false) }
  }

  const pinAfterOrder = () => pinLocation(async pos => {
    await api.put(`/orders/${done._id}/location`, { latitude: pos.coords.latitude, longitude: pos.coords.longitude })
    setShowPinPrompt(false)
  })

  if (done) return (
    <main className="max-w-lg mx-auto px-4 pt-10 pb-28 text-center fade-up">
      <div className="w-24 h-24 mx-auto rounded-full gold-grad flex items-center justify-center glow-pulse mb-6"><Check size={44} /></div>
      <h1 className="font-script text-5xl gold-grad-text">Order Confirmed!</h1>
      <p className="text-muted text-xs tracking-[.3em] uppercase mt-4">Order Number</p>
      <p className="font-serif text-2xl text-white font-bold">#{done.orderNumber}</p>
      <div className="glass rounded-3xl p-6 mt-6 text-left">
        <h2 className="gold-text font-serif font-bold mb-4 flex items-center gap-2"><Box size={18} /> Order Summary</h2>
        {done.products.map((p, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-white/5 text-sm">
            <span className="text-cream">{p.name} <span className="text-muted">x{p.quantity}</span></span>
            <span className="gold-text font-semibold">${(p.price * p.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-3 font-serif text-lg gold-text font-bold"><span>TOTAL</span><span>${done.totalAmount.toFixed(2)}</span></div>
      </div>
      <div className="glass rounded-3xl p-5 mt-4 flex items-center gap-4 text-left">
        <span className="w-14 h-14 rounded-full border border-[#FFD700]/50 flex items-center justify-center text-[#FFD700]"><Bike size={26} /></span>
        <div>
          <p className="text-muted text-xs uppercase tracking-wider">Estimated Delivery</p>
          <p className="gold-text font-serif text-xl font-bold">25 MINUTES</p>
          <p className="text-cream text-xs">We're preparing your order</p>
        </div>
      </div>
      <p className="text-cream text-sm mt-5">Confirmed! Payment received and your order is being worked on. You will receive a message shortly in our CALMER system about your order.</p>
      <div className="flex gap-3 mt-6">
        <button onClick={() => nav('/shop/orders')} className="btn-gold flex-1 py-3.5 flex items-center justify-center gap-2">TRACK ORDER <ArrowR size={16} /></button>
        <button onClick={() => nav('/shop')} className="btn-outline flex-1 py-3.5">CONTINUE SHOPPING</button>
      </div>
      <Modal open={showPinPrompt} onClose={() => setShowPinPrompt(false)}>
        <div className="text-center">
          <span className="text-[#FFD700] inline-block mb-3"><Pin size={36} /></span>
          <h2 className="font-serif text-2xl gold-text font-bold">PIN Location Now</h2>
          <p className="text-cream text-sm mt-3">Pinning your live location enables faster, smarter delivery. Our courier rides straight to where you are standing.</p>
          <button onClick={pinAfterOrder} className="btn-gold glow-pulse w-full py-4 mt-6">PIN MY LOCATION</button>
        </div>
      </Modal>
    </main>
  )

  return (
    <main className="max-w-5xl mx-auto px-4 pt-6 pb-28">
      <h1 className="font-serif text-3xl md:text-4xl gold-grad-text font-bold text-center mb-8">Checkout</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <section className="glass rounded-3xl p-6 h-fit">
          <h2 className="gold-text font-serif text-xl font-bold mb-4">Order Summary</h2>
          {items.length === 0 && <p className="text-muted text-sm">No items. <Link to="/shop" className="gold-text underline">Browse products</Link></p>}
          {items.map(i => (
            <div key={i._id} className="flex gap-3 py-3 border-b border-white/5">
              <img src={i.imageUrl} alt={i.name} className="w-16 h-16 rounded-xl object-cover border border-[rgba(255,215,0,0.2)]" />
              <div className="flex-1">
                <p className="gold-text text-sm font-semibold">{i.name}</p>
                <p className="text-muted text-xs">Qty: {i.quantity}</p>
              </div>
              <span className="text-cream font-semibold">${(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-cream"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-cream"><span>Delivery Fee</span><span>$10.00</span></div>
            <div className="flex justify-between gold-text font-serif text-xl font-bold pt-2"><span>TOTAL</span><span>${total.toFixed(2)}</span></div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="glass rounded-3xl p-6">
            <h2 className="gold-text font-serif text-xl font-bold mb-1 text-center">Delivery Address</h2>
            <p className="text-muted text-xs text-center mb-5 uppercase tracking-wider">Enter your delivery location</p>
            <div className="space-y-3">
              <input className="field" placeholder="Street address" value={addr.street} onChange={e => setAddr({ ...addr, street: e.target.value })} />
              <input className="field" placeholder="Town / City" value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} />
              <input className="field" placeholder="Popular building / well-known local area" value={addr.landmark} onChange={e => setAddr({ ...addr, landmark: e.target.value })} />
              <textarea className="field" rows="2" maxLength="150" placeholder="Delivery instructions (optional)" value={addr.notes} onChange={e => setAddr({ ...addr, notes: e.target.value })} />
            </div>
            <button onClick={() => pinLocation()} className={`w-full py-4 mt-4 rounded-full font-semibold flex items-center justify-center gap-2 transition ${pinned ? 'bg-[#39D98A]/15 text-[#39D98A] border border-[#39D98A]/50' : 'btn-gold glow-pulse'}`}>
              <Pin size={18} /> {pinned ? 'LOCATION PINNED' : 'PIN LIVE LOCATION'}
            </button>
            {pinned && <div className="mt-4"><LiveMap client={{ lat: pinned.latitude, lng: pinned.longitude }} height={180} /></div>}
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="gold-text font-serif text-xl font-bold mb-5 text-center">Payment Method</h2>
            {[
              { id: 'paypal', label: 'PayPal', desc: 'Fast & secure payment with PayPal', icon: <Wallet size={22} /> },
              { id: 'card', label: 'Credit / Debit Card', desc: 'Pay securely using your card', icon: <Card size={22} /> },
              { id: 'cash', label: 'Cash on Delivery', desc: 'Pay in cash when your order is delivered', icon: <Cash size={22} /> },
            ].map(m => (
              <button key={m.id} onClick={() => setPayMethod(m.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border mb-3 text-left transition ${payMethod === m.id ? 'border-[#FFD700] bg-[#FFD700]/5 shadow-lg shadow-[#FFD700]/10' : 'border-[rgba(255,215,0,0.2)] hover:border-[#FFD700]/50'}`}>
                <span className={`w-5 h-5 rounded-full border-2 shrink-0 ${payMethod === m.id ? 'border-[#FFD700] bg-[#FFD700]' : 'border-[#8D8D8D]'}`} />
                <span className="text-[#FFD700]">{m.icon}</span>
                <span>
                  <span className="block text-white font-semibold text-sm">{m.label}</span>
                  <span className="block text-muted text-xs">{m.desc}</span>
                </span>
              </button>
            ))}
            <div className="grid grid-cols-3 gap-2 my-4 text-center">
              {[['100% SECURE', 'Your data is safe'], ['ENCRYPTED', 'Bank-level security'], ['DISCREET', 'Billed as CALMER Delivery']].map(([t, d]) => (
                <div key={t} className="py-2">
                  <span className="text-[#FFD700] inline-block mb-1"><Shield size={16} /></span>
                  <p className="text-[#FFD700] text-[10px] font-bold">{t}</p>
                  <p className="text-muted text-[9px]">{d}</p>
                </div>
              ))}
            </div>
            <button onClick={pay} disabled={busy || items.length === 0} className="btn-gold glow-pulse w-full py-5 font-serif text-xl tracking-wide">
              {busy ? 'PROCESSING...' : 'PLACE ORDER'}
            </button>
            <p className="text-center text-muted text-xs mt-2 flex items-center justify-center gap-1.5"><Lock size={12} /> Secure & Discreet Checkout</p>
          </div>
        </section>
      </div>
    </main>
  )
}
