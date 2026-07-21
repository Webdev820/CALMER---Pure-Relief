import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Modal } from '../components/Shared'
import { UserI, Lock, Eye, Copy, Check, Leaf } from '../utils/icons'
import api from '../utils/api'

function AuthShell({ children, admin = false }) {
  return (
    <div className="min-h-screen relative flex items-end md:items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Cinematic golden CALMER bicycle backdrop (client-provided clean brand image) */}
      <div className="absolute inset-0">
        {/* Blurred fill layer - seamless edge-to-edge on any screen size */}
        <div className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-60"
          style={{ backgroundImage: 'url(/assets/login-bike.jpg)' }} aria-hidden="true" />
        {/* Sharp full image - never cropped, never over-zoomed */}
        <img src="/assets/login-bike.jpg" alt="" aria-hidden="true"
          className="relative w-full h-full object-contain opacity-95" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/95" />
      </div>
      <div className="relative z-10 w-full max-w-md px-5 py-10">
        <div className="text-center mb-6">
          <img src="/assets/logo.jpg" alt="CALMER - Pure Relief. Breathe, Unwind, Elevate."
            className="w-28 h-28 mx-auto rounded-full border-2 border-[rgba(255,215,0,0.5)] shadow-2xl shadow-[#FFD700]/40 object-cover breathe" />
          <h1 className="font-serif text-4xl gold-grad-text font-bold mt-4 drop-shadow-lg">CALMER</h1>
          <p className="text-cream text-xs tracking-[.35em] uppercase mt-1">Pure Relief</p>
          {admin && <span className="badge bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40 inline-block mt-2">ADMIN PORTAL</span>}
        </div>
        {children}
      </div>
    </div>
  )
}

export function Login({ admin = false }) {
  const { login, toast } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const [username, setUsername] = useState('')
  const [passkey, setPasskey] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault(); setBusy(true)
    try {
      const { data } = await api.post('/auth/login', { username, passkey })
      login(data)
      toast('Welcome back', `Logged in as ${data.user.username}`, 'success')
      const dest = data.user.role === 'admin' ? '/admin' : (loc.state?.from || '/shop')
      nav(dest, { replace: true })
    } catch (err) {
      toast('Login Failed', err.response?.data?.error || 'Invalid credentials', 'error')
    } finally { setBusy(false) }
  }

  return (
    <AuthShell admin={admin}>
      <form onSubmit={submit} className="space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]"><UserI size={18} /></span>
          <input id="login-username" className="field pl-12" placeholder={admin ? '@admin-username' : '@username'}
            value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]"><Lock size={18} /></span>
          <input id="login-passkey" type={show ? 'text' : 'password'} className="field pl-12 pr-12" placeholder="CALMER-XXXX-XXXX-XXXX"
            value={passkey} onChange={e => setPasskey(e.target.value.toUpperCase())} required autoComplete="current-password" />
          <button type="button" onClick={() => setShow(!show)} aria-label="Toggle passkey visibility"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-cream hover:text-[#FFD700]"><Eye size={18} /></button>
        </div>
        <p className="text-right text-xs text-cream">Lost passkey? <span className="gold-text">You must create a new account.</span></p>
        <button disabled={busy} className="btn-gold glow-pulse w-full py-4 text-lg tracking-widest font-serif">
          {busy ? 'SIGNING IN...' : 'LOGIN'}
        </button>
      </form>
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-[rgba(255,215,0,0.25)]" /><span className="text-muted text-xs">OR</span><div className="flex-1 h-px bg-[rgba(255,215,0,0.25)]" />
      </div>
      <p className="text-center text-cream text-sm">
        Don't have an account? <Link to={admin ? '/admin-register' : '/register'} className="gold-text font-semibold hover:underline">Sign Up</Link>
      </p>
      <p className="text-center text-muted text-xs mt-3">
        {admin ? <Link to="/login" className="hover:text-[#FFD700]">Client login</Link> : <Link to="/" className="hover:text-[#FFD700]">Back to CALMER home</Link>}
      </p>
    </AuthShell>
  )
}

export function Register({ admin = false }) {
  const { toast } = useApp()
  const nav = useNavigate()
  const [username, setUsername] = useState(admin ? '@admin-' : '@')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [passkey, setPasskey] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [busy, setBusy] = useState(false)

  const validU = admin ? /^@admin-[a-z0-9_\-]{3,}$/i.test(username) : /^@(?!admin-)[a-z0-9_\-]{3,}$/i.test(username)

  const getPasskey = async () => {
    if (!validU) return toast('Invalid Username', admin ? 'Username must be @admin-yourname (3+ chars)' : 'Username must be @yourname (3+ chars)', 'error')
    if (admin && (!email || !phone)) return toast('Required', 'Email and phone are required for admin accounts', 'error')
    const { data } = await api.post('/auth/generate-passkey', { role: admin ? 'admin' : 'client' })
    setPasskey(data.passkey); setShowKey(true); setCopied(false); setSaved(false)
  }

  const copyKey = async () => {
    try { await navigator.clipboard.writeText(passkey) } catch {
      const t = document.createElement('textarea'); t.value = passkey; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove()
    }
    setCopied(true); toast('Copied', 'CALMER PASSKEY copied to clipboard', 'success')
  }

  const finish = async () => {
    setBusy(true)
    try {
      await api.post('/auth/register', { username, passkey, email, phone })
      toast('Account Created', 'Login with your @username and CALMER PASSKEY', 'success')
      nav(admin ? '/admin-login' : '/login')
    } catch (err) {
      toast('Registration Failed', err.response?.data?.error || 'Try again', 'error')
      setShowKey(false); setPasskey('')
    } finally { setBusy(false) }
  }

  return (
    <AuthShell admin={admin}>
      <div className="space-y-4">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD700]"><UserI size={18} /></span>
          <input id="reg-username" className="field pl-12" placeholder={admin ? '@admin-yourname' : '@choose_username'}
            value={username} onChange={e => setUsername(e.target.value.toLowerCase())} />
        </div>
        {username.length > 2 && (
          <p className={`text-xs px-2 ${validU ? 'text-[#39D98A]' : 'text-[#FF5C5C]'}`}>
            {validU ? 'Username format looks good' : (admin ? 'Must start with @admin- (letters, numbers, _ )' : 'Must start with @ (letters, numbers, _ , no admin- prefix)')}
          </p>
        )}
        <input className="field" type="email" placeholder={admin ? 'Email (required)' : 'Email (optional)'} value={email} onChange={e => setEmail(e.target.value)} />
        <input className="field" type="tel" placeholder={admin ? 'Phone (required)' : 'Phone (optional)'} value={phone} onChange={e => setPhone(e.target.value)} />
        <button onClick={getPasskey} className="btn-gold glow-pulse w-full py-4 text-lg tracking-widest font-serif">
          {admin ? 'GET ADMIN PASSKEY' : 'GET PASSKEY'}
        </button>
        <p className="text-center text-cream text-sm">
          Already registered? <Link to={admin ? '/admin-login' : '/login'} className="gold-text font-semibold hover:underline">Login</Link>
        </p>
      </div>

      <Modal open={showKey} onClose={() => { }}>
        <div className="text-center">
          <span className="text-[#FFD700] inline-block mb-3"><Leaf size={34} /></span>
          <h2 className="font-serif text-2xl gold-text font-bold">Your CALMER PASSKEY</h2>
          <div className="glass rounded-2xl p-4 mt-5 border-[#FFD700]/50">
            <p className="gold-text font-mono text-lg break-all select-all">{passkey}</p>
          </div>
          <div className="bg-[#FF5C5C]/10 border border-[#FF5C5C]/40 rounded-2xl p-4 mt-4 text-left">
            <p className="text-[#FF5C5C] text-xs font-semibold leading-relaxed">
              WARNING: Save this CALMER PASSKEY securely. You only get the CALMER PASSKEY once
              (one-time generation per account). Treat it like your API key — if lost, you risk losing
              your CALMER account and will need to CREATE a new account.
            </p>
          </div>
          <button onClick={copyKey} className="btn-outline w-full py-3 mt-4 flex items-center justify-center gap-2">
            {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copied to Clipboard' : 'Copy Passkey'}
          </button>
          <label className="flex items-center gap-3 mt-5 cursor-pointer text-left">
            <input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)}
              className="w-5 h-5 accent-[#FFD700]" />
            <span className="text-cream text-sm">I have saved my CALMER PASSKEY securely</span>
          </label>
          <button disabled={!saved || busy} onClick={finish}
            className={`w-full py-4 mt-4 rounded-full font-serif text-lg tracking-widest transition ${saved ? 'btn-gold glow-pulse' : 'bg-white/10 text-muted cursor-not-allowed'}`}>
            {busy ? 'CREATING ACCOUNT...' : 'CREATE MY ACCOUNT'}
          </button>
        </div>
      </Modal>
    </AuthShell>
  )
}
