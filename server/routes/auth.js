const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const { signToken } = require('../middleware/auth');

const router = express.Router();

function segment() {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

// POST /api/auth/generate-passkey  { role }
router.post('/generate-passkey', (req, res) => {
  const { role } = req.body || {};
  const passkey = role === 'admin'
    ? `CALMER-ADMIN-${segment()}-${segment()}-${segment()}`
    : `CALMER-${segment()}-${segment()}-${segment()}`;
  res.json({ passkey });
});

// POST /api/auth/register  { username, passkey, email, phone }
router.post('/register', async (req, res) => {
  try {
    const { username, passkey, email = '', phone = '' } = req.body || {};
    if (!username || !passkey) return res.status(400).json({ error: 'Username and CALMER PASSKEY are required' });

    const uname = String(username).trim().toLowerCase();
    const isAdmin = uname.startsWith('@admin-');
    if (!uname.startsWith('@')) return res.status(400).json({ error: 'Username must start with @' });
    if (!/^@[a-z0-9_\-]{3,30}$/.test(uname)) return res.status(400).json({ error: 'Username: 3-30 chars, letters/numbers/underscores after @' });

    if (isAdmin) {
      if (!passkey.startsWith('CALMER-ADMIN-')) return res.status(400).json({ error: 'Admin accounts require a CALMER-ADMIN passkey' });
      if (!email || !phone) return res.status(400).json({ error: 'Email and phone are required for admin accounts' });
    } else if (!passkey.startsWith('CALMER-')) {
      return res.status(400).json({ error: 'Invalid CALMER PASSKEY format' });
    }

    const exists = await User.findOne({ username: uname }).lean();
    if (exists) return res.status(409).json({ error: 'Username already taken' });

    const hashed = await bcrypt.hash(passkey, 10);
    const user = await User.create({
      username: uname,
      passkey: hashed,
      role: isAdmin ? 'admin' : 'client',
      email, phone
    });

    res.status(201).json({ message: 'Account created', username: user.username, role: user.role });
  } catch (e) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login  { username, passkey }
router.post('/login', async (req, res) => {
  try {
    const { username, passkey } = req.body || {};
    if (!username || !passkey) return res.status(400).json({ error: 'Username and CALMER PASSKEY are required' });

    const user = await User.findOne({ username: String(username).trim().toLowerCase() });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(passkey, user.passkey);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role, email: user.email, phone: user.phone }
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
