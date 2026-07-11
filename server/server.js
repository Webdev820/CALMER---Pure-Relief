require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const helmet = require('helmet');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1); // required behind sandbox/Netlify/Render proxies so rate-limit keys real client IPs

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] } });
app.set('io', io);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })); // CSP off: Tailwind CDN + OSM tiles + inline PWA bootstrap
app.use(compression());
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '2mb' }));
app.use('/api/', rateLimit({ windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
// Stricter brute-force shield on auth (passkey guessing)
app.use('/api/auth/login', rateLimit({ windowMs: 5 * 60 * 1000, max: 25, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Breathe, and try again in a few minutes.' } }));

app.get('/api/health', (req, res) => res.json({
  status: 'ok', service: 'CALMER API',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  uptime: Math.round(process.uptime())
}));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api', require('./routes/misc'));

// 404 + error handlers
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// Serve the built frontend when available (single-host deployment: client/dist)
const path = require('path');
const fs = require('fs');
const distDir = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
  console.log('[CALMER] Serving frontend from client/dist');
}
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal server error' });
});

require('./socket')(io);

const PORT = process.env.PORT || 5000;

async function start() {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    // Dev fallback: in-memory MongoDB (no external DB needed for local preview)
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mem = await MongoMemoryServer.create();
      uri = mem.getUri('calmer');
      console.log('[CALMER] Using in-memory MongoDB (dev mode). Set MONGODB_URI for production.');
    } catch (e) {
      console.error('No MONGODB_URI set and in-memory server unavailable:', e.message);
      process.exit(1);
    }
  }
  await mongoose.connect(uri);
  console.log('[CALMER] MongoDB connected');

  // Seed products if empty
  const { Product } = require('./models');
  if (await Product.countDocuments() === 0) {
    await Product.insertMany(require('./config/seedProducts'));
    console.log('[CALMER] Seeded default products');
  }

  server.listen(PORT, '0.0.0.0', () => console.log(`[CALMER] API + Socket.io running on port ${PORT}`));
}

if (!process.env.JWT_SECRET) console.warn('[CALMER] WARNING: JWT_SECRET not set — using dev default. Set a strong secret in production!');

// Graceful shutdown: finish in-flight requests, close sockets + DB
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`[CALMER] ${sig} received — shutting down gracefully`);
    io.close();
    server.close(() => mongoose.connection.close(false).finally(() => process.exit(0)));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}

start().catch(e => { console.error(e); process.exit(1); });
