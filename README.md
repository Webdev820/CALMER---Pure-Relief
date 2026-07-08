# CALMER — Pure Relief

**Breathe, Unwind, Elevate.**

A complete full-stack cannabis wellness delivery system: cinematic landing page, secure passkey authentication, product shop, live checkout with PayPal-style payments, real-time order tracking on a live map, CALMER VIBE chat + voice calls, and a powerful admin control center.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5, Tailwind CSS, GSAP, Leaflet, Socket.io-client |
| Backend | Node.js + Express, Socket.io, JWT, bcryptjs |
| Database | MongoDB (Mongoose) — **auto-falls back to in-memory MongoDB when `MONGODB_URI` is not set**, so the API runs on any host with zero DB setup |
| Realtime | Socket.io (notifications, chat, live tracking, WebRTC signaling) |
| Voice calls | WebRTC (Google STUN) |

## Features

### Client
- Cinematic dark-luxury landing page with scroll-driven golden-leaf assemble/explode effect
- `@username` + one-time generated `CALMER-XXXX-XXXX-XXXX` passkey auth (bcrypt-hashed, shown once like an API key)
- Product catalog with categories, new-arrival carousel, cart and instant Order Now
- Checkout: delivery address, **PIN LIVE LOCATION** (geolocation), PayPal / card / cash payment simulation
- Order Confirmed screen + real-time order status progress (Confirmed → On the way → Near you → Delivered)
- Live delivery tracking map with courier position, red route line, and a "5 minutes away" proximity alert
- CALMER VIBE: per-order chat with the admin + incoming voice calls (WebRTC)
- Ratings & reviews (4★+ shown on the landing page)

### Admin (`@admin-username` + `CALMER-ADMIN-...` passkey; requires email + phone)
- Overview dashboard with revenue/orders/clients KPIs and real-time new-order sound alert
- Order management: filter tabs, one-click status advance, full order details, jump to chat/tracking
- Product management: add/edit/delete; NEW ARRIVAL broadcasts a notification to every client
- CALMER VIBE communications: chat threads per order + **CALL CLIENT** (WebRTC voice)
- Live Tracking: broadcasts admin geolocation every 5 seconds, distance + ETA, auto proximity alert
- Analytics: revenue, best sellers, performance summary
- Settings: broadcast announcements to all clients

## Project Structure

```
webapp/
├── client/                 # React + Vite frontend
│   ├── public/assets/      # CALMER brand images + product photos
│   ├── src/
│   │   ├── components/     # Shared UI, LiveMap, CallOverlay
│   │   ├── context/        # Global state + Socket.io wiring
│   │   ├── pages/          # Landing, Auth, client/*, admin/*
│   │   └── utils/          # axios API client, SVG icon set
│   └── vite.config.js      # dev proxy /api + /socket.io → :5000
├── server/                 # Express + Socket.io backend
│   ├── config/             # seed products
│   ├── middleware/         # JWT auth
│   ├── models/             # User, Product, Order, Notification, Conversation
│   ├── routes/             # auth, products, orders, payments, chats, calls, analytics
│   ├── socket/             # realtime events, tracking relay, WebRTC signaling
│   └── server.js
└── ecosystem.config.cjs    # PM2 config (sandbox/dev)
```

## Quick Start (Local — no database needed)

```bash
# 1. Backend  (runs with in-memory MongoDB automatically)
cd server
npm install
npm start          # API + Socket.io on http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev        # App on http://localhost:3000 (proxies /api to :5000)
```

Open http://localhost:3000 — register a client (`@yourname`) and an admin (`@admin-yourname`, needs email + phone).

## Environment Variables

### server/.env
```
PORT=5000
MONGODB_URI=            # leave empty for in-memory dev DB; set MongoDB Atlas URI in production
JWT_SECRET=change-me-to-a-long-random-string
CLIENT_ORIGIN=*         # set to your Netlify URL in production
```

### client/.env
```
VITE_API_URL=           # empty for local dev; set to your backend URL in production
```

## Production Deployment

- **Frontend** → Netlify: build command `npm run build`, publish dir `client/dist`, env `VITE_API_URL=https://your-backend-url`
- **Backend** → any Node host (PandaStack, Render, Railway…): `npm install && npm start` with `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` set
- **Database** → MongoDB Atlas free tier (or run without it — the API falls back to in-memory storage, data resets on restart)

See the step-by-step deployment guide provided with the project for exact copy-paste commands.

## Data Models

- **User**: username (`@...`), bcrypt-hashed passkey, role client/admin, email, phone
- **Product**: name, description, category, price, THC/CBD content, image, stock, featured, isNewArrival
- **Order**: auto number `CLM-YYYY-XXXXXX`, products, totals, payment + delivery status, delivery address, pinned live location, rating/review
- **Notification**: recipient or broadcast, type, read state
- **Conversation**: per-order messages (text/system/call) + call logs

## Security Notes

- Passkeys are shown **once** at generation and stored only as bcrypt hashes — they cannot be recovered
- JWT (7-day) for API + Socket.io handshake auth
- Rate limiting on all API routes
- Set a strong `JWT_SECRET` and a specific `CLIENT_ORIGIN` in production

---
CALMER — Pure Relief. For lawful use in licensed jurisdictions only. 21+
