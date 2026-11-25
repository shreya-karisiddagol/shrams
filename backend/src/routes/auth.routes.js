/**
 * Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 * GET  /api/auth/me
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth');

// ─── Validation Rules ─────────────────────────────────────────────────────────

const registerValidation = [
  body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'warden', 'maintenance']).withMessage('Role must be student, warden, or maintenance'),
  body('usn').if((val, { req }) => req.body.role === 'student' || !req.body.role).trim().notEmpty().withMessage('USN is required for student registration'),
  body('phone').optional({ values: 'falsy' }),
  body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']).withMessage('Invalid gender value'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

const changePasswordValidation = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// Register a new user account (student, warden, maintenance)
router.post('/register', registerValidation, authController.register);

// Login and get JWT
router.post('/login', loginValidation, authController.login);

// Request password reset token
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

// Reset password using token
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

// Change password for logged-in user
router.put('/change-password', authMiddleware, changePasswordValidation, authController.changePassword);

// Get currently logged-in user (protected)
router.get('/me', authMiddleware, authController.getMe);

// Public list of hostels for registration forms
router.get('/hostels', authController.getPublicHostels);

module.exports = router;
