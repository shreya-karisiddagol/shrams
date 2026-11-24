/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user to req.user
 * Also provides role-based access control helpers
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Middleware: Authenticate JWT token
 * Expects: Authorization: Bearer <token>
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
    }

    // Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    // Fetch fresh user data from DB (ensures deactivated accounts are caught)
    const result = await pool.query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact administrator.' });
    }

    // Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
};

/**
 * Middleware factory: Require specific role(s)
 * Usage: requireRole('warden') or requireRole(['warden', 'admin'])
 * Must be used AFTER authMiddleware
 */
const requireRole = (...roles) => {
  // Flatten in case array is passed: requireRole(['warden','admin']) or requireRole('warden','admin')
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

/**
 * Middleware: Allow access only to the resource owner or admins
 * req.resourceUserId must be set before calling this middleware
 */
const requireOwnerOrAdmin = (req, res, next) => {
  const { user, resourceUserId } = req;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const adminRoles = ['admin', 'super_admin', 'warden'];
  if (user.id === resourceUserId || adminRoles.includes(user.role)) {
    return next();
  }

  return res.status(403).json({ success: false, message: 'Access denied. You can only access your own resources.' });
};

module.exports = { authMiddleware, requireRole, requireOwnerOrAdmin };
