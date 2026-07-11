import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Logo } from '../../components/Shared'
import InstallAppButton from '../../components/InstallApp'
import { Cart as CartI, Bell, Search, Home, Box, Chat, UserI, Logout, Plus, Minus, Trash, Lock, ArrowR } from '../../utils/icons'
import api from '../../utils/api'

export function TopBar({ onCart }) {
  const { user, cart, notifCount, setNotifCount, logout } = useApp()
  const nav = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([])

  const openNotifs = async () => {
    setNotifOpen(!notifOpen); setNotifCount(0)
    if (!notifOpen) { const { data } = await api.get('/notifications'); setNotifs(data) }
  }

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-[rgba(255,215,0,0.15)]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/shop" className="shrink-0">
          <Logo />
          <p className="text-[10px] text-muted ml-14 -mt-1">{user?.username}</p>
        </Link>
        <div className="hidden md:flex flex-1 max-w-md relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"><Search size={16} /></span>
          <input id="search-input" className="field pl-11 py-2.5 text-sm" placeholder="Search products..."
            onKeyDown={e => e.key === 'Enter' && nav(`/shop?search=${encodeURIComponent(e.target.value)}`)} />
        </div>
        <div className="flex items-center gap-2">
          <InstallAppButton variant="compact" className="hidden md:flex" />
          <button onClick={openNotifs} aria-label="Notifications" className={`relative w-10 h-10 rounded-full border border-[rgba(255,215,0,0.3)] flex items-center justify-center text-[#FFD700] hover:bg-[#FFD700]/10 transition ${notifCount ? 'bell-shake' : ''}`}>
            <Bell size={18} />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF5C5C] text-white text-[10px] flex items-center justify-center font-bold">{notifCount}</span>}
          </button>
          <button onClick={onCart} aria-label="Cart" className="relative w-10 h-10 rounded-full border border-[rgba(255,215,0,0.3)] flex items-center justify-center text-[#FFD700] hover:bg-[#FFD700]/10 transition">
            <CartI size={18} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gold-grad text-[10px] flex items-center justify-center font-bold">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </button>
          <button onClick={() => { logout(); nav('/') }} aria-label="Logout" className="w-10 h-10 rounded-full border border-[rgba(255,215,0,0.3)] flex items-center justify-center text-cream hover:text-[#FF5C5C] hover:border-[#FF5C5C]/50 transition">
            <Logout size={17} />
          </button>
        </div>
      </div>
      {notifOpen && (
        <div className="absolute right-4 top-16 w-80 max-w-[92vw] glass rounded-2xl p-4 max-h-96 overflow-y-auto shadow-2xl">
          <h3 className="gold-text font-serif font-bold mb-3">Notifications</h3>
          {notifs.length === 0 ? <p className="text-muted text-sm">No notifications yet</p> :
            notifs.map(n => (
              <div key={n._id} className="py-2.5 border-b border-white/5 last:border-0">
                <p className="text-[#FFD700] text-xs font-semibold">{n.title}</p>
                <p className="text-cream text-xs mt-0.5">{n.message}</p>
              </div>
            ))}
        </div>
      )}
    </header>
  )
}

export function BottomNav() {
  const loc = useLocation()
  const items = [
    { to: '/shop', label: 'Home', icon: <Home size={20} /> },
    { to: '/shop/orders', label: 'Orders', icon: <Box size={20} /> },
    { to: '/shop/vibe', label: 'Vibe', icon: <Chat size={20} /> },
    { to: '/shop/profile', label: 'Account', icon: <UserI size={20} /> },
  ]
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur-lg border-t border-[rgba(255,215,0,0.2)]" aria-label="Main">
      <div className="max-w-md mx-auto flex justify-around py-2.5">
        {items.map(i => {
          const active = loc.pathname === i.to
          return (
            <Link key={i.to} to={i.to} className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition ${active ? 'text-[#FFD700]' : 'text-muted hover:text-cream'}`}>
              {i.icon}<span className="text-[10px] tracking-wide">{i.label}</span>
              {active && <span className="w-6 h-0.5 rounded-full gold-grad" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function CartSidebar({ open, onClose }) {
  const { cart, setQty } = useApp()
  const nav = useNavigate()
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />}
      <aside className={`fixed top-0 right-0 z-50 h-full w-96 max-w-[92vw] bg-[#111111] border-l border-[rgba(255,215,0,0.28)] transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'} flex flex-col`} aria-label="Shopping cart">
        <div className="p-5 border-b border-[rgba(255,215,0,0.15)] flex items-center justify-between">
          <h2 className="font-serif text-2xl gold-grad-text font-bold">Your Cart</h2>
          <span className="text-muted text-sm">{cart.length} items</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 && <p className="text-muted text-center py-16">Your cart is empty</p>}
          {cart.map(i => (
            <div key={i._id} className="glass rounded-2xl p-3 flex gap-3">
              <img src={i.imageUrl} alt={i.name} className="w-20 h-20 rounded-xl object-cover border border-[rgba(255,215,0,0.2)]" />
              <div className="flex-1 min-w-0">
                <p className="gold-text text-sm font-semibold truncate">{i.name}</p>
                <p className="text-cream font-serif text-lg">${(i.price * i.quantity).toFixed(2)}</p>
                <div className="flex items-center gap-3 mt-1">
                  <button onClick={() => setQty(i._id, i.quantity - 1)} aria-label="Decrease quantity" className="w-7 h-7 rounded-full border border-[rgba(255,215,0,0.4)] text-[#FFD700] flex items-center justify-center hover:bg-[#FFD700]/10"><Minus size={13} /></button>
                  <span className="text-cream text-sm w-5 text-center">{i.quantity}</span>
                  <button onClick={() => setQty(i._id, i.quantity + 1)} aria-label="Increase quantity" className="w-7 h-7 rounded-full border border-[rgba(255,215,0,0.4)] text-[#FFD700] flex items-center justify-center hover:bg-[#FFD700]/10"><Plus size={13} /></button>
                  <button onClick={() => setQty(i._id, 0)} aria-label="Remove item" className="ml-auto text-muted hover:text-[#FF5C5C]"><Trash size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="p-5 border-t border-[rgba(255,215,0,0.15)]">
            <div className="flex justify-between text-cream text-sm mb-1"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-cream text-sm mb-3"><span>Delivery</span><span>$10.00</span></div>
            <div className="flex justify-between gold-text font-serif text-xl font-bold mb-4"><span>Total</span><span>${(subtotal + 10).toFixed(2)}</span></div>
            <button onClick={() => { onClose(); nav('/shop/checkout') }} className="btn-gold glow-pulse w-full py-4 flex items-center justify-center gap-2">
              PROCEED TO CHECKOUT <ArrowR size={18} />
            </button>
            <p className="text-center text-muted text-xs mt-3 flex items-center justify-center gap-1.5"><Lock size={12} /> Secure Checkout</p>
          </div>
        )}
      </aside>
    </>
  )
}
