// Demo Auth Route – issues a JWT for the seeded staff accounts.
// In production this endpoint lives in the shared auth service.
const express  = require('express');
const jwt      = require('jsonwebtoken');
const router   = express.Router();
const pool     = require('../db/pool');
require('dotenv').config();

/**
 * POST /api/auth/login
 * Body: { email, password }
 * For demo purposes password is always accepted (no real password stored here).
 */
router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM maintenance_staff WHERE email = ? AND is_active = 1', [email]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'No active staff account found with that email.' });
    }
    const staff = rows[0];

    const payload = {
      id:       staff.user_id,
      staffId:  staff.id,
      name:     staff.full_name,
      email:    staff.email,
      role:     'maintenance_staff',
      category: staff.category,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

    res.json({ success: true, token, user: payload });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
