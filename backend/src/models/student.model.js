/**
 * Student Model
 * Query helpers for student_profiles table
 */

const pool = require('../config/db');

const StudentModel = {
  /**
   * Find full student profile by user_id (joins users + student_profiles)
   */
  findByUserId: async (userId) => {
    const result = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.role, u.phone, u.is_active,
         sp.id AS profile_id, sp.usn, sp.department, sp.semester, sp.gender,
         sp.date_of_birth, sp.address, sp.parent_name, sp.parent_phone,
         sp.parent_email, sp.emergency_contact, sp.blood_group, sp.profile_photo,
         sp.created_at, sp.updated_at
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  /**
   * Update student profile fields
   */
  updateProfile: async (userId, fields) => {
    const allowedFields = [
      'department', 'semester', 'gender', 'date_of_birth', 'address',
      'parent_name', 'parent_phone', 'parent_email', 'emergency_contact',
      'blood_group', 'profile_photo',
    ];

    const updates = [];
    const values = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updates.push(`${field} = $${idx++}`);
        values.push(fields[field]);
      }
    }

    if (updates.length === 0) return null;

    values.push(userId);
    const result = await pool.query(
      `UPDATE student_profiles SET ${updates.join(', ')}, updated_at = NOW()
       WHERE user_id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  /**
   * Get all students (paginated) with their profiles
   */
  findAll: async (limit, offset, search = '') => {
    const searchParam = `%${search}%`;
    const result = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.phone, u.is_active,
         sp.usn, sp.department, sp.semester, sp.gender, sp.profile_photo
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'student'
         AND (u.full_name ILIKE $1 OR u.email ILIKE $1 OR sp.usn ILIKE $1 OR sp.department ILIKE $1)
       ORDER BY u.created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchParam, limit, offset]
    );
    return result.rows;
  },

  /**
   * Count total students (optional search)
   */
  count: async (search = '') => {
    const searchParam = `%${search}%`;
    const result = await pool.query(
      `SELECT COUNT(*) FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'student'
         AND (u.full_name ILIKE $1 OR u.email ILIKE $1 OR sp.usn ILIKE $1 OR sp.department ILIKE $1)`,
      [searchParam]
    );
    return parseInt(result.rows[0].count, 10);
  },
};

module.exports = StudentModel;
