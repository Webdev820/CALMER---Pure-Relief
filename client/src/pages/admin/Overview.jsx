import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { Loader } from '../../components/Shared.jsx'
import { Dollar, Box, Truck, UserI, ArrowR, Bell } from '../../utils/icons.jsx'

const STATUS_BADGE = {
  pending: 'bg-[rgba(141,141,141,0.2)] text-muted',
  processing: 'bg-[rgba(255,193,7,0.15)] text-warm-amber',
  on_the_way: 'bg-[rgba(79,163,255,0.15)] text-[#4FA3FF]',
  delivered: 'bg-[rgba(57,217,138,0.15)] text-success',
}
export const statusLabel = s => ({ pending: 'Pending', processing: 'Processing', on_the_way: 'On The Way', delivered: 'Delivered' }[s] || s)

export default function Overview() {
  const { api, socket } = useApp()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [a, o] = await Promise.all([api.get('/analytics'), api.get('/orders')])
      setStats(a.data)
      setOrders(o.data.slice(0, 8))
    } catch { }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const s = socket()
    if (s) { s.on('new_order', load); s.on('location_pinned', load) }
    return () => { if (s) { s.off('new_order', load); s.off('location_pinned', load) } }
  }, [])

  if (loading) return <Loader label="Loading dashboard" />

  const cards = [
    { label: "Today's Revenue", value: `$${(stats?.todayRevenue || 0).toFixed(2)}`, icon: Dollar, tint: 'text-rich-gold' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: Box, tint: 'text-warm-amber' },
    { label: 'Active Deliveries', value: stats?.activeOrders || 0, icon: Truck, tint: 'text-[#4FA3FF]' },
    { label: 'Total Clients', value: stats?.totalClients || 0, icon: UserI, tint: 'text-success' },
  ]

  return (
    <section id="admin-overview" className="space-y-8 animate-fadeInUp">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-cream">Dashboard <span className="gold-grad-text">Overview</span></h1>
          <p className="text-muted text-sm mt-1">Welcome back. Here is what is happening at CALMER today.</p>
        </div>
        <Link to="/admin/orders" className="hidden sm:flex items-center gap-2 text-rich-gold text-sm hover:underline">
          Manage Orders <ArrowR size={16} />
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Ic, tint }) => (
          <article key={label} className="glass rounded-2xl p-5 card-hover">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${tint}`}><Ic size={20} /></div>
            <p className="text-2xl font-bold text-cream">{value}</p>
            <p className="text-xs text-muted mt-1">{label}</p>
          </article>
        ))}
      </div>

      <section className="glass rounded-2xl overflow-hidden">
        <header className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,215,0,0.12)]">
          <h2 className="font-serif text-lg text-cream flex items-center gap-2"><Bell size={16} className="text-rich-gold" /> Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-rich-gold hover:underline">View all</Link>
        </header>
        {orders.length === 0 ? (
          <p className="text-muted text-sm p-6">No orders yet. New paid orders will appear here in real time with a sound alert.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs uppercase tracking-wider">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} className="border-t border-white/5 hover:bg-white/5 transition">
                    <td className="px-5 py-3 font-medium text-rich-gold">{o.orderNumber}</td>
                    <td className="px-5 py-3 text-cream">{o.clientId?.username || '—'}</td>
                    <td className="px-5 py-3 text-muted">{o.products?.reduce((s, p) => s + p.quantity, 0)} items</td>
                    <td className="px-5 py-3 text-cream">${o.totalAmount?.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${o.paymentStatus === 'paid' ? 'text-success' : 'text-warm-amber'}`}>{o.paymentStatus}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_BADGE[o.deliveryStatus] || ''}`}>{statusLabel(o.deliveryStatus)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {stats?.bestSellers?.length > 0 && (
        <section className="glass rounded-2xl p-5">
          <h2 className="font-serif text-lg text-cream mb-4">Best Sellers</h2>
          <div className="space-y-3">
            {stats.bestSellers.map((b, i) => (
              <div key={b.name} className="flex items-center gap-3">
                <span className="w-6 text-rich-gold font-bold">{i + 1}</span>
                <span className="flex-1 text-sm text-cream">{b.name}</span>
                <span className="text-xs text-muted">{b.units} sold</span>
                <span className="text-sm text-rich-gold font-medium">${b.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}
