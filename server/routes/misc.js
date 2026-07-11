const express = require('express');
const { Order, Notification, Conversation, User, Product } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

/* ============ PAYMENTS (PayPal-style simulation; swap in live PayPal SDK creds in production) ============ */
router.post('/payments/create-intent', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Ownership: only the order's client (or an admin) may create a payment intent
    if (req.user.role !== 'admin' && String(order.clientId) !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });
    res.json({ intentId: `PAYPAL-INT-${order._id}`, amount: order.totalAmount, currency: 'USD' });
  } catch { res.status(400).json({ error: 'Invalid order id' }); }
});

router.post('/payments/confirm', auth, async (req, res) => {
  try {
    const { orderId, paymentMethod = 'paypal' } = req.body;
    const order = await Order.findById(orderId).populate('clientId', 'username');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    // Ownership: a client can only pay for their own order
    if (req.user.role !== 'admin' && String(order.clientId._id) !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });
    // Idempotency: never double-fire admin alerts / re-process a paid order
    if (order.paymentStatus === 'paid')
      return res.json({ success: true, message: 'Order already paid.', order });
    if (!['paypal', 'card', 'cash'].includes(paymentMethod))
      return res.status(400).json({ error: 'Invalid payment method' });
    order.paymentStatus = 'paid';
    order.deliveryStatus = 'processing';
    order.paymentMethod = paymentMethod;
    await order.save();

    await Notification.create({
      recipientId: null, type: 'payment_received',
      title: 'New Order Paid',
      message: `New Order ${order.orderNumber} - $${order.totalAmount.toFixed(2)} from ${order.clientId.username}`,
      meta: { forAdmin: true, orderId: order._id }
    });

    const io = req.app.get('io');
    io && io.to('admins').emit('new_order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.totalAmount,
      client: order.clientId.username,
      locationPinned: order.liveLocation?.pinned || false
    });

    // Ensure a conversation exists for this order (CALMER VIBE)
    let convo = await Conversation.findOne({ orderId: order._id });
    if (!convo) {
      convo = await Conversation.create({
        orderId: order._id, clientId: order.clientId._id,
        messages: [{ senderName: 'CALMER System', message: `Order ${order.orderNumber} confirmed. Payment received.`, type: 'system' }]
      });
    }

    res.json({
      success: true,
      message: 'Confirmed! Payment received and your order is being worked on. You will receive a message shortly in our CALMER system about your order.',
      order
    });
  } catch { res.status(500).json({ error: 'Payment confirmation failed' }); }
});

/* ============ NOTIFICATIONS ============ */
router.get('/notifications', auth, async (req, res) => {
  const q = req.user.role === 'admin'
    ? { $or: [{ 'meta.forAdmin': true }, { recipientId: req.user.id }] }
    : { $or: [{ recipientId: req.user.id }, { broadcast: true }] };
  const items = await Notification.find(q).sort({ createdAt: -1 }).limit(50).lean();
  res.json(items);
});

router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    // Ownership: only mark your own (or broadcast/admin-scoped when admin) notifications
    const q = req.user.role === 'admin'
      ? { _id: req.params.id, $or: [{ 'meta.forAdmin': true }, { recipientId: req.user.id }] }
      : { _id: req.params.id, $or: [{ recipientId: req.user.id }, { broadcast: true }] };
    const n = await Notification.findOneAndUpdate(q, { read: true });
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json({ ok: true });
  } catch { res.status(400).json({ error: 'Invalid id' }); }
});

router.post('/notifications/send', auth, adminOnly, async (req, res) => {
  const { recipientId, broadcast = false, title, message, type = 'system' } = req.body;
  const n = await Notification.create({ recipientId, broadcast, title, message, type });
  const io = req.app.get('io');
  if (io) {
    if (broadcast) io.to('clients').emit('notification', { title, message, type });
    else if (recipientId) io.to(`user:${recipientId}`).emit('notification', { title, message, type });
  }
  res.status(201).json(n);
});

/* ============ CALMER VIBE (chat) ============ */
router.get('/chats', auth, async (req, res) => {
  const q = req.user.role === 'admin' ? {} : { clientId: req.user.id };
  const convos = await Conversation.find(q)
    .populate('clientId', 'username')
    .populate('orderId', 'orderNumber deliveryStatus')
    .sort({ updatedAt: -1 }).lean();
  res.json(convos);
});

router.get('/chats/:orderId', auth, async (req, res) => {
  const convo = await Conversation.findOne({ orderId: req.params.orderId })
    .populate('clientId', 'username').lean();
  if (!convo) return res.status(404).json({ error: 'Conversation not found' });
  if (req.user.role !== 'admin' && String(convo.clientId._id) !== req.user.id)
    return res.status(403).json({ error: 'Access denied' });
  res.json(convo);
});

router.post('/chats/:orderId', auth, async (req, res) => {
  try {
    const { message, type = 'text' } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ error: 'Message cannot be empty' });
    if (String(message).length > 2000) return res.status(400).json({ error: 'Message too long (max 2000 chars)' });
    let convo = await Conversation.findOne({ orderId: req.params.orderId });
    if (!convo) {
      const order = await Order.findById(req.params.orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      convo = await Conversation.create({ orderId: order._id, clientId: order.clientId, messages: [] });
    }
    if (req.user.role !== 'admin' && String(convo.clientId) !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    const safeType = req.user.role === 'admin' ? type : 'text'; // clients cannot forge system/call messages
    const msg = { senderId: req.user.id, senderName: req.user.username, message: String(message).trim(), type: safeType, timestamp: new Date() };
    convo.messages.push(msg);
    await convo.save();

    const io = req.app.get('io');
    if (io) {
      const payload = { orderId: req.params.orderId, ...msg };
      if (req.user.role === 'admin') io.to(`user:${convo.clientId}`).emit('admin_message', payload);
      else io.to('admins').emit('message_received', payload);
    }
    res.status(201).json(msg);
  } catch { res.status(500).json({ error: 'Message failed' }); }
});

/* ============ CALLS (WebRTC signaling bootstrap) ============ */
router.post('/calls/initiate', auth, adminOnly, async (req, res) => {
  const { orderId } = req.body;
  const convo = await Conversation.findOne({ orderId });
  if (!convo) return res.status(404).json({ error: 'Conversation not found' });
  convo.callLogs.push({ initiator: req.user.id, duration: 0 });
  convo.messages.push({ senderId: req.user.id, senderName: req.user.username, message: 'Call initiated', type: 'call_initiation' });
  await convo.save();
  const io = req.app.get('io');
  io && io.to(`user:${convo.clientId}`).emit('incoming_call', {
    orderId, from: req.user.username, callerId: req.user.id, label: 'CALMER Admin - Delivery'
  });
  res.json({ ok: true, message: 'Call ringing on client device' });
});

/* ============ PUBLIC REVIEWS (landing page) ============ */
router.get('/reviews/public', async (req, res) => {
  const reviews = await Order.find({ rating: { $gte: 4 }, review: { $ne: '' } })
    .populate('clientId', 'username').sort({ updatedAt: -1 }).limit(6).lean();
  res.json(reviews.map(r => ({ username: r.clientId?.username || '@calmer_client', rating: r.rating, review: r.review })));
});

/* ============ ADMIN ANALYTICS ============ */
router.get('/analytics', auth, adminOnly, async (req, res) => {
  const [orders, clients, products] = await Promise.all([
    Order.find({ paymentStatus: 'paid' }).lean(),
    User.countDocuments({ role: 'client' }),
    Product.countDocuments()
  ]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayRevenue = orders.filter(o => new Date(o.createdAt) >= today).reduce((s, o) => s + o.totalAmount, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const active = orders.filter(o => ['processing', 'on_the_way'].includes(o.deliveryStatus)).length;
  // best sellers
  const sales = {};
  orders.forEach(o => o.products.forEach(p => {
    sales[p.name] = sales[p.name] || { name: p.name, units: 0, revenue: 0 };
    sales[p.name].units += p.quantity;
    sales[p.name].revenue += p.price * p.quantity;
  }));
  res.json({
    todayRevenue, totalRevenue, activeOrders: active, totalOrders: orders.length,
    totalClients: clients, totalProducts: products,
    bestSellers: Object.values(sales).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  });
});

module.exports = router;
