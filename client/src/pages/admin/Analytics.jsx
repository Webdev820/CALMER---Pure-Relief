import React, { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Loader } from '../../components/Shared.jsx'
import { Dollar, Box, UserI, Leaf, ChartI } from '../../utils/icons.jsx'

export default function Analytics() {
  const { api } = useApp()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics').then(r => setStats(r.data)).catch(() => { }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader label="Crunching numbers" />
  if (!stats) return <p className="text-muted">Analytics unavailable.</p>

  const kpis = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: Dollar, tint: 'text-rich-gold' },
    { label: "Today's Revenue", value: `$${stats.todayRevenue.toFixed(2)}`, icon: ChartI, tint: 'text-warm-amber' },
    { label: 'Paid Orders', value: stats.totalOrders, icon: Box, tint: 'text-[#4FA3FF]' },
    { label: 'Active Deliveries', value: stats.activeOrders, icon: Box, tint: 'text-success' },
    { label: 'Clients', value: stats.totalClients, icon: UserI, tint: 'text-cream' },
    { label: 'Products', value: stats.totalProducts, icon: Leaf, tint: 'text-rich-gold' },
  ]

  const maxRev = Math.max(1, ...(stats.bestSellers || []).map(b => b.revenue))
  const avgOrder = stats.totalOrders ? stats.totalRevenue / stats.totalOrders : 0

  return (
    <section id="admin-analytics" className="space-y-8 animate-fadeInUp">
      <header className="relative overflow-hidden rounded-2xl">
        <img src="/assets/analytics.jpg" alt="analytics" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="relative p-8 bg-gradient-to-r from-deep-black/90 to-transparent">
          <h1 className="font-serif text-3xl text-cream">Business <span className="gold-grad-text">Analytics</span></h1>
          <p className="text-muted text-sm mt-1">Revenue, best sellers and performance at a glance.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(({ label, value, icon: Ic, tint }) => (
          <article key={label} className="glass rounded-2xl p-5 card-hover">
            <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${tint}`}><Ic size={18} /></div>
            <p className="text-2xl font-bold text-cream">{value}</p>
            <p className="text-xs text-muted mt-1">{label}</p>
          </article>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="glass rounded-2xl p-6">
          <h2 className="font-serif text-lg text-cream mb-5">Best Sellers by Revenue</h2>
          {(!stats.bestSellers || stats.bestSellers.length === 0) ? (
            <p className="text-muted text-sm">No sales yet. Best sellers will chart here.</p>
          ) : (
            <div className="space-y-4">
              {stats.bestSellers.map(b => (
                <div key={b.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-cream">{b.name}</span>
                    <span className="text-rich-gold font-medium">${b.revenue.toFixed(2)} <span className="text-muted text-xs">({b.units} sold)</span></span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full gold-grad rounded-full transition-all" style={{ width: `${(b.revenue / maxRev) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass rounded-2xl p-6">
          <h2 className="font-serif text-lg text-cream mb-5">Performance Summary</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted">Average order value</span>
              <span className="text-rich-gold font-semibold">${avgOrder.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted">Orders in fulfilment</span>
              <span className="text-cream font-semibold">{stats.activeOrders} of {stats.totalOrders}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted">Catalog size</span>
              <span className="text-cream font-semibold">{stats.totalProducts} products</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted">Registered clients</span>
              <span className="text-cream font-semibold">{stats.totalClients}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted mt-6">Figures update live as orders are paid. Connect MongoDB Atlas in production for persistent history.</p>
        </section>
      </div>
    </section>
  )
}
