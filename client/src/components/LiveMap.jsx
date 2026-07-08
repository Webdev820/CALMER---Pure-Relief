import { useEffect, useRef } from 'react'
import L from 'leaflet'

/* Dark & gold themed Leaflet map with courier (gold bike) + client (pulsing gold pin) markers and red route line */
export default function LiveMap({ courier, client, height = 420, follow = true }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({})

  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const map = L.map(elRef.current, { zoomControl: true, attributionControl: false })
      .setView([client?.lat || 0, client?.lng || 0], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const Ls = layersRef.current

    const mk = (color, label) => L.divIcon({
      className: '',
      html: `<div class="${label === 'client' ? 'client-marker' : 'courier-marker'}" style="width:22px;height:22px;border-radius:9999px;background:${color};border:3px solid #0A0A0A;box-shadow:0 0 12px ${color}"></div>`,
      iconSize: [22, 22], iconAnchor: [11, 11]
    })

    if (client?.lat != null) {
      if (!Ls.client) Ls.client = L.marker([client.lat, client.lng], { icon: mk('#FFD700', 'client') }).addTo(map)
      else Ls.client.setLatLng([client.lat, client.lng])
    }
    if (courier?.lat != null) {
      if (!Ls.courier) Ls.courier = L.marker([courier.lat, courier.lng], { icon: mk('#4FA3FF', 'courier') }).addTo(map)
      else Ls.courier.setLatLng([courier.lat, courier.lng])
    }
    if (client?.lat != null && courier?.lat != null) {
      const pts = [[courier.lat, courier.lng], [client.lat, client.lng]]
      if (!Ls.route) Ls.route = L.polyline(pts, { color: '#FF3B3B', weight: 4, dashArray: '10 8', opacity: .9 }).addTo(map)
      else Ls.route.setLatLngs(pts)
      if (follow) map.fitBounds(L.latLngBounds(pts), { padding: [50, 50] })
    } else if (client?.lat != null && follow) {
      map.setView([client.lat, client.lng], 15)
    } else if (courier?.lat != null && follow) {
      map.setView([courier.lat, courier.lng], 15)
    }
  }, [courier?.lat, courier?.lng, client?.lat, client?.lng])

  return <div ref={elRef} className="map-dark w-full rounded-2xl border border-[rgba(255,215,0,0.28)]" style={{ height }} />
}

export function haversineKm(a, b) {
  const R = 6371, d = Math.PI / 180
  const h = Math.sin((b.lat - a.lat) * d / 2) ** 2 + Math.cos(a.lat * d) * Math.cos(b.lat * d) * Math.sin((b.lng - a.lng) * d / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
