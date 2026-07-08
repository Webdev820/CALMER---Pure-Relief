import React, { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Shield, Bell, Send, Crown } from '../../utils/icons.jsx'

export default function Settings() {
  const { api, toast, user } = useApp()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const broadcast = async () => {
    if (!title.trim() || !message.trim()) return toast('Missing Fields', 'Title and message are required', 'error')
    setBusy(true)
    try {
      await api.post('/notifications/send', { broadcast: true, title, message, type: 'system' })
      toast('Broadcast Sent', 'All clients have been notified', 'success')
      setTitle(''); setMessage('')
    } catch { toast('Error', 'Broadcast failed', 'error') }
    setBusy(false)
  }

  return (
    <section id="admin-settings" className="space-y-6 animate-fadeInUp max-w-3xl">
      <header>
        <h1 className="font-serif text-3xl text-cream">Admin <span className="gold-grad-text">Settings</span></h1>
        <p className="text-muted text-sm mt-1">Account details and client broadcast tools.</p>
      </header>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-serif text-lg text-cream mb-4 flex items-center gap-2"><Crown size={16} className="text-rich-gold" /> Admin Account</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs text-muted uppercase">Username</p><p className="text-cream mt-1">{user.username}</p></div>
          <div><p className="text-xs text-muted uppercase">Role</p><p className="text-rich-gold mt-1">Administrator</p></div>
          {user.email && <div><p className="text-xs text-muted uppercase">Email</p><p className="text-cream mt-1">{user.email}</p></div>}
          {user.phone && <div><p className="text-xs text-muted uppercase">Phone</p><p className="text-cream mt-1">{user.phone}</p></div>}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-[rgba(255,215,0,0.25)] bg-[rgba(255,215,0,0.05)] p-4">
          <Shield size={18} className="text-rich-gold shrink-0 mt-0.5" />
          <p className="text-xs text-muted">
            Your <span className="text-rich-gold">CALMER ADMIN PASSKEY</span> is your only login credential. It is bcrypt-hashed on the server and can never be recovered — keep your saved copy secure like an API key.
          </p>
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-serif text-lg text-cream mb-1 flex items-center gap-2"><Bell size={16} className="text-rich-gold" /> Broadcast to All Clients</h2>
        <p className="text-xs text-muted mb-4">Send an instant notification to every connected client (promos, announcements, restocks).</p>
        <div className="space-y-3">
          <input className="field" placeholder="Notification title (e.g. Weekend Gold Drop)" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="field min-h-[90px]" placeholder="Message to all clients..." value={message} onChange={e => setMessage(e.target.value)} />
          <button disabled={busy} onClick={broadcast} className="btn-gold flex items-center gap-2 text-sm"><Send size={15} /> {busy ? 'Sending…' : 'Send Broadcast'}</button>
        </div>
      </section>
    </section>
  )
}
