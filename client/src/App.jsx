import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { Toasts, CallOverlay } from './components/Shared.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Landing from './pages/Landing.jsx'
import { Login, Register } from './pages/Auth.jsx'
import ClientApp from './pages/client/ClientApp.jsx'
import AdminApp from './pages/admin/AdminApp.jsx'

function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6 text-center">
      <div className="glass rounded-3xl p-10 max-w-md w-full">
        <p className="font-serif text-7xl gold-grad-text font-bold">404</p>
        <h1 className="font-serif text-2xl text-white font-bold mt-2">This Path Drifted Away</h1>
        <p className="text-cream text-sm mt-3">The page you're looking for doesn't exist. Breathe, and let's get you back.</p>
        <Link to="/" className="btn-gold inline-block px-8 py-3.5 mt-6">BACK TO CALMER</Link>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<Login admin />} />
        <Route path="/admin-register" element={<Register admin />} />
        <Route path="/shop/*" element={<ClientApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toasts />
      <CallOverlay />
    </ErrorBoundary>
  )
}
