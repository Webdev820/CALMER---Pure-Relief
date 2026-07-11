import React, { useState } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { Logo } from '../../components/Shared.jsx'
import InstallAppButton from '../../components/InstallApp.jsx'
import { Home, Box, Chat, MapI, ChartI, Gear, Logout, Menu, X, Bell, Leaf, Crown } from '../../utils/icons.jsx'
import Overview from './Overview.jsx'
import AdminOrders from './AdminOrders.jsx'
import AdminProducts from './AdminProducts.jsx'
import AdminVibe from './AdminVibe.jsx'
import Tracking from './Tracking.jsx'
import Analytics from './Analytics.jsx'
import Settings from './Settings.jsx'

const NAV = [
  { to: '/admin', label: 'Overview', icon: Home, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Box },
  { to: '/admin/products', label: 'Products', icon: Leaf },
  { to: '/admin/vibe', label: 'CALMER VIBE', icon: Chat },
  { to: '/admin/tracking', label: 'Live Tracking', icon: MapI },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartI },
  { to: '/admin/settings', label: 'Settings', icon: Gear },
]

function Sidebar({ mobile, onClose, user, notifCount, onLogout }) {
  return (
    <aside className={`${mobile ? 'fixed inset-y-0 left-0 z-50 w-64 shadow-2xl flex' : 'hidden lg:flex w-64 shrink-0'} flex-col bg-[#0D0D0D] border-r border-[rgba(255,215,0,0.15)]`}>
      <div className="flex items-center justify-between px-5 py-5 border-b border-[rgba(255,215,0,0.12)]">
        <Logo size={40} />
        {mobile && <button onClick={onClose} className="text-muted hover:text-rich-gold"><X size={20} /></button>}
      </div>
      <div className="px-5 py-3 flex items-center gap-2 text-xs text-rich-gold border-b border-[rgba(255,215,0,0.08)] tracking-widest">
        <Crown size={14} /> ADMIN CONTROL CENTER
      </div>
      <nav id="admin-nav" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Ic, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onClose}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[rgba(255,215,0,0.12)] text-rich-gold border border-[rgba(255,215,0,0.3)]' : 'text-muted hover:text-cream hover:bg-white/5 border border-transparent'}`}>
            <Ic size={18} /> {label}
            {label === 'CALMER VIBE' && notifCount > 0 && <span className="ml-auto bg-alert text-white text-[10px] rounded-full px-1.5 py-0.5">{notifCount}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-[rgba(255,215,0,0.12)]">
        <div className="mb-3"><InstallAppButton variant="bar" /></div>
        <div className="flex items-center gap-3 mb-3">
          <img src="/assets/profile.jpg" alt="admin avatar" className="w-9 h-9 rounded-full object-cover border border-rich-gold" />
          <div className="min-w-0">
            <p className="text-sm text-cream truncate">{user.username}</p>
            <p className="text-[11px] text-success">● Online — Admin</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-[rgba(255,92,92,0.4)] text-alert text-sm hover:bg-[rgba(255,92,92,0.1)] transition">
          <Logout size={16} /> Logout
        </button>
      </div>
    </aside>
  )
}

export default function AdminApp() {
  const { user, logout, notifCount } = useApp()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)

  if (!user) return <Navigate to="/admin-login" replace />
  if (user.role !== 'admin') return <Navigate to="/shop" replace />

  const doLogout = () => { logout(); nav('/') }

  return (
    <div className="min-h-screen bg-deep-black text-cream flex">
      <Sidebar user={user} notifCount={notifCount} onLogout={doLogout} />
      {open && <>
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setOpen(false)} />
        <Sidebar mobile onClose={() => setOpen(false)} user={user} notifCount={notifCount} onLogout={doLogout} />
      </>}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0D0D0D]/95 backdrop-blur border-b border-[rgba(255,215,0,0.15)]">
          <button onClick={() => setOpen(true)} className="text-rich-gold" aria-label="Open menu"><Menu size={22} /></button>
          <Logo size={34} />
          <div className="relative text-muted">
            <Bell size={20} />
            {notifCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-alert rounded-full text-[9px] flex items-center justify-center text-white">{notifCount}</span>}
          </div>
        </header>
        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="vibe" element={<AdminVibe />} />
            <Route path="tracking" element={<Tracking />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
