const express = require('express');
const { Product, Notification, User } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/products?category=&featured=&newArrival=&search=
router.get('/', async (req, res) => {
  const { category, featured, newArrival, search } = req.query;
  const q = {};
  if (category && category !== 'All') q.category = category;
  if (featured === 'true') q.featured = true;
  if (newArrival === 'true') q.isNewArrival = true;
  if (search) q.name = { $regex: search, $options: 'i' };
  const products = await Product.find(q).sort({ createdAt: -1 }).lean();
  res.json(products);
});

router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch { res.status(400).json({ error: 'Invalid product id' }); }
});

// POST /api/products (admin)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    if (product.isNewArrival) {
      await Notification.create({
        broadcast: true,
        type: 'new_arrival',
        title: 'New Arrival',
        message: `New arrival: ${product.name} is now available!`,
        meta: { productId: product._id }
      });
      const io = req.app.get('io');
      io && io.to('clients').emit('notification', {
        type: 'new_arrival',
        title: 'New Arrival',
        message: `New arrival: ${product.name} is now available!`
      });
    }
    res.status(201).json(product);
  } catch (e) { res.status(400).json({ error: 'Could not create product' }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ error: 'Product not found' });
    res.json(p);
  } catch { res.status(400).json({ error: 'Update failed' }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch { res.status(400).json({ error: 'Delete failed' }); }
});

module.exports = router;
