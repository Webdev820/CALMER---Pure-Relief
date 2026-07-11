import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Loader } from '../../components/Shared'
import InstallAppButton from '../../components/InstallApp'
import { Send, UserI, Leaf, Shield, Logout } from '../../utils/icons'
import api from '../../utils/api'

export function Vibe() {
  const { user, socket } = useApp()
  const [convos, setConvos] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [msg, setMsg] = useState('')
  const endRef = useRef(null)

  const load = async () => {
    const { data } = await api.get('/chats')
    setConvos(data)
    setActiveId(id => id || data[0]?._id || null)
  }
  useEffect(() => {
    load()
    const s = socket()
    if (!s) return
    const onMsg = () => load()
    s.on('admin_message', onMsg)
    return () => s.off('admin_message', onMsg)
  }, [])

  const active = (convos || []).find(c => c._id === activeId)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [active?.messages?.length])

  const send = async e => {
    e.preventDefault()
    if (!msg.trim() || !active) return
    await api.post(`/chats/${active.orderId?._id || active.orderId}`, { message: msg })
    setMsg(''); load()
  }

  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-28">
      <h1 className="font-serif text-3xl gold-grad-text font-bold text-center mb-2">CALMER VIBE</h1>
      <p className="text-muted text-xs text-center uppercase tracking-[.25em] mb-6">Direct line to your CALMER team</p>
      {!convos ? <Loader /> : convos.length === 0 ? (
        <p className="text-muted text-center py-16">Place an order to start vibing with the CALMER team.</p>
      ) : (
        <div className="glass rounded-3xl overflow-hidden flex flex-col" style={{ height: '65vh' }}>
          <div className="p-4 border-b border-[rgba(255,215,0,0.15)] flex gap-2 overflow-x-auto">
            {convos.map(c => (
              <button key={c._id} onClick={() => setActiveId(c._id)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs transition ${activeId === c._id ? 'gold-grad font-semibold' : 'bg-white/5 text-cream'}`}>
                #{c.orderId?.orderNumber || 'Order'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {active?.messages?.map((m, i) => {
              const mine = m.senderName === user.username
              const system = m.type === 'system' || m.type === 'call_initiation'
              return system ? (
                <p key={i} className="text-center text-muted text-xs italic py-1">{m.message}</p>
              ) : (
                <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 text-sm ${mine ? 'chat-bubble-me' : 'chat-bubble-them text-cream'}`}>
                    {!mine && <p className="text-[#FFD700] text-[10px] font-bold mb-0.5">{m.senderName}</p>}
                    {m.message}
                    <p className={`text-[9px] mt-1 ${mine ? 'text-black/50' : 'text-muted'}`}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="p-4 border-t border-[rgba(255,215,0,0.15)] flex gap-3">
            <input className="field py-3 text-sm" placeholder="Message the CALMER team..." value={msg} onChange={e => setMsg(e.target.value)} />
            <button aria-label="Send message" className="btn-gold w-12 h-12 rounded-full flex items-center justify-center shrink-0"><Send size={18} /></button>
          </form>
        </div>
      )}
    </main>
  )
}

export function Profile() {
  const { user, logout } = useApp()
  const nav = useNavigate()
  const [stats, setStats] = useState({ orders: 0, spent: 0 })
  useEffect(() => {
    api.get('/orders').then(r => setStats({
      orders: r.data.length,
      spent: r.data.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0)
    }))
  }, [])
  return (
    <main className="max-w-lg mx-auto px-4 pt-8 pb-28 text-center">
      <div className="w-28 h-28 mx-auto rounded-full border-2 border-[#FFD700] shadow-2xl shadow-[#FFD700]/30 flex items-center justify-center glass">
        <span className="text-[#FFD700]"><UserI size={48} /></span>
      </div>
      <h1 className="font-serif text-3xl gold-grad-text font-bold mt-4">{user.username}</h1>
      <p className="text-muted text-xs mt-1 flex items-center justify-center gap-1.5"><Leaf size={12} /> Wellness Member</p>
      <span className="badge bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/40 inline-block mt-3">21+ VERIFIED</span>
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="glass rounded-2xl p-5"><p className="font-serif text-3xl gold-text font-bold">{stats.orders}</p><p className="text-muted text-xs mt-1">Total Orders</p></div>
        <div className="glass rounded-2xl p-5"><p className="font-serif text-3xl gold-text font-bold">${stats.spent.toFixed(0)}</p><p className="text-muted text-xs mt-1">Total Spent</p></div>
      </div>
      <div className="glass rounded-2xl p-5 mt-4 text-left">
        <h2 className="gold-text font-serif font-bold mb-3">Personal Information</h2>
        <p className="text-cream text-sm py-1.5 border-b border-white/5 flex justify-between"><span className="text-muted">Username</span>{user.username}</p>
        <p className="text-cream text-sm py-1.5 border-b border-white/5 flex justify-between"><span className="text-muted">Email</span>{user.email || 'Not set'}</p>
        <p className="text-cream text-sm py-1.5 flex justify-between"><span className="text-muted">Phone</span>{user.phone || 'Not set'}</p>
      </div>
      <div className="mt-4">
        <InstallAppButton variant="bar" />
      </div>
      <div className="glass rounded-2xl p-5 mt-4 text-left">
        <h2 className="gold-text font-serif font-bold mb-2 flex items-center gap-2"><Shield size={16} /> Legal Compliance</h2>
        <p className="text-muted text-xs">Terms of Service, Age Verification & Responsible Use. Use responsibly. 21+ only.</p>
      </div>
      <button onClick={() => { logout(); nav('/') }} className="btn-outline w-full py-3.5 mt-6 flex items-center justify-center gap-2"><Logout size={18} /> Logout</button>
    </main>
  )
}
