import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useApp } from '../context/AppContext'
import { Logo } from '../components/Shared'
import InstallAppButton from '../components/InstallApp'
import { Leaf, Bike, Flask, Support, Cart, Lock, Star, Menu, X, Shield } from '../utils/icons'
import api from '../utils/api'

gsap.registerPlugin(ScrollTrigger)

/* ============ CINEMATIC SCROLL-SCRUB HERO VIDEO ============
   Client-provided 3D animated CALMER video (already edited + upscaled — served as-is).
   Scroll DOWN  → video plays forward (golden ganja transforms).
   Scroll UP    → video plays in reverse, back to the start.
   Implemented by mapping page scroll progress onto video.currentTime
   with a smoothed GSAP tween — buttery premium scrubbing, zero controls. */
function ScrollVideo() {
  const videoRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let trigger
    const proxy = { t: 0 }

    const setup = () => {
      const duration = video.duration
      if (!duration || trigger) return
      trigger = ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'max',
        scrub: 0.6,
        onUpdate: self => {
          gsap.to(proxy, {
            t: self.progress * duration,
            duration: 0.35,
            ease: 'power1.out',
            overwrite: true,
            onUpdate: () => {
              if (Math.abs(video.currentTime - proxy.t) > 0.01) video.currentTime = proxy.t
            }
          })
        }
      })
    }

    // iOS/Android unlock: a silent play/pause on first touch enables programmatic seeking
    const unlock = () => {
      video.play().then(() => video.pause()).catch(() => {})
      window.removeEventListener('touchstart', unlock)
    }
    window.addEventListener('touchstart', unlock, { once: true, passive: true })

    if (video.readyState >= 1) setup()
    video.addEventListener('loadedmetadata', setup)
    return () => {
      video.removeEventListener('loadedmetadata', setup)
      window.removeEventListener('touchstart', unlock)
      if (trigger) trigger.kill()
    }
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <div className="absolute -inset-8 bg-gradient-to-tr from-[#FFD700]/25 to-transparent blur-3xl rounded-full" aria-hidden="true" />
      <div className="relative mx-auto max-w-[420px]">
        {/* Golden cinematic frame */}
        <div className="relative rounded-3xl overflow-hidden border border-[rgba(255,215,0,0.35)] shadow-2xl shadow-[#FFD700]/30 bg-[#050505]">
          <video
            ref={videoRef}
            id="hero-scroll-video"
            src="/assets/hero-video.mp4"
            className="w-full h-auto block"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen"
            aria-label="CALMER cinematic 3D animation — scroll to play"
          />
          {/* Subtle premium vignette that never blocks the video */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/35 via-transparent to-black/20" aria-hidden="true" />
          <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none" aria-hidden="true">
            <span className="text-[10px] tracking-[.3em] uppercase text-[#FFD700]/80 bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-[#FFD700]/25">
              Scroll to Experience
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: <Leaf size={30} />, title: 'Premium Quality', desc: 'Lab-tested, organic cannabis from trusted sources' },
  { icon: <Bike size={30} />, title: 'Eco-Friendly Delivery', desc: 'Silent bicycle couriers for discreet, sustainable service' },
  { icon: <Flask size={30} />, title: 'Lab Tested', desc: 'Every batch tested for purity, potency, and peace of mind' },
  { icon: <Support size={30} />, title: '24/7 Wellness Support', desc: 'Our team is here for you, anytime you need guidance' },
]

const PRODUCTS = [
  { name: 'Golden Serenity Indica Flower', desc: 'Premium indoor flower, 20% THC, perfect for deep relaxation', price: 65, img: '/assets/products/golden-serenity.jpg' },
  { name: 'Wellness CBD Tincture 1000mg', desc: 'Full-spectrum CBD oil for anxiety relief and balance', price: 85, img: '/assets/products/cbd-tincture.jpg' },
  { name: 'Artisan Cannabis Chocolate 100mg', desc: 'Gourmet dark chocolate infused with 100mg THC', price: 40, img: '/assets/products/chocolate.jpg' },
]

const STEPS = [
  { n: 1, icon: <Cart size={26} />, title: 'Browse & Select', desc: 'Explore our curated selection of premium cannabis products', img: '/assets/products/pre-rolls.jpg' },
  { n: 2, icon: <Lock size={26} />, title: 'Secure Checkout', desc: 'Age verification, encrypted payment, and discreet billing', img: '/assets/payment.jpg' },
  { n: 3, icon: <Bike size={26} />, title: 'Eco-Delivery', desc: 'Our silent bicycle couriers deliver within 30 minutes', img: '/assets/tracking-rider.jpg' },
  { n: 4, icon: <Leaf size={26} />, title: 'Breathe, Unwind, Elevate', desc: 'Enjoy therapeutic relief in the comfort of your sanctuary', img: '/assets/review.jpg' },
]

export default function Landing() {
  const { user } = useApp()
  const nav = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reviews, setReviews] = useState([])
  const root = useRef(null)
  const assembledRef = useRef(null)
  const explodeRef = useRef(null)

  const orderNow = () => nav(user ? (user.role === 'admin' ? '/admin' : '/shop') : '/login')

  useEffect(() => {
    // Cinematic assemble/explode golden ganja leaf - crossfades with scroll progress.
    // Scroll DOWN -> leaf explodes into golden smoke (scales up).
    // Scroll UP -> smoke reassembles back into the solid golden leaf.
    let raf = 0
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        const p = Math.min(1, window.scrollY / (max * 0.6)) // full explosion by 60% scroll depth
        if (assembledRef.current) {
          assembledRef.current.style.opacity = String(0.16 * (1 - p))
          assembledRef.current.style.transform = `translate(-50%,-50%) scale(${1 + p * 0.25}) rotate(${p * 8}deg)`
        }
        if (explodeRef.current) {
          explodeRef.current.style.opacity = String(0.22 * p)
          explodeRef.current.style.transform = `translate(-50%,-50%) scale(${0.85 + p * 0.55}) rotate(${-p * 6}deg)`
        }
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    api.get('/reviews/public').then(r => setReviews(r.data)).catch(() => { })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-anim', { y: 40, opacity: 0, stagger: 0.2, duration: 0.9, ease: 'power3.out' })
      gsap.from('.hero-img', { scale: 0.95, rotate: -3, opacity: 0, duration: 1.1, delay: 0.3, ease: 'power3.out' })
      gsap.utils.toArray('.st-fade').forEach(el => {
        gsap.from(el, { y: 50, opacity: 0, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 85%' } })
      })
      gsap.utils.toArray('.st-stagger').forEach(grp => {
        gsap.from(grp.children, { y: 50, opacity: 0, stagger: 0.15, duration: 0.7, scrollTrigger: { trigger: grp, start: 'top 82%' } })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* ============ CINEMATIC ASSEMBLE / EXPLODE LEAF BACKDROP ============ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <img ref={assembledRef} src="/assets/leaf-assembled.jpg" alt=""
          className="absolute top-1/2 left-1/2 w-[110vmin] max-w-none will-change-transform"
          style={{ opacity: 0.16, transform: 'translate(-50%,-50%)', mixBlendMode: 'screen', transition: 'opacity .15s linear' }} />
        <img ref={explodeRef} src="/assets/leaf-explode.jpg" alt=""
          className="absolute top-1/2 left-1/2 w-[130vmin] max-w-none will-change-transform"
          style={{ opacity: 0, transform: 'translate(-50%,-50%) scale(.85)', mixBlendMode: 'screen', transition: 'opacity .15s linear' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-transparent to-[#0A0A0A]/80" />
      </div>
      <div className="relative z-10">
      {/* ============ NAVBAR ============ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-lg shadow-lg shadow-[#FFD700]/10' : 'bg-transparent'}`}>
        <nav id="main-nav" className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link to="/"><Logo showTag /></Link>
          <ul className="hidden md:flex items-center gap-8 text-sm">
            {['Home', 'Products', 'How It Works', 'About Us', 'Contact'].map(l => (
              <li key={l}><a href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="nav-link">{l}</a></li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <InstallAppButton variant="compact" className="hidden lg:flex" />
            <button onClick={orderNow} className="btn-gold px-6 py-2.5 text-sm hidden sm:block">Order Now</button>
            <button className="md:hidden text-[#FFD700]" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div className="md:hidden glass mx-4 rounded-2xl p-5 space-y-4">
            {['Home', 'Products', 'How It Works', 'About Us', 'Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} onClick={() => setMenuOpen(false)} className="block text-cream hover:text-[#FFD700]">{l}</a>
            ))}
            <button onClick={orderNow} className="btn-gold w-full py-3">Order Now</button>
            <InstallAppButton variant="bar" />
          </div>
        )}
      </header>

      {/* ============ HERO ============ */}
      <section id="home" className="relative pt-32 pb-20 px-5">
        <div className="absolute inset-0 opacity-[0.05] bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url(/assets/why-choose.jpg)" }} />
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative">
          <div>
            <h1 className="hero-anim font-serif text-5xl md:text-7xl font-bold gold-grad-text leading-tight drop-shadow-lg">
              Pure Cannabis Wellness, Delivered to Your Sanctuary
            </h1>
            <p className="hero-anim text-cream text-lg md:text-xl leading-relaxed mt-6 max-w-xl">
              Premium, lab-tested cannabis products for relaxation, relief, and elevation.
              Eco-friendly bicycle delivery. Discreet. Professional. Trusted.
            </p>
            <div className="hero-anim flex flex-wrap gap-4 mt-9">
              <button onClick={orderNow} className="btn-gold glow-pulse px-8 py-4 text-base">Explore Products</button>
              <a href="#how-it-works" className="btn-outline px-8 py-4 text-base">How CALMER Works</a>
            </div>
            <div className="hero-anim mt-5 max-w-md">
              <InstallAppButton variant="hero" className="w-full" />
              <p className="text-muted text-[11px] text-center mt-2 tracking-wide">Free • Works offline • Live order alerts • iPhone & Android</p>
            </div>
          </div>
          <div className="hero-img relative">
            <ScrollVideo />
          </div>
        </div>
      </section>

      {/* ============ WHY CHOOSE ============ */}
      <section id="about-us" className="relative py-20 px-5">
        <div className="absolute inset-0 opacity-[0.04] bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url(/assets/testimonials.jpg)" }} />
        <div className="max-w-7xl mx-auto relative">
          <h2 className="st-fade font-serif text-4xl md:text-5xl text-center gold-grad-text mb-4">Why CALMER is Your Trusted Wellness Partner</h2>
          <p className="st-fade text-center text-muted mb-12">Exceptional quality. Fast delivery. Always here for you. Tested. Trusted. CALMER.</p>
          <div className="st-stagger grid md:grid-cols-4 sm:grid-cols-2 gap-6">
            {FEATURES.map(f => (
              <article key={f.title} className="glass rounded-2xl p-7 card-hover text-center">
                <div className="w-16 h-16 mx-auto rounded-full border border-[rgba(255,215,0,0.4)] flex items-center justify-center text-[#FFD700] mb-5">{f.icon}</div>
                <h3 className="font-serif text-xl gold-text font-bold mb-2">{f.title}</h3>
                <p className="text-cream text-sm leading-relaxed">{f.desc}</p>
              </article>
            ))}
          </div>
          <div className="st-fade mt-12">
            <img src="/assets/why-choose.jpg" alt="Why choose CALMER - premium quality, fast delivery, 24/7 support, lab tested"
              className="w-full rounded-3xl border border-[rgba(255,215,0,0.28)] shadow-2xl object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      <section id="products" className="py-20 px-5">
        <div className="max-w-7xl mx-auto">
          <h2 className="st-fade font-serif text-4xl md:text-5xl text-center gold-grad-text mb-3">This Week's Wellness Essentials</h2>
          <p className="st-fade text-center text-muted mb-12">Premium cannabis. Curated for you.</p>
          <div className="st-stagger grid md:grid-cols-3 gap-8">
            {PRODUCTS.map(p => (
              <article key={p.name} className="glass rounded-3xl overflow-hidden card-hover shadow-xl">
                <div className="img-zoom h-64 relative bg-[#050505]">
                  <div className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40" style={{ backgroundImage: `url(${p.img})` }} aria-hidden="true" />
                  <img src={p.img} alt={p.name} className="relative w-full h-full object-contain" loading="lazy" />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl gold-text font-bold">{p.name}</h3>
                  <p className="text-cream text-sm mt-2">{p.desc}</p>
                  <div className="flex items-center justify-between mt-5">
                    <span className="text-2xl gold-text font-bold">${p.price}</span>
                    <button onClick={orderNow} className="btn-gold px-5 py-2 text-sm">Add to Cart</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIAL ============ */}
      <section className="relative py-24 px-5 bg-[#0A0A0A]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />
        <div className="max-w-5xl mx-auto text-center">
          <div className="st-fade flex justify-center gap-1 mb-6">{[...Array(5)].map((_, i) => <Star key={i} size={26} />)}</div>
          <blockquote className="st-fade font-serif italic text-2xl md:text-4xl text-cream leading-relaxed drop-shadow-lg">
            "CALMER has completely transformed my evenings. The quality is unmatched, and the bicycle delivery is so quiet
            and professional. It feels like a luxury spa experience at home."
          </blockquote>
          <div className="st-fade mt-8 flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full border-2 border-[#FFD700] shadow-lg overflow-hidden">
              <img src="/assets/profile.jpg" alt="Sarah M., CALMER wellness member" className="w-full h-full object-cover object-top" style={{ objectPosition: '50% 12%' }} loading="lazy" />
            </div>
            <p className="gold-text font-semibold text-lg">Sarah M., Wellness Enthusiast</p>
          </div>
          {reviews.length > 0 && (
            <div className="st-stagger grid sm:grid-cols-3 gap-4 mt-12 text-left">
              {reviews.slice(0, 3).map((r, i) => (
                <div key={i} className="glass rounded-2xl p-5">
                  <div className="flex gap-0.5 mb-2">{[...Array(r.rating)].map((_, j) => <Star key={j} size={14} />)}</div>
                  <p className="text-cream text-sm italic">"{r.review}"</p>
                  <p className="gold-text text-xs mt-3 font-semibold">{r.username}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-20 px-5">
        <div className="max-w-7xl mx-auto">
          <h2 className="st-fade font-serif text-4xl md:text-5xl text-center gold-grad-text mb-12">Your Wellness Journey in 4 Simple Steps</h2>
          <div className="st-fade mb-12">
            <img src="/assets/how-it-works.jpg" alt="How CALMER works - package, bike delivery, unboxing, premium selection"
              className="w-full rounded-3xl border border-[rgba(255,215,0,0.28)] shadow-2xl object-cover" loading="lazy" />
          </div>
          <div className="st-stagger grid md:grid-cols-4 sm:grid-cols-2 gap-6 relative">
            {STEPS.map(s => (
              <article key={s.n} className="glass rounded-2xl overflow-hidden card-hover">
                <div className="img-zoom h-40 relative bg-[#050505]">
                  <div className="absolute inset-0 bg-cover bg-center blur-2xl scale-110 opacity-40" style={{ backgroundImage: `url(${s.img})` }} aria-hidden="true" />
                  <img src={s.img} alt={s.title} className="relative w-full h-full object-contain" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-full gold-grad flex items-center justify-center font-bold text-sm">{s.n}</span>
                    <span className="text-[#FFD700]">{s.icon}</span>
                  </div>
                  <h3 className="font-serif text-lg gold-text font-bold">{s.title}</h3>
                  <p className="text-cream text-sm mt-2">{s.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="py-16 px-5">
        <div className="max-w-5xl mx-auto glass rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FFD700]/10 blur-3xl rounded-full" />
          <h2 className="font-serif text-3xl md:text-4xl gold-grad-text">Ready to Elevate Your Evenings?</h2>
          <p className="text-cream mt-3">Join the CALMER wellness community. Discreet delivery in 30 minutes.</p>
          <button onClick={orderNow} className="btn-gold glow-pulse px-10 py-4 mt-8 text-lg">Order Now</button>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="bg-[#0A0A0A] border-t border-[rgba(255,215,0,0.15)] pt-14 pb-8 px-5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 sm:grid-cols-2 gap-10">
          <div>
            <Logo size={52} showTag />
            <p className="text-muted text-sm mt-4 leading-relaxed">Premium cannabis wellness delivery. Licensed, trusted, discreet.</p>
          </div>
          <nav aria-label="Quick links">
            <h3 className="gold-text font-serif font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-cream">
              {[['Products', '#products'], ['How It Works', '#how-it-works'], ['About Us', '#about-us'], ['Contact', '#contact'], ['FAQs', '#contact']].map(([l, h]) => (
                <li key={l}><a href={h} className="hover:text-[#FFD700] transition">{l}</a></li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h3 className="gold-text font-serif font-bold mb-4">Terms & Policy</h3>
            <ul className="space-y-2 text-sm text-cream">
              {['Terms & Conditions', 'Privacy Policy', 'Responsible Use'].map(l => (
                <li key={l}><a href="#contact" className="hover:text-[#FFD700] transition">{l}</a></li>
              ))}
            </ul>
          </nav>
          <div>
            <h3 className="gold-text font-serif font-bold mb-4">Join the Wellness Community</h3>
            <form onSubmit={e => e.preventDefault()} className="flex gap-2">
              <input type="email" required placeholder="Your email" aria-label="Email address" className="field text-sm" />
              <button className="btn-gold px-5 text-sm shrink-0">Subscribe</button>
            </form>
            <div className="flex gap-3 mt-5 text-[#FFD700]">
              <a href="#contact" aria-label="Instagram" className="w-9 h-9 rounded-full border border-[rgba(255,215,0,0.4)] flex items-center justify-center hover:bg-[#FFD700]/10 transition">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" /></svg>
              </a>
              <a href="#contact" aria-label="TikTok" className="w-9 h-9 rounded-full border border-[rgba(255,215,0,0.4)] flex items-center justify-center hover:bg-[#FFD700]/10 transition">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.5 3c.4 2.2 1.8 3.7 4 4v3c-1.6 0-3-.5-4-1.3v6.8a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.1a3 3 0 1 0 2 2.8V3h3z" /></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[rgba(255,215,0,0.1)] text-center">
          <p className="text-muted text-xs">© 2024 CALMER. All rights reserved. Licensed cannabis delivery service.</p>
          <p className="text-muted text-xs mt-1 flex items-center justify-center gap-1.5"><Shield size={12} /> Use responsibly. Not for use by pregnant or nursing individuals. 21+ only.</p>
        </div>
      </footer>
      </div>
    </div>
  )
}
