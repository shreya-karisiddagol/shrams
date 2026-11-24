/**
 * User Model
 * Query helpers for the users table
 */

const pool = require('../config/db');

const UserModel = {
  /**
   * Find a user by ID
   */
  findById: async (id) => {
    const result = await pool.query(
      'SELECT id, full_name, email, role, phone, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Find a user by email (includes password_hash for auth)
   */
  findByEmail: async (email) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  /**
   * Update user fields
   */
  updateById: async (id, fields) => {
    const setClause = Object.keys(fields)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...Object.values(fields)];
    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING id, full_name, email, role, phone`,
      values
    );
    return result.rows[0] || null;
  },

  /**
   * Get all users by role with pagination
   */
  findByRole: async (role, limit, offset) => {
    const result = await pool.query(
      `SELECT id, full_name, email, role, phone, is_active, created_at
       FROM users WHERE role = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [role, limit, offset]
    );
    return result.rows;
  },

  /**
   * Count users by role
   */
  countByRole: async (role) => {
    const result = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', [role]);
    return parseInt(result.rows[0].count, 10);
  },
};

module.exports = UserModel;
