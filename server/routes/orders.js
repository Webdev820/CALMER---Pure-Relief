const express = require('express');
const { Order, Product, Notification, Conversation, User } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders  { products: [{productId, quantity}], deliveryAddress, liveLocation? }
router.post('/', auth, async (req, res) => {
  try {
    const { products = [], deliveryAddress = {}, liveLocation } = req.body;
    if (!Array.isArray(products) || !products.length) return res.status(400).json({ error: 'No products in order' });
    if (products.length > 50) return res.status(400).json({ error: 'Too many items in one order' });
    if (!deliveryAddress.street || !deliveryAddress.city)
      return res.status(400).json({ error: 'Street and city are required' });

    // Merge duplicate lines (same product added twice) before stock checks
    const wanted = new Map();
    for (const it of products) {
      const qty = Math.min(99, Math.max(1, Math.floor(Number(it.quantity) || 1)));
      wanted.set(String(it.productId), (wanted.get(String(it.productId)) || 0) + qty);
    }

    let total = 0;
    const items = [];
    const decremented = []; // for rollback if a later item fails
    for (const [productId, qty] of wanted) {
      // ATOMIC stock decrement — prevents overselling under concurrent checkouts.
      const p = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );
      if (!p) {
        // Roll back any stock we already took
        await Promise.all(decremented.map(d => Product.updateOne({ _id: d.id }, { $inc: { stock: d.qty } })));
        const exists = await Product.findById(productId).select('name stock').lean().catch(() => null);
        return res.status(exists ? 409 : 400).json({
          error: exists ? `Not enough stock for ${exists.name} (only ${exists.stock} left)` : 'Product not found'
        });
      }
      decremented.push({ id: p._id, qty });
      total += p.price * qty;
      items.push({ productId: p._id, name: p.name, quantity: qty, price: p.price });
    }

    // Validate pinned coordinates if provided
    let live = { pinned: false };
    if (liveLocation && liveLocation.latitude != null && liveLocation.longitude != null) {
      const lat = Number(liveLocation.latitude), lng = Number(liveLocation.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180)
        live = { latitude: lat, longitude: lng, pinned: true, timestamp: new Date() };
    }

    const deliveryFee = 10;
    // Retry on the (rare but real) random order-number collision instead of 500ing
    let order, attempts = 0;
    while (!order && attempts < 5) {
      try {
        order = await Order.create({
          clientId: req.user.id,
          products: items,
          totalAmount: Math.round((total + deliveryFee) * 100) / 100,
          deliveryFee,
          deliveryAddress: {
            street: String(deliveryAddress.street).slice(0, 200),
            city: String(deliveryAddress.city).slice(0, 100),
            landmark: String(deliveryAddress.landmark || '').slice(0, 200),
            notes: String(deliveryAddress.notes || '').slice(0, 300)
          },
          liveLocation: live
        });
      } catch (err) {
        if (err.code === 11000) { attempts++; continue; } // duplicate orderNumber → regenerate
        throw err;
      }
    }
    if (!order) throw new Error('order number collision');
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
    if (!['pending', 'processing', 'on_the_way', 'delivered'].includes(deliveryStatus))
      return res.status(400).json({ error: 'Invalid status' });
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
    const latitude = Number(req.body.latitude), longitude = Number(req.body.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180)
      return res.status(400).json({ error: 'Valid latitude and longitude required' });
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
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (String(order.clientId) !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    if (order.deliveryStatus !== 'delivered') return res.status(400).json({ error: 'Order not yet delivered' });
    order.rating = r; order.review = String(review).slice(0, 1000);
    await order.save();
    res.json(order);
  } catch { res.status(400).json({ error: 'Review failed' }); }
});

// GET /api/orders/reviews/public — top reviews for landing page (no auth)
module.exports = router;
