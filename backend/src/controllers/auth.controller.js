/**
 * Auth Controller
 * Handles: register, login, forgotPassword, resetPassword, getMe
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { sendSuccess, sendError, formatValidationErrors, sanitizeUser, generateToken } = require('../utils/helpers');

/**
 * Generate a signed JWT for the given user
 */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Creates a new student user + student_profile row
 */
exports.register = async (req, res, next) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 422, formatValidationErrors(errors.array()));
    }

    const {
      full_name, email, password, phone, role = 'student',
      // Student specific fields
      usn, department, semester, gender,
      date_of_birth, address, parent_name, parent_phone, parent_email,
      emergency_contact, blood_group,
      // Warden specific fields
      employee_id, hostel_id,
    } = req.body;

    // Check if email already exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return sendError(res, 'An account with this email already exists.', 409);
    }

    if (role === 'student') {
      if (!usn) return sendError(res, 'USN is required for student registration.', 422);
      const usnCheck = await pool.query('SELECT id FROM student_profiles WHERE usn = $1', [usn]);
      if (usnCheck.rows.length > 0) {
        return sendError(res, 'An account with this USN already exists.', 409);
      }
    } else if (role === 'warden' && employee_id) {
      const empCheck = await pool.query('SELECT id FROM warden_profiles WHERE employee_id = $1', [employee_id]);
      if (empCheck.rows.length > 0) {
        return sendError(res, 'An account with this Employee ID already exists.', 409);
      }
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert into users table
      const userResult = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, phone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, full_name, email, role, phone, is_active, created_at`,
        [full_name, email, password_hash, role, phone || null]
      );
      const newUser = userResult.rows[0];

      if (role === 'warden') {
        // Insert into warden_profiles
        await client.query(
          `INSERT INTO warden_profiles (user_id, employee_id, department, hostel_id)
           VALUES ($1, $2, $3, $4)`,
          [newUser.id, employee_id ? employee_id.toUpperCase() : null, department || null, hostel_id || null]
        );
      } else {
        // Insert into student_profiles table
        await client.query(
          `INSERT INTO student_profiles
             (user_id, usn, department, semester, gender, date_of_birth,
              address, parent_name, parent_phone, parent_email, emergency_contact, blood_group)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            newUser.id, usn.toUpperCase(), department || null, semester || null,
            gender || null, date_of_birth || null, address || null,
            parent_name || null, parent_phone || null, parent_email || null,
            emergency_contact || null, blood_group || null,
          ]
        );
      }

      await client.query('COMMIT');

      const token = signToken(newUser);
      return sendSuccess(res, { user: sanitizeUser(newUser), token }, `${role === 'warden' ? 'Warden' : 'Student'} account created successfully`, 201);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Validates credentials and returns a JWT
 */
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 422, formatValidationErrors(errors.array()));
    }

    const { email, password } = req.body;

    // Fetch user with password hash
    const result = await pool.query(
      'SELECT id, full_name, email, password_hash, role, phone, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return sendError(res, 'Your account has been deactivated. Contact the administrator.', 403);
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;

    return sendSuccess(res, { user: safeUser, token }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
/**
 * POST /api/auth/forgot-password
 * Generates a reset token and stores it (email sending is a stub — integrate SMTP/SendGrid as needed)
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 422, formatValidationErrors(errors.array()));
    }

    const { email } = req.body;

    const result = await pool.query('SELECT id, full_name, email FROM users WHERE email = $1', [email]);

    // Always return 200 to prevent user enumeration
    if (result.rows.length === 0) {
      return sendSuccess(res, null, 'If an account exists with this email, a reset link has been sent.');
    }

    const user = result.rows[0];

    // Generate reset token and set 1-hour expiry
    const resetToken = generateToken(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expiresAt, user.id]
    );

    // TODO: Send email with reset link: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);

    return sendSuccess(res, { resetToken }, 'Password reset token generated. Check your email.');
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
/**
 * POST /api/auth/reset-password
 * Verifies reset token and updates the password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 'Validation failed', 422, formatValidationErrors(errors.array()));
    }

    const { token, password } = req.body;

    // Find user with matching valid (non-expired) token
    const result = await pool.query(
      `SELECT id FROM users
       WHERE reset_token = $1 AND reset_token_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Invalid or expired reset token.', 400);
    }

    const userId = result.rows[0].id;

    // Hash new password
    const password_hash = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users
       SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
       WHERE id = $2`,
      [password_hash, userId]
    );

    return sendSuccess(res, null, 'Password has been reset successfully. Please login with your new password.');
  } catch (error) {
    next(error);
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
/**
 * GET /api/auth/me
 * Returns the authenticated user's profile data
 */
exports.getMe = async (req, res, next) => {
  try {
    // Fetch full user + student profile if applicable
    const result = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.role, u.phone, u.is_active, u.created_at,
         sp.usn, sp.department, sp.semester, sp.gender, sp.date_of_birth,
         sp.address, sp.parent_name, sp.parent_phone, sp.parent_email,
         sp.emergency_contact, sp.blood_group, sp.profile_photo
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'User not found.', 404);
    }

    return sendSuccess(res, result.rows[0], 'User profile fetched');
  } catch (error) {
    next(error);
  }
};
