const express = require('express');
const { Order, Product, Notification, Conversation, User } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders  { products: [{productId, quantity}], deliveryAddress, liveLocation? }
router.post('/', auth, async (req, res) => {
  try {
    const { products = [], deliveryAddress = {}, liveLocation } = req.body;
    if (!products.length) return res.status(400).json({ error: 'No products in order' });

    let total = 0;
    const items = [];
    for (const it of products) {
      const p = await Product.findById(it.productId).lean();
      if (!p) return res.status(400).json({ error: 'Product not found' });
      const qty = Math.max(1, Number(it.quantity) || 1);
      total += p.price * qty;
      items.push({ productId: p._id, name: p.name, quantity: qty, price: p.price });
    }
    const deliveryFee = 10;
    const order = await Order.create({
      clientId: req.user.id,
      products: items,
      totalAmount: total + deliveryFee,
      deliveryFee,
      deliveryAddress,
      liveLocation: liveLocation ? { ...liveLocation, pinned: true, timestamp: new Date() } : { pinned: false }
    });
    res.status(201).json(order);
  } catch (e) { res.status(500).json({ error: 'Could not create order' }); }
});

// GET /api/orders  (admin: all, client: own)
router.get('/', auth, async (req, res) => {
  const q = req.user.role === 'admin' ? {} : { clientId: req.user.id };
  if (req.query.status) q.deliveryStatus = req.query.status;
  const orders = await Order.find(q).populate('clientId', 'username phone email').sort({ createdAt: -1 }).lean();
  res.json(orders);
});

router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('clientId', 'username phone email').lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role !== 'admin' && String(order.clientId._id) !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });
    res.json(order);
  } catch { res.status(400).json({ error: 'Invalid order id' }); }
});

// PUT /api/orders/:id/status  (admin)
router.put('/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { deliveryStatus } = req.body;
    const update = { deliveryStatus };
    if (deliveryStatus === 'delivered') update.actualDeliveryTime = new Date();
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const msgs = {
      processing: 'Your order is being prepared with care.',
      on_the_way: `Your order is on the way! Estimated delivery: ${order.estimatedDeliveryTime}.`,
      delivered: 'Order delivered! Enjoy your CALMER experience. Breathe, Unwind, Elevate.'
    };
    const message = msgs[deliveryStatus] || `Order status: ${deliveryStatus}`;
    await Notification.create({
      recipientId: order.clientId, type: 'order_update',
      title: `Order ${order.orderNumber}`, message
    });
    const io = req.app.get('io');
    io && io.to(`user:${order.clientId}`).emit('order_update', {
      orderId: order._id, orderNumber: order.orderNumber, deliveryStatus, message
    });
    res.json(order);
  } catch { res.status(400).json({ error: 'Status update failed' }); }
});

// PUT /api/orders/:id/location  (client pins live location)
router.put('/:id/location', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) return res.status(400).json({ error: 'latitude and longitude required' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (req.user.role !== 'admin' && String(order.clientId) !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    order.liveLocation = { latitude, longitude, pinned: true, timestamp: new Date() };
    await order.save();

    const io = req.app.get('io');
    io && io.to('admins').emit('location_pinned', {
      orderId: order._id, orderNumber: order.orderNumber, latitude, longitude
    });
    await Notification.create({
      recipientId: null, broadcast: false, type: 'order_update',
      title: 'Location Pinned', message: `Client pinned location for order ${order.orderNumber}`,
      meta: { forAdmin: true, orderId: order._id }
    });
    res.json(order);
  } catch { res.status(400).json({ error: 'Location update failed' }); }
});

// PUT /api/orders/:id/review  (client rates delivered order)
router.put('/:id/review', auth, async (req, res) => {
  try {
    const { rating, review = '' } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (String(order.clientId) !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (order.deliveryStatus !== 'delivered') return res.status(400).json({ error: 'Order not yet delivered' });
    order.rating = rating; order.review = review;
    await order.save();
    res.json(order);
  } catch { res.status(400).json({ error: 'Review failed' }); }
});

// GET /api/orders/reviews/public — top reviews for landing page (no auth)
module.exports = router;
