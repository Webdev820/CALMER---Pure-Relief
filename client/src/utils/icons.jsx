// Inline golden SVG icons (no emoji, no external icon fonts needed)
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Svg = ({ children, size = 22, ...p }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} {...S} {...p}>{children}</svg>
)

export const Leaf = (p) => <Svg {...p}><path d="M12 2C9 7 4 8.5 4 14a8 8 0 0 0 16 0c0-5.5-5-7-8-12z" /><path d="M12 22V8" /><path d="M12 13l3.5-3M12 16l-4-3.5" /></Svg>
export const Bike = (p) => <Svg {...p}><circle cx="6" cy="16.5" r="3.5" /><circle cx="18" cy="16.5" r="3.5" /><path d="M6 16.5 10 9h5l3 7.5M10 9 8.5 6H6" /><path d="M13 16.5h-2.5" /></Svg>
export const Cart = (p) => <Svg {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.3h7.7a1.5 1.5 0 0 0 1.5-1.2L20 8H6" /></Svg>
export const Bell = (p) => <Svg {...p}><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></Svg>
export const Lock = (p) => <Svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></Svg>
export const UserI = (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></Svg>
export const Pin = (p) => <Svg {...p}><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Svg>
export const Phone = (p) => <Svg {...p}><path d="M5 4h4l1.5 4.5-2.2 1.6a13 13 0 0 0 5.6 5.6l1.6-2.2L20 15v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg>
export const Chat = (p) => <Svg {...p}><path d="M21 12a8 8 0 0 1-8 8H4l2-3.2A8 8 0 1 1 21 12z" /></Svg>
export const Shield = (p) => <Svg {...p}><path d="M12 2 4.5 5v6c0 5 3.2 8.7 7.5 11 4.3-2.3 7.5-6 7.5-11V5L12 2z" /><path d="m9 12 2 2 4-4.5" /></Svg>
export const Clock = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Svg>
export const Flask = (p) => <Svg {...p}><path d="M9 3h6M10 3v6L4.7 18a2 2 0 0 0 1.8 3h11a2 2 0 0 0 1.8-3L14 9V3" /><path d="M7.5 15h9" /></Svg>
export const Star = ({ filled = true, size = 18, ...p }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={filled ? '#FFD700' : 'none'} stroke="#FFD700" strokeWidth="1.4" {...p}>
    <path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9 2.9-6z" />
  </svg>
)
export const Home = (p) => <Svg {...p}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /></Svg>
export const Box = (p) => <Svg {...p}><path d="m12 2 8.5 4.8v9.6L12 21l-8.5-4.6V6.8L12 2z" /><path d="M3.5 6.8 12 11.5l8.5-4.7M12 21v-9.5" /></Svg>
export const ChartI = (p) => <Svg {...p}><path d="M4 20V4M4 20h16" /><path d="m7 15 4-5 3 3 5-7" /></Svg>
export const Gear = (p) => <Svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.07-.4.1-.8.1-1.2z" /></Svg>
export const Logout = (p) => <Svg {...p}><path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" /><path d="m11 12h10m0 0-3.5-3.5M21 12l-3.5 3.5" /></Svg>
export const Search = (p) => <Svg {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.8-4.8" /></Svg>
export const Copy = (p) => <Svg {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Svg>
export const Check = (p) => <Svg {...p}><path d="m4 12.5 5 5L20 6.5" /></Svg>
export const X = (p) => <Svg {...p}><path d="M5 5l14 14M19 5 5 19" /></Svg>
export const Plus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const Minus = (p) => <Svg {...p}><path d="M5 12h14" /></Svg>
export const Trash = (p) => <Svg {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7" /></Svg>
export const Edit = (p) => <Svg {...p}><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z" /><path d="m13.5 6.5 3 3" /></Svg>
export const Truck = (p) => <Svg {...p}><rect x="2" y="6" width="12" height="10" rx="1" /><path d="M14 10h4l3 3v3h-3" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></Svg>
export const MapI = (p) => <Svg {...p}><path d="m9 4-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></Svg>
export const Heart = (p) => <Svg {...p}><path d="M12 21S3 14.5 3 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9 2.8C21 14.5 12 21 12 21z" /></Svg>
export const Eye = (p) => <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Svg>
export const Send = (p) => <Svg {...p}><path d="m22 2-9.5 20-2.7-8.3L2 11l20-9z" /><path d="M22 2 9.8 13.7" /></Svg>
export const Dollar = (p) => <Svg {...p}><circle cx="12" cy="12" r="9.5" /><path d="M12 6.5v11M15 8.8c-.6-1-1.7-1.4-3-1.4-1.6 0-2.9.8-2.9 2.2 0 2.8 6 1.9 6 4.7 0 1.5-1.4 2.3-3.1 2.3-1.5 0-2.7-.6-3.2-1.7" /></Svg>
export const Menu = (p) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>
export const ArrowR = (p) => <Svg {...p}><path d="M4 12h16m0 0-5.5-5.5M20 12l-5.5 5.5" /></Svg>
export const Support = (p) => <Svg {...p}><path d="M4 13a8 8 0 0 1 16 0" /><rect x="2.5" y="13" width="4" height="6" rx="1.5" /><rect x="17.5" y="13" width="4" height="6" rx="1.5" /><path d="M19.5 19a4 4 0 0 1-4 3h-2" /></Svg>
export const Wallet = (p) => <Svg {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12.5h5M3 9h18" /></Svg>
export const Cash = (p) => <Svg {...p}><rect x="2.5" y="6.5" width="19" height="11" rx="1.5" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v.01M18 14.5v.01" /></Svg>
export const Card = (p) => <Svg {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="2" /><path d="M2.5 10h19M6 15h4" /></Svg>
export const Crown = (p) => <Svg {...p}><path d="m3 8 4.5 4L12 5l4.5 7L21 8l-1.5 10h-15L3 8z" /></Svg>
