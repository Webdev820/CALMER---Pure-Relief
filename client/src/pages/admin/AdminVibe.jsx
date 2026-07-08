import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { Loader } from '../../components/Shared.jsx'
import { Chat, Phone, Send, X, UserI } from '../../utils/icons.jsx'

/* Admin CALMER VIBE: chat list + chat window + outgoing WebRTC voice call */
export default function AdminVibe() {
  const { api, toast, socket, user } = useApp()
  const location = useLocation()
  const [convos, setConvos] = useState([])
  const [active, setActive] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [call, setCall] = useState(null) // { orderId, clientId, clientName, status: 'ringing'|'connected', secs }
  const pcRef = useRef(null)
  const audioRef = useRef(null)
  const endRef = useRef(null)

  const load = async (keepActive = true) => {
    try {
      const { data } = await api.get('/chats')
      setConvos(data)
      if (keepActive && active) {
        const fresh = data.find(c => c._id === active._id)
        if (fresh) setActive(fresh)
      }
    } catch { }
    setLoading(false)
  }

  useEffect(() => { load(false) }, [])

  // open a specific conversation when navigated from Orders
  useEffect(() => {
    const oid = location.state?.orderId
    if (oid && convos.length) {
      const c = convos.find(c => String(c.orderId?._id || c.orderId) === String(oid))
      if (c) setActive(c)
    }
  }, [location.state, convos.length])

  // realtime refresh on new client messages
  useEffect(() => {
    const s = socket()
    if (!s) return
    const onMsg = () => load()
    s.on('message_received', onMsg)
    return () => s.off('message_received', onMsg)
  }, [active])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [active?.messages?.length])

  // ==== outgoing call: WebRTC answer side (client creates offer when they pick up) ====
  useEffect(() => {
    const s = socket()
    if (!s || !call) return
    const onSignal = async ({ from, data }) => {
      try {
        if (data.sdp && data.sdp.type === 'offer') {
          const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
          pcRef.current = pc
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach(t => pc.addTrack(t, stream))
          } catch { toast('Call', 'Microphone unavailable - listen-only mode', 'info') }
          pc.ontrack = e => { if (audioRef.current) audioRef.current.srcObject = e.streams[0] }
          pc.onicecandidate = e => e.candidate && s.emit('webrtc_signal', { to: from, data: { candidate: e.candidate }, orderId: call.orderId })
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          s.emit('webrtc_signal', { to: from, data: { sdp: answer }, orderId: call.orderId })
        } else if (data.candidate && pcRef.current) {
          try { await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)) } catch { }
        }
      } catch { }
    }
    const onAnswered = () => setCall(c => c ? { ...c, status: 'connected' } : c)
    const onEnded = () => endCall(false)
    s.on('webrtc_signal', onSignal)
    s.on('call_answered', onAnswered)
    s.on('call_ended', onEnded)
    return () => { s.off('webrtc_signal', onSignal); s.off('call_answered', onAnswered); s.off('call_ended', onEnded) }
  }, [call?.orderId])

  useEffect(() => {
    let iv
    if (call?.status === 'connected') iv = setInterval(() => setCall(c => c ? { ...c, secs: (c.secs || 0) + 1 } : c), 1000)
    return () => clearInterval(iv)
  }, [call?.status])

  const startCall = async () => {
    if (!active) return
    const orderId = active.orderId?._id || active.orderId
    try {
      await api.post('/calls/initiate', { orderId })
      setCall({ orderId, clientId: active.clientId?._id, clientName: active.clientId?.username, status: 'ringing', secs: 0 })
      toast('Calling', `Ringing ${active.clientId?.username}...`, 'gold')
    } catch { toast('Call Failed', 'Could not reach the client', 'error') }
  }

  const endCall = (notify = true) => {
    if (notify && call) socket()?.emit('call_ended', { to: call.clientId, orderId: call.orderId })
    pcRef.current?.close(); pcRef.current = null
    setCall(null)
  }

  const send = async () => {
    if (!text.trim() || !active) return
    const orderId = active.orderId?._id || active.orderId
    const msg = text.trim(); setText('')
    try {
      await api.post(`/chats/${orderId}`, { message: msg })
      await load()
    } catch { toast('Error', 'Message failed to send', 'error') }
  }

  if (loading) return <Loader label="Loading conversations" />

  return (
    <section id="admin-vibe" className="animate-fadeInUp">
      <header className="mb-6">
        <h1 className="font-serif text-3xl text-cream">CALMER <span className="gold-grad-text">VIBE</span></h1>
        <p className="text-muted text-sm mt-1">Communicate with clients about their orders — chat or call directly.</p>
      </header>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 lg:h-[calc(100vh-220px)]">
        {/* Conversation list */}
        <aside className={`glass rounded-2xl overflow-y-auto ${active ? 'hidden lg:block' : ''}`}>
          {convos.length === 0 ? (
            <p className="text-muted text-sm p-6">No conversations yet. A thread is created automatically for every paid order.</p>
          ) : convos.map(c => {
            const last = c.messages?.[c.messages.length - 1]
            const isActive = active?._id === c._id
            return (
              <button key={c._id} onClick={() => setActive(c)}
                className={`w-full text-left px-4 py-4 border-b border-white/5 transition flex gap-3 items-center ${isActive ? 'bg-[rgba(255,215,0,0.08)]' : 'hover:bg-white/5'}`}>
                <span className="w-10 h-10 rounded-full bg-[rgba(255,215,0,0.15)] text-rich-gold flex items-center justify-center shrink-0"><UserI size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between">
                    <span className="text-sm text-cream font-medium truncate">{c.clientId?.username || 'client'}</span>
                    <span className="text-[10px] text-muted">{last ? new Date(last.timestamp || c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </span>
                  <span className="block text-[11px] text-rich-gold">{c.orderId?.orderNumber}</span>
                  <span className="block text-xs text-muted truncate">{last?.message || 'No messages yet'}</span>
                </span>
              </button>
            )
          })}
        </aside>

        {/* Chat window */}
        <div className={`glass rounded-2xl flex flex-col min-h-[420px] ${!active ? 'hidden lg:flex' : ''}`}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted gap-3">
              <Chat size={40} className="text-rich-gold opacity-50" />
              <p className="text-sm">Select a conversation to start the vibe</p>
            </div>
          ) : (
            <>
              <header className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,215,0,0.12)]">
                <div className="flex items-center gap-3">
                  <button onClick={() => setActive(null)} className="lg:hidden text-muted"><X size={18} /></button>
                  <span className="w-9 h-9 rounded-full bg-[rgba(255,215,0,0.15)] text-rich-gold flex items-center justify-center"><UserI size={16} /></span>
                  <div>
                    <p className="text-sm text-cream font-medium">{active.clientId?.username}</p>
                    <p className="text-[11px] text-rich-gold">{active.orderId?.orderNumber} • {active.orderId?.deliveryStatus?.replace('_', ' ')}</p>
                  </div>
                </div>
                <button onClick={startCall} className="btn-gold !py-2 !px-4 text-xs flex items-center gap-2">
                  <Phone size={14} /> CALL CLIENT
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {active.messages?.map((m, i) => {
                  const mine = String(m.senderId) === String(user.id) || m.senderName === user.username
                  if (m.type === 'system' || m.type === 'call_initiation') return (
                    <p key={i} className="text-center text-[11px] text-muted italic py-1">{m.message}</p>
                  )
                  return (
                    <div key={i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={mine ? 'chat-bubble-me' : 'chat-bubble-them'}>
                        <p className="text-sm">{m.message}</p>
                        <p className="text-[10px] opacity-60 mt-1 text-right">{m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={endRef} />
              </div>

              <footer className="p-4 border-t border-[rgba(255,215,0,0.12)] flex gap-2">
                <input className="field flex-1" placeholder="Message the client..." value={text}
                  onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
                <button onClick={send} className="btn-gold !px-4 flex items-center" aria-label="Send message"><Send size={18} /></button>
              </footer>
            </>
          )}
        </div>
      </div>

      {/* Outgoing call overlay */}
      {call && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/85 backdrop-blur">
          <audio ref={audioRef} autoPlay />
          <div className="glass rounded-3xl p-10 text-center max-w-sm w-full mx-4">
            <div className={`w-24 h-24 mx-auto rounded-full gold-grad flex items-center justify-center mb-6 ${call.status === 'ringing' ? 'glow-pulse' : ''}`}>
              <Phone size={38} />
            </div>
            <p className="font-serif text-2xl gold-grad-text">{call.clientName}</p>
            <p className="text-cream text-sm mt-2">
              {call.status === 'ringing' ? 'Ringing client device...' : `Connected - ${Math.floor((call.secs || 0) / 60)}:${String((call.secs || 0) % 60).padStart(2, '0')}`}
            </p>
            <button onClick={() => endCall()} className="mt-8 w-14 h-14 mx-auto rounded-full bg-alert text-white flex items-center justify-center hover:scale-110 transition" aria-label="End call">
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
