import { useEffect, useState } from 'react'
import { Modal } from './Shared'

/* ============================================================
   INSTALL CALMER APP — works for clients AND admins
   Edge cases handled (things weaker implementations miss):
   - Chrome fires `beforeinstallprompt` BEFORE React mounts →
     the event is captured in index.html into window.__calmerInstallEvt
   - iOS Safari NEVER fires beforeinstallprompt → we detect iOS and
     show a beautiful step-by-step "Add to Home Screen" guide instead
   - Already running as an installed app (standalone / iOS navigator.standalone)
     → the button hides itself completely
   - `prompt()` can only be called ONCE per captured event → after use
     we clear it and fall back to the instructions modal
   - Desktop browsers without PWA support (Firefox) → instructions modal
   ============================================================ */

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPadOS masquerades as Mac

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

export function useInstallApp() {
  const [installable, setInstallable] = useState(!!window.__calmerInstallEvt)
  const [installed, setInstalled] = useState(isStandalone())

  useEffect(() => {
    const onAble = () => setInstallable(true)
    const onDone = () => { setInstallable(false); setInstalled(true) }
    window.addEventListener('calmer-installable', onAble)
    window.addEventListener('calmer-installed', onDone)
    // display-mode can flip when the user opens the installed app
    const mq = window.matchMedia('(display-mode: standalone)')
    const onMq = e => e.matches && setInstalled(true)
    mq.addEventListener?.('change', onMq)
    return () => {
      window.removeEventListener('calmer-installable', onAble)
      window.removeEventListener('calmer-installed', onDone)
      mq.removeEventListener?.('change', onMq)
    }
  }, [])

  const promptInstall = async () => {
    const evt = window.__calmerInstallEvt
    if (!evt) return 'no-prompt'
    try {
      evt.prompt()
      const { outcome } = await evt.userChoice
      window.__calmerInstallEvt = null // one-shot: cannot be reused
      setInstallable(false)
      if (outcome === 'accepted') { setInstalled(true); return 'accepted' }
      return 'dismissed'
    } catch {
      window.__calmerInstallEvt = null
      setInstallable(false)
      return 'no-prompt'
    }
  }

  return { installed, installable, promptInstall, ios: isIOS() }
}

const PhoneIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="2" width="10" height="20" rx="2.5" />
    <path d="M11 18.5h2" />
    <path d="M12 7v6m0 0-2.5-2.5M12 13l2.5-2.5" />
  </svg>
)

const ShareIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12M12 3 8.5 6.5M12 3l3.5 3.5" />
    <path d="M6 10H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-1" />
  </svg>
)

const PlusSquare = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
)

const DotsIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" stroke="none">
    <circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" />
  </svg>
)

function InstallGuideModal({ open, onClose, ios }) {
  const steps = ios
    ? [
      { icon: <ShareIcon />, text: <>Tap the <b className="text-[#FFD700]">Share</b> button in Safari's toolbar</> },
      { icon: <PlusSquare />, text: <>Scroll down and tap <b className="text-[#FFD700]">Add to Home Screen</b></> },
      { icon: <PhoneIcon size={18} />, text: <>Tap <b className="text-[#FFD700]">Add</b> — CALMER appears on your home screen like a real app</> },
    ]
    : [
      { icon: <DotsIcon />, text: <>Open your browser menu (<b className="text-[#FFD700]">⋮</b> or <b className="text-[#FFD700]">⋯</b> in the top corner)</> },
      { icon: <PlusSquare />, text: <>Tap <b className="text-[#FFD700]">Install app</b> / <b className="text-[#FFD700]">Add to Home screen</b></> },
      { icon: <PhoneIcon size={18} />, text: <>Confirm — CALMER installs with its own icon, full-screen, and works offline</> },
    ]
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center">
        <img src="/icons/icon-192.png" alt="CALMER app icon"
          className="w-20 h-20 mx-auto rounded-3xl border border-[rgba(255,215,0,0.4)] shadow-2xl shadow-[#FFD700]/30 breathe" />
        <h2 className="font-serif text-2xl gold-grad-text font-bold mt-4">Install CALMER App</h2>
        <p className="text-muted text-xs uppercase tracking-[.25em] mt-1">On your phone — in 3 taps</p>
        <ol className="text-left mt-6 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-4 glass rounded-2xl p-4">
              <span className="w-9 h-9 shrink-0 rounded-full gold-grad flex items-center justify-center font-bold text-sm">{i + 1}</span>
              <span className="text-[#FFD700] shrink-0">{s.icon}</span>
              <span className="text-cream text-sm">{s.text}</span>
            </li>
          ))}
        </ol>
        <p className="text-muted text-[11px] mt-5">
          Installed CALMER opens instantly, full-screen, sends order alerts, and even works offline.
        </p>
        <button onClick={onClose} className="btn-outline w-full py-3 mt-4">GOT IT</button>
      </div>
    </Modal>
  )
}

/* The clean, clearly-visible install button.
   variant: "hero" (big landing CTA) | "bar" (full-width banner) | "compact" (nav/sidebar) */
export default function InstallAppButton({ variant = 'bar', className = '' }) {
  const { installed, promptInstall, ios } = useInstallApp()
  const [guide, setGuide] = useState(false)

  if (installed) return null // already running as the installed app — never nag

  const click = async () => {
    const result = await promptInstall()
    if (result === 'no-prompt') setGuide(true) // iOS / unsupported → show the guide
  }

  return (
    <>
      {variant === 'hero' && (
        <button onClick={click} id="install-app-hero"
          className={`btn-gold glow-pulse px-8 py-4 flex items-center justify-center gap-3 text-sm md:text-base font-bold tracking-wide ${className}`}>
          <PhoneIcon size={22} /> INSTALL CALMER APP IN YOUR PHONE
        </button>
      )}
      {variant === 'bar' && (
        <button onClick={click} id="install-app-bar"
          className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide
            bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#FFD700] text-[#0A0A0A]
            shadow-lg shadow-[#FFD700]/30 hover:shadow-[#FFD700]/60 hover:scale-[1.02] transition-all ${className}`}>
          <PhoneIcon size={20} /> INSTALL CALMER APP IN YOUR PHONE
        </button>
      )}
      {variant === 'compact' && (
        <button onClick={click} id="install-app-compact" title="Install CALMER App"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#FFD700]/60 text-[#FFD700] text-xs font-bold
            hover:bg-[#FFD700]/10 hover:shadow-lg hover:shadow-[#FFD700]/20 transition-all ${className}`}>
          <PhoneIcon size={16} /> INSTALL APP
        </button>
      )}
      <InstallGuideModal open={guide} onClose={() => setGuide(false)} ios={ios} />
    </>
  )
}
