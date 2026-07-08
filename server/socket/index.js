const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Haversine distance in km
function distKm(a, b) {
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * d2r, dLng = (b.lng - a.lng) * d2r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * d2r) * Math.cos(b.lat * d2r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

module.exports = function initSocket(io) {
  // Auth middleware for sockets
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('auth required'));
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch { next(new Error('invalid token')); }
  });

  const proximityAlerted = new Set();

  io.on('connection', (socket) => {
    const u = socket.user;
    socket.join(`user:${u.id}`);
    socket.join(u.role === 'admin' ? 'admins' : 'clients');

    // Admin live position broadcast during delivery
    socket.on('admin_location_update', ({ orderId, latitude, longitude, clientLat, clientLng, speedKmh = 15 }) => {
      if (u.role !== 'admin') return;
      io.to('admins').emit('admin_position', { orderId, latitude, longitude });
      // relay to the tracked client too
      socket.to('clients').emit('courier_position', { orderId, latitude, longitude });

      // 5-minute proximity alert
      if (clientLat != null && clientLng != null && !proximityAlerted.has(orderId)) {
        const km = distKm({ lat: latitude, lng: longitude }, { lat: clientLat, lng: clientLng });
        const etaMin = (km / speedKmh) * 60;
        if (etaMin <= 5) {
          proximityAlerted.add(orderId);
          io.to('clients').emit('proximity_alert', {
            orderId,
            message: 'Your CALMER delivery is 5 minutes away! Get ready.'
          });
        }
      }
    });

    socket.on('delivery_started', ({ orderId }) => {
      if (u.role !== 'admin') return;
      proximityAlerted.delete(orderId);
      io.to('clients').emit('order_update', { orderId, deliveryStatus: 'on_the_way', message: 'Your order is on the way!' });
    });

    // Typing indicators (CALMER VIBE)
    socket.on('typing', ({ orderId, to }) => {
      if (to === 'admin') io.to('admins').emit('typing', { orderId, from: u.username });
      else if (to) io.to(`user:${to}`).emit('typing', { orderId, from: u.username });
    });

    // WebRTC signaling relay
    socket.on('webrtc_signal', ({ to, data, orderId }) => {
      if (to) io.to(`user:${to}`).emit('webrtc_signal', { from: u.id, fromName: u.username, data, orderId });
    });
    socket.on('call_answered', ({ to, orderId }) => {
      if (to) io.to(`user:${to}`).emit('call_answered', { orderId, by: u.username });
    });
    socket.on('call_ended', ({ to, orderId }) => {
      if (to) io.to(`user:${to}`).emit('call_ended', { orderId });
    });
  });
};
