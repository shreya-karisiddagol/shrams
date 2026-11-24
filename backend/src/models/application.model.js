/**
 * Application Model
 * Query helpers for hostel_applications table
 */

const pool = require('../config/db');

const ApplicationModel = {
  /**
   * Find all applications for a student
   */
  findByStudentId: async (studentId, limit, offset) => {
    const result = await pool.query(
      `SELECT
         ha.*,
         h.name AS hostel_name, h.type AS hostel_type,
         b.block_name AS preferred_block_name,
         u.full_name AS reviewed_by_name
       FROM hostel_applications ha
       LEFT JOIN hostels h ON h.id = ha.preferred_hostel_id
       LEFT JOIN blocks b ON b.id = ha.preferred_block_id
       LEFT JOIN users u ON u.id = ha.reviewed_by
       WHERE ha.student_id = $1
       ORDER BY ha.created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );
    return result.rows;
  },

  /**
   * Count applications for a student
   */
  countByStudentId: async (studentId) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM hostel_applications WHERE student_id = $1',
      [studentId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Find a single application by ID
   */
  findById: async (id) => {
    const result = await pool.query(
      `SELECT
         ha.*,
         h.name AS hostel_name, h.type AS hostel_type,
         b.block_name AS preferred_block_name,
         u.full_name AS reviewed_by_name,
         su.full_name AS student_name, su.email AS student_email,
         sp.usn, sp.department, sp.semester, sp.gender
       FROM hostel_applications ha
       LEFT JOIN hostels h ON h.id = ha.preferred_hostel_id
       LEFT JOIN blocks b ON b.id = ha.preferred_block_id
       LEFT JOIN users u ON u.id = ha.reviewed_by
       JOIN users su ON su.id = ha.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = ha.student_id
       WHERE ha.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Get applications for warden review (by hostel)
   */
  findByHostelId: async (hostelId, status, limit, offset) => {
    let query = `
      SELECT
        ha.*,
        su.full_name AS student_name, su.email AS student_email,
        sp.usn, sp.department, sp.gender,
        h.name AS hostel_name,
        b.block_name AS preferred_block_name
      FROM hostel_applications ha
      JOIN users su ON su.id = ha.student_id
      LEFT JOIN student_profiles sp ON sp.user_id = ha.student_id
      LEFT JOIN hostels h ON h.id = ha.preferred_hostel_id
      LEFT JOIN blocks b ON b.id = ha.preferred_block_id
      WHERE ha.preferred_hostel_id = $1
    `;
    const values = [hostelId];
    let idx = 2;

    if (status) {
      query += ` AND ha.status = $${idx++}`;
      values.push(status);
    }

    query += ` ORDER BY ha.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  /**
   * Count applications for a hostel
   */
  countByHostelId: async (hostelId, status) => {
    let query = 'SELECT COUNT(*) FROM hostel_applications WHERE preferred_hostel_id = $1';
    const values = [hostelId];
    if (status) {
      query += ' AND status = $2';
      values.push(status);
    }
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Get all approved applications not yet allocated (for auto-allocation)
   */
  findApprovedUnallocated: async (hostelId) => {
    const result = await pool.query(
      `SELECT ha.*
       FROM hostel_applications ha
       WHERE ha.preferred_hostel_id = $1
         AND ha.status = 'approved'
         AND ha.student_id NOT IN (
           SELECT a.student_id FROM allocations a WHERE a.status = 'active'
         )
       ORDER BY ha.created_at ASC`,
      [hostelId]
    );
    return result.rows;
  },

  /**
   * Create a new application
   */
  create: async (data) => {
    const result = await pool.query(
      `INSERT INTO hostel_applications
         (student_id, preferred_hostel_id, preferred_room_type, preferred_block_id, reason, academic_year, semester)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.student_id, data.preferred_hostel_id, data.preferred_room_type || null,
        data.preferred_block_id || null, data.reason || null,
        data.academic_year, data.semester || null,
      ]
    );
    return result.rows[0];
  },

  /**
   * Update application status (review)
   */
  review: async (id, reviewedBy, status, reviewNotes) => {
    const result = await pool.query(
      `UPDATE hostel_applications
       SET status = $1, reviewed_by = $2, review_notes = $3, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, reviewedBy, reviewNotes || null, id]
    );
    return result.rows[0] || null;
  },
};

module.exports = ApplicationModel;
