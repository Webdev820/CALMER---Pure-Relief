import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import api, { API_BASE } from '../utils/api'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('calmer_user')) } catch { return null }
  })
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('calmer_cart')) || [] } catch { return [] }
  })
  const [toasts, setToasts] = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const [incomingCall, setIncomingCall] = useState(null)
  const socketRef = useRef(null)

  const toast = useCallback((title, message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t.slice(-4), { id, title, message, type }]) // cap at 5 visible — no toast avalanche
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), type === 'error' ? 7000 : 5000)
  }, [])
  const dismissToast = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), [])

  const login = (data) => {
    localStorage.setItem('calmer_token', data.token)
    localStorage.setItem('calmer_user', JSON.stringify(data.user))
    setUser(data.user)
  }
  const logout = () => {
    localStorage.removeItem('calmer_token')
    localStorage.removeItem('calmer_user')
    socketRef.current?.disconnect()
    socketRef.current = null
    setUser(null)
  }

  // cart helpers
  useEffect(() => { localStorage.setItem('calmer_cart', JSON.stringify(cart)) }, [cart])
  const addToCart = (product, qty = 1) => {
    setCart(c => {
      const ex = c.find(i => i._id === product._id)
      if (ex) return c.map(i => i._id === product._id ? { ...i, quantity: i.quantity + qty } : i)
      return [...c, { ...product, quantity: qty }]
    })
    toast('Added to Cart', `${product.name} added to your cart`, 'success')
  }
  const setQty = (id, q) => setCart(c => q <= 0 ? c.filter(i => i._id !== id) : c.map(i => i._id === id ? { ...i, quantity: q } : i))
  const clearCart = () => setCart([])

  // socket connection
  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('calmer_token')
    const s = io(API_BASE || '/', { auth: { token }, reconnectionAttempts: 20, reconnectionDelayMax: 8000 })
    socketRef.current = s
    s.on('connect_error', err => {
      // JWT expired mid-session → socket auth fails forever; log out cleanly instead of silent retry loop
      if (/token|auth/i.test(err?.message || '')) { s.disconnect() }
    })

    s.on('notification', n => { setNotifCount(c => c + 1); toast(n.title || 'CALMER', n.message, 'gold') })
    s.on('order_update', n => { setNotifCount(c => c + 1); toast('Order Update', n.message, 'gold') })
    s.on('proximity_alert', n => toast('Delivery Alert', n.message, 'gold'))
    s.on('admin_message', m => { setNotifCount(c => c + 1); toast('CALMER VIBE', `${m.senderName}: ${m.message}`, 'gold') })
    if (user.role === 'admin') {
      s.on('new_order', o => { setNotifCount(c => c + 1); toast('New Order', `Order ${o.orderNumber} - $${Number(o.total).toFixed(2)} from ${o.client}`, 'success'); playDing() })
      s.on('location_pinned', o => toast('Location Pinned', `Client pinned location for ${o.orderNumber}`, 'success'))
      s.on('message_received', m => { setNotifCount(c => c + 1); toast('CALMER VIBE', `${m.senderName}: ${m.message}`, 'gold') })
    }
    s.on('incoming_call', c => setIncomingCall(c))
    s.on('call_ended', () => setIncomingCall(null))

    return () => s.disconnect()
  }, [user])

  const playDing = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.frequency.value = 880; g.gain.setValueAtTime(.15, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .6)
      o.start(); o.stop(ctx.currentTime + .6)
    } catch { }
  }

  return (
    <Ctx.Provider value={{
      user, login, logout, cart, addToCart, setQty, clearCart,
      toast, toasts, dismissToast, notifCount, setNotifCount,
      socket: () => socketRef.current, incomingCall, setIncomingCall, api
    }}>
      {children}
    </Ctx.Provider>
  )
}
