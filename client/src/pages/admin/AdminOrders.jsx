import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { Loader, Modal } from '../../components/Shared.jsx'
import { statusLabel } from './Overview.jsx'
import { Pin, Chat, Truck, Check, Eye, MapI } from '../../utils/icons.jsx'

const TABS = ['all', 'pending', 'processing', 'on_the_way', 'delivered']
const NEXT = { pending: 'processing', processing: 'on_the_way', on_the_way: 'delivered' }
const NEXT_LABEL = { pending: 'Start Processing', processing: 'Start Delivery', on_the_way: 'Mark Delivered' }

export default function AdminOrders() {
  const { api, toast, socket } = useApp()
  const nav = useNavigate()
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('all')
  const [view, setView] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try { setOrders((await api.get('/orders')).data) } catch { }
    setLoading(false)
  }
  useEffect(() => {
    load()
    const s = socket()
    if (s) { s.on('new_order', load); s.on('location_pinned', load) }
    return () => { if (s) { s.off('new_order', load); s.off('location_pinned', load) } }
  }, [])

  const advance = async (o) => {
    const next = NEXT[o.deliveryStatus]
    if (!next) return
    setBusy(true)
    try {
      await api.put(`/orders/${o._id}/status`, { deliveryStatus: next })
      if (next === 'on_the_way') {
        const s = socket(); s && s.emit('delivery_started', { orderId: o._id })
        toast('Delivery Started', `Order ${o.orderNumber} is on the way. Open Live Tracking.`, 'gold')
      } else {
        toast('Status Updated', `Order ${o.orderNumber} → ${statusLabel(next)}`, 'success')
      }
      await load()
      setView(null)
    } catch { toast('Error', 'Status update failed', 'error') }
    setBusy(false)
  }

  const filtered = tab === 'all' ? orders : orders.filter(o => o.deliveryStatus === tab)

  if (loading) return <Loader label="Loading orders" />

  return (
    <section id="admin-orders" className="space-y-6 animate-fadeInUp">
      <header>
        <h1 className="font-serif text-3xl text-cream">Order <span className="gold-grad-text">Management</span></h1>
        <p className="text-muted text-sm mt-1">Track, update and fulfil every CALMER order.</p>
      </header>

      <nav className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition ${tab === t ? 'bg-rich-gold text-deep-black' : 'glass text-muted hover:text-cream'}`}>
            {t === 'all' ? 'All' : statusLabel(t)} ({t === 'all' ? orders.length : orders.filter(o => o.deliveryStatus === t).length})
          </button>
        ))}
      </nav>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm glass rounded-2xl p-8 text-center">No orders in this category yet.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <article key={o._id} className="glass rounded-2xl p-5 card-hover">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-rich-gold font-semibold">{o.orderNumber}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${o.paymentStatus === 'paid' ? 'bg-[rgba(57,217,138,0.15)] text-success' : 'bg-[rgba(255,193,7,0.15)] text-warm-amber'}`}>{o.paymentStatus}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 text-cream">{statusLabel(o.deliveryStatus)}</span>
                    {o.liveLocation?.pinned && <span className="flex items-center gap-1 text-[11px] text-success"><Pin size={12} /> Location pinned</span>}
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {o.clientId?.username} • {o.products?.map(p => `${p.quantity}× ${p.name}`).join(', ')}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{new Date(o.createdAt).toLocaleString()} • {o.deliveryAddress?.street}, {o.deliveryAddress?.city}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-cream mr-2">${o.totalAmount?.toFixed(2)}</span>
                  <button onClick={() => setView(o)} className="btn-outline !py-2 !px-3 text-xs flex items-center gap-1"><Eye size={14} /> View</button>
                  <button onClick={() => nav('/admin/vibe', { state: { orderId: o._id } })} className="btn-outline !py-2 !px-3 text-xs flex items-center gap-1"><Chat size={14} /> Message</button>
                  {o.deliveryStatus === 'on_the_way' && (
                    <button onClick={() => nav('/admin/tracking', { state: { orderId: o._id } })} className="btn-outline !py-2 !px-3 text-xs flex items-center gap-1 !border-[#4FA3FF] !text-[#4FA3FF]"><MapI size={14} /> Track</button>
                  )}
                  {NEXT[o.deliveryStatus] && (
                    <button disabled={busy} onClick={() => advance(o)} className="btn-gold !py-2 !px-4 text-xs flex items-center gap-1">
                      {NEXT[o.deliveryStatus] === 'delivered' ? <Check size={14} /> : <Truck size={14} />} {NEXT_LABEL[o.deliveryStatus]}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={!!view} onClose={() => setView(null)} wide>
        {view && (
          <div className="space-y-4">
            <h3 className="font-serif text-2xl text-cream">Order <span className="gold-grad-text">{view.orderNumber}</span></h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="glass rounded-xl p-4">
                <p className="text-muted text-xs uppercase mb-2">Client</p>
                <p className="text-cream">{view.clientId?.username}</p>
                <p className="text-muted text-xs mt-2 uppercase mb-1">Delivery Address</p>
                <p className="text-cream">{view.deliveryAddress?.street}, {view.deliveryAddress?.city}</p>
                {view.deliveryAddress?.landmark && <p className="text-muted text-xs">Landmark: {view.deliveryAddress.landmark}</p>}
                {view.deliveryAddress?.notes && <p className="text-muted text-xs">Notes: {view.deliveryAddress.notes}</p>}
                <p className={`text-xs mt-2 ${view.liveLocation?.pinned ? 'text-success' : 'text-warm-amber'}`}>
                  {view.liveLocation?.pinned ? `Live location pinned (${view.liveLocation.latitude?.toFixed(5)}, ${view.liveLocation.longitude?.toFixed(5)})` : 'Live location not pinned yet'}
                </p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-muted text-xs uppercase mb-2">Items</p>
                {view.products?.map((p, i) => (
                  <div key={i} className="flex justify-between py-1 text-cream">
                    <span>{p.quantity}× {p.name}</span><span>${(p.price * p.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 mt-2 border-t border-white/10 text-muted text-xs">
                  <span>Delivery fee</span><span>${(view.deliveryFee || 10).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-rich-gold">
                  <span>Total</span><span>${view.totalAmount?.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted mt-2">Payment: {view.paymentMethod} • {view.paymentStatus}</p>
              </div>
            </div>
            {NEXT[view.deliveryStatus] && (
              <button disabled={busy} onClick={() => advance(view)} className="btn-gold w-full">{NEXT_LABEL[view.deliveryStatus]}</button>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}
