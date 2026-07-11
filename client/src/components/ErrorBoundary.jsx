import React from 'react'

/* Golden CALMER error boundary — a crash anywhere in the tree shows a branded
   recovery screen instead of a white page of death. */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('[CALMER] UI crash:', error, info) }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-6 text-center">
        <div className="glass rounded-3xl p-10 max-w-md w-full">
          <img src="/icons/icon-192.png" alt="CALMER"
            className="w-20 h-20 mx-auto rounded-full border-2 border-[rgba(255,215,0,0.5)] breathe object-cover" />
          <h1 className="font-serif text-3xl gold-grad-text font-bold mt-5">Take a Deep Breath</h1>
          <p className="text-cream text-sm mt-3 leading-relaxed">
            Something unexpected happened, but your session and cart are safe.
            Reload and everything will be back to calm.
          </p>
          <div className="flex gap-3 mt-7">
            <button onClick={() => location.reload()} className="btn-gold flex-1 py-3.5">RELOAD APP</button>
            <button onClick={() => { location.href = '/' }} className="btn-outline flex-1 py-3.5">GO HOME</button>
          </div>
        </div>
      </main>
    )
  }
}
