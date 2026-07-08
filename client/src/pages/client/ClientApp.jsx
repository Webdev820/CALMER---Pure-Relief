import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { TopBar, BottomNav, CartSidebar } from './Layout.jsx'
import ShopHome from './ShopHome.jsx'
import Checkout from './Checkout.jsx'
import Orders from './Orders.jsx'
import { Vibe, Profile } from './VibeProfile.jsx'

export default function ClientApp() {
  const { user } = useApp()
  const [cartOpen, setCartOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />

  return (
    <div className="min-h-screen bg-deep-black text-cream pb-20">
      <TopBar onCart={() => setCartOpen(true)} />
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      <main className="max-w-6xl mx-auto px-4">
        <Routes>
          <Route index element={<ShopHome />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders" element={<Orders />} />
          <Route path="vibe" element={<Vibe />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
