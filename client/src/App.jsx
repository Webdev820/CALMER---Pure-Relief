import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toasts, CallOverlay } from './components/Shared.jsx'
import Landing from './pages/Landing.jsx'
import { Login, Register } from './pages/Auth.jsx'
import ClientApp from './pages/client/ClientApp.jsx'
import AdminApp from './pages/admin/AdminApp.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-login" element={<Login admin />} />
        <Route path="/admin-register" element={<Register admin />} />
        <Route path="/shop/*" element={<ClientApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
      <Toasts />
      <CallOverlay />
    </>
  )
}
