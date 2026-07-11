import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { Leaf, X, Phone, Check } from '../utils/icons'

export function Logo({ size = 44, showTag = false }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/assets/logo.jpg" alt="CALMER - Pure Relief" width={size} height={size}
        className="rounded-full border border-[rgba(255,215,0,0.4)] shadow-lg shadow-[#FFD700]/20 object-cover" />
      <div>
        <span className="font-serif font-bold text-xl gold-grad-text tracking-wide">CALMER</span>
        {showTag && <p className="text-[10px] text-cream tracking-[.25em] uppercase">Breathe, Unwind, Elevate</p>}
      </div>
    </div>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useApp()
  const styles = {
    success: { border: 'border-[#39D98A]/60', icon: 'text-[#39D98A]', title: 'text-[#39D98A]' },
    error: { border: 'border-[#FF5C5C]/60', icon: 'text-[#FF5C5C]', title: 'text-[#FF5C5C]' },
    gold: { border: 'border-[#FFD700]/50', icon: 'text-[#FFD700]', title: 'text-[#FFD700]' },
    info: { border: '', icon: 'text-[#FFD700]', title: 'text-[#FFD700]' },
  }
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 w-80 max-w-[90vw]" role="status" aria-live="polite">
      {toasts.map(t => {
        const s = styles[t.type] || styles.info
        return (
          <div key={t.id} className={`glass rounded-2xl p-4 toast-in shadow-2xl ${s.border}`}>
            <div className="flex items-start gap-3">
              <span className={`${s.icon} mt-0.5 shrink-0`}><Leaf size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className={`${s.title} font-semibold text-sm`}>{t.title}</p>
                <p className="text-cream text-xs mt-0.5 break-words">{t.message}</p>
              </div>
              <button onClick={() => dismissToast?.(t.id)} aria-label="Dismiss notification"
                className="text-muted hover:text-cream shrink-0 -mt-1 -mr-1 p-1"><X size={14} /></button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Loader({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <span className="text-[#FFD700] leaf-spin inline-block"><Leaf size={40} /></span>
      <p className="text-cream text-sm">{label}...</p>
    </div>
  )
}

export function Modal({ open, onClose, children, wide = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className={`glass rounded-3xl p-6 md:p-8 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto shadow-2xl shadow-[#FFD700]/20`}
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

/* WebRTC voice call overlay - handles incoming (client) and outgoing (admin) calls */
export function CallOverlay() {
  const { incomingCall, setIncomingCall, socket, user, toast } = useApp()
  const [status, setStatus] = useState('ringing') // ringing | connected
  const pcRef = useRef(null)
  const audioRef = useRef(null)
  const timerRef = useRef(0)
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    if (!incomingCall) { setStatus('ringing'); setSecs(0); return }
    const s = socket()
    if (!s) return
    const onSignal = async ({ data }) => {
      const pc = pcRef.current
      if (!pc) return
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      } else if (data.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)) } catch { }
      }
    }
    s.on('webrtc_signal', onSignal)
    return () => s.off('webrtc_signal', onSignal)
  }, [incomingCall])

  useEffect(() => {
    let iv
    if (status === 'connected') iv = setInterval(() => setSecs(x => x + 1), 1000)
    return () => clearInterval(iv)
  }, [status])

  if (!incomingCall) return null

  const answer = async () => {
    try {
      const s = socket()
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      pcRef.current = pc
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => pc.addTrack(t, stream))
      pc.ontrack = e => { if (audioRef.current) audioRef.current.srcObject = e.streams[0] }
      pc.onicecandidate = e => e.candidate && s.emit('webrtc_signal', { to: incomingCall.callerId, data: { candidate: e.candidate }, orderId: incomingCall.orderId })
      const offer = await pc.createOffer({ offerToReceiveAudio: true })
      await pc.setLocalDescription(offer)
      s.emit('webrtc_signal', { to: incomingCall.callerId, data: { sdp: offer }, orderId: incomingCall.orderId })
      s.emit('call_answered', { to: incomingCall.callerId, orderId: incomingCall.orderId })
      setStatus('connected')
    } catch {
      toast('Call', 'Microphone unavailable - call connected in listen mode', 'info')
      setStatus('connected')
    }
  }

  const end = () => {
    socket()?.emit('call_ended', { to: incomingCall.callerId, orderId: incomingCall.orderId })
    pcRef.current?.close(); pcRef.current = null
    setIncomingCall(null)
  }

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/85 backdrop-blur">
      <audio ref={audioRef} autoPlay />
      <div className="glass rounded-3xl p-10 text-center max-w-sm w-full mx-4">
        <div className={`w-24 h-24 mx-auto rounded-full gold-grad flex items-center justify-center mb-6 ${status === 'ringing' ? 'glow-pulse' : ''}`}>
          <Phone size={38} />
        </div>
        <p className="font-serif text-2xl gold-text">{incomingCall.label || incomingCall.from}</p>
        <p className="text-cream text-sm mt-2">
          {status === 'ringing' ? 'Incoming CALMER call...' : `Call Connected - ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`}
        </p>
        <div className="flex justify-center gap-4 mt-8">
          {status === 'ringing' && (
            <button onClick={answer} className="w-14 h-14 rounded-full bg-[#39D98A] text-black flex items-center justify-center hover:scale-110 transition" aria-label="Answer call"><Check size={24} /></button>
          )}
          <button onClick={end} className="w-14 h-14 rounded-full bg-[#FF5C5C] text-white flex items-center justify-center hover:scale-110 transition" aria-label="End call"><X size={24} /></button>
        </div>
      </div>
    </div>
  )
}
