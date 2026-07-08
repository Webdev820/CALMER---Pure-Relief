import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Loader, Modal } from '../../components/Shared'
import LiveMap from '../../components/LiveMap'
import { Check, Star, Bike } from '../../utils/icons'
import api from '../../utils/api'

export default function Orders() {
  const { socket, toast } = useApp()
  const [orders, setOrders] = useState(null)
  const [courier, setCourier] = useState(null)
  const [tab, setTab] = useState('All')
  const [reviewFor, setReviewFor] = useState(null)
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')

  const load = () => api.get('/orders').then(r => setOrders(r.data))
  useEffect(() => {
    load()
    const s = socket()
    if (!s) return
    const onPos = p => setCourier({ lat: p.latitude, lng: p.longitude, orderId: p.orderId })
    const onUpd = () => load()
    s.on('courier_position', onPos); s.on('order_update', onUpd)
    return () => { s.off('courier_position', onPos); s.off('order_update', onUpd) }
  }, [])

  const submitReview = async () => {
    try {
      await api.put(`/orders/${reviewFor}/review`, { rating, review })
      toast('Thank You', 'Your experience shapes our quality', 'success')
      setReviewFor(null); setReview(''); load()
    } catch (err) { toast('Review', err.response?.data?.error || 'Failed', 'error') }
  }

  const filtered = (orders || []).filter(o =>
    tab === 'All' ? true : tab === 'Delivered' ? o.deliveryStatus === 'delivered' : o.deliveryStatus !== 'delivered')

  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-28">
      <h1 className="font-serif text-4xl gold-grad-text font-bold text-center mb-6">My Orders</h1>
      <div className="flex justify-center gap-2 mb-6">
        {['All', 'In Transit', 'Delivered'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-6 py-2 rounded-full text-sm transition ${tab === t ? 'gold-grad font-semibold' : 'glass text-cream'}`}>{t}</button>
        ))}
      </div>
      {!orders ? <Loader label="Loading orders" /> : filtered.length === 0 ? <p className="text-muted text-center py-16">No orders yet</p> :
        filtered.map(o => {
          const stepIdx = o.deliveryStatus === 'delivered' ? 3 : o.deliveryStatus === 'on_the_way' ? 1 : 0
          return (
            <article key={o._id} className="glass rounded-3xl p-6 mb-5 fade-up">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-serif text-lg text-white font-bold">Order #{o.orderNumber}</p>
                  <p className="text-muted text-xs">{new Date(o.createdAt).toLocaleString()}</p>
                  <p className="gold-text font-serif text-2xl font-bold mt-1">${o.totalAmount.toFixed(2)}</p>
                </div>
                <span className={`badge ${o.deliveryStatus === 'delivered' ? 'bg-[#39D98A]/15 text-[#39D98A] border border-[#39D98A]/40' : 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/40'}`}>
                  {o.deliveryStatus.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center mt-5 mb-2">
                {['Confirmed', 'On the way', 'Near you', 'Delivered'].map((lbl, i) => (
                  <div key={lbl} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center border ${i <= stepIdx ? 'gold-grad border-transparent' : 'border-[#8D8D8D] text-muted'}`}>
                        {i <= stepIdx ? <Check size={14} /> : <span className="w-2 h-2 rounded-full bg-current" />}
                      </span>
                      <span className={`text-[9px] mt-1.5 ${i <= stepIdx ? 'text-[#FFD700]' : 'text-muted'}`}>{lbl}</span>
                    </div>
                    {i < 3 && <span className={`h-px flex-1 -mt-4 ${i < stepIdx ? 'bg-[#FFD700]' : 'bg-white/15'}`} />}
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1">
                {o.products.map((p, i) => (
                  <p key={i} className="text-cream text-sm flex justify-between"><span>{p.name} x{p.quantity}</span><span className="gold-text">${(p.price * p.quantity).toFixed(2)}</span></p>
                ))}
              </div>
              {o.deliveryStatus === 'on_the_way' && o.liveLocation?.pinned && (
                <div className="mt-4">
                  <p className="gold-text text-sm font-semibold mb-2 flex items-center gap-2"><Bike size={16} /> Your order is on the way - live tracking</p>
                  <LiveMap client={{ lat: o.liveLocation.latitude, lng: o.liveLocation.longitude }}
                    courier={courier && courier.orderId === String(o._id) ? courier : null} height={240} />
                </div>
              )}
              {o.deliveryStatus === 'delivered' && !o.rating && (
                <button onClick={() => setReviewFor(o._id)} className="btn-outline w-full py-3 mt-4 text-sm">RATE YOUR EXPERIENCE</button>
              )}
              {o.rating && (
                <div className="flex items-center gap-1 mt-4">{[...Array(o.rating)].map((_, i) => <Star key={i} size={16} />)}<span className="text-muted text-xs ml-2">Thank you for your review</span></div>
              )}
            </article>
          )
        })}

      <Modal open={!!reviewFor} onClose={() => setReviewFor(null)}>
        <div className="text-center">
          <h2 className="font-script text-4xl gold-grad-text">What Did You Experience Today?</h2>
          <p className="text-cream text-sm mt-2">Your experience shapes our quality.</p>
          <div className="flex justify-center gap-3 mt-6">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className={`transition ${n <= rating ? 'scale-110' : 'opacity-40'}`}><Star size={32} filled={n <= rating} /></button>
            ))}
          </div>
          <p className="gold-text text-sm mt-2 font-semibold">{['Poor', 'Average', 'Good', 'Very Good', 'Amazing'][rating - 1]}</p>
          <textarea className="field mt-5" rows="3" placeholder="Tell us about your CALMER experience..." value={review} onChange={e => setReview(e.target.value)} />
          <button onClick={submitReview} className="btn-gold w-full py-4 mt-4">SUBMIT REVIEW</button>
        </div>
      </Modal>
    </main>
  )
}
