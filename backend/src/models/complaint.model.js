/**
 * Complaint Model
 * Query helpers for the complaints table
 */

const pool = require('../config/db');

const ComplaintModel = {
  /**
   * Find complaints for a student (paginated)
   */
  findByStudentId: async (studentId, limit, offset, status = null) => {
    let query = `
      SELECT
        c.*,
        r.room_number,
        u.full_name AS assigned_to_name
      FROM complaints c
      LEFT JOIN rooms r ON r.id = c.room_id
      LEFT JOIN users u ON u.id = c.assigned_to
      WHERE c.student_id = $1
    `;
    const values = [studentId];
    let idx = 2;

    if (status) {
      query += ` AND c.status = $${idx++}`;
      values.push(status);
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  /**
   * Count complaints for a student
   */
  countByStudentId: async (studentId, status = null) => {
    let query = 'SELECT COUNT(*) FROM complaints WHERE student_id = $1';
    const values = [studentId];
    if (status) {
      query += ' AND status = $2';
      values.push(status);
    }
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Find a complaint by ID with full details
   */
  findById: async (id) => {
    const result = await pool.query(
      `SELECT
         c.*,
         r.room_number,
         u.full_name AS student_name, u.email AS student_email,
         sp.usn,
         ms.full_name AS assigned_to_name, ms.email AS assigned_to_email
       FROM complaints c
       JOIN users u ON u.id = c.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = c.student_id
       LEFT JOIN rooms r ON r.id = c.room_id
       LEFT JOIN users ms ON ms.id = c.assigned_to
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Find complaints for a hostel (warden view) with filters
   */
  findByHostelId: async (hostelId, { status, priority, category }, limit, offset) => {
    let query = `
      SELECT
        c.*,
        r.room_number,
        b.block_name,
        u.full_name AS student_name, sp.usn,
        ms.full_name AS assigned_to_name
      FROM complaints c
      JOIN rooms r ON r.id = c.room_id
      JOIN blocks b ON b.id = r.block_id
      JOIN users u ON u.id = c.student_id
      LEFT JOIN student_profiles sp ON sp.user_id = c.student_id
      LEFT JOIN users ms ON ms.id = c.assigned_to
      WHERE b.hostel_id = $1
    `;
    const values = [hostelId];
    let idx = 2;

    if (status) { query += ` AND c.status = $${idx++}`; values.push(status); }
    if (priority) { query += ` AND c.priority = $${idx++}`; values.push(priority); }
    if (category) { query += ` AND c.category = $${idx++}`; values.push(category); }

    query += ` ORDER BY c.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  },

  /**
   * Count complaints for a hostel
   */
  countByHostelId: async (hostelId, { status, priority, category }) => {
    let query = `
      SELECT COUNT(*) FROM complaints c
      JOIN rooms r ON r.id = c.room_id
      JOIN blocks b ON b.id = r.block_id
      WHERE b.hostel_id = $1
    `;
    const values = [hostelId];
    let idx = 2;

    if (status) { query += ` AND c.status = $${idx++}`; values.push(status); }
    if (priority) { query += ` AND c.priority = $${idx++}`; values.push(priority); }
    if (category) { query += ` AND c.category = $${idx++}`; values.push(category); }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Create a new complaint
   */
  create: async (data) => {
    const result = await pool.query(
      `INSERT INTO complaints (student_id, room_id, category, title, description, priority, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.student_id, data.room_id, data.category, data.title, data.description || null, data.priority || 'medium', data.images || null]
    );
    return result.rows[0];
  },

  /**
   * Update complaint status and optionally assign staff
   */
  updateStatus: async (id, status, extra = {}) => {
    const result = await pool.query(
      `UPDATE complaints
       SET status = $1,
           assigned_to = COALESCE($2, assigned_to),
           assigned_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE assigned_at END,
           resolved_at = CASE WHEN $1 = 'resolved' THEN NOW() ELSE resolved_at END,
           work_notes = COALESCE($3, work_notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, extra.assignedTo || null, extra.workNotes || null, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Submit feedback rating and comment for a resolved complaint
   */
  submitFeedback: async (id, rating, comment) => {
    const result = await pool.query(
      `UPDATE complaints
       SET feedback_rating = $1, feedback_comment = $2, status = 'closed', updated_at = NOW()
       WHERE id = $3 AND status IN ('resolved','closed')
       RETURNING *`,
      [rating, comment || null, id]
    );
    return result.rows[0] || null;
  },
};

module.exports = ComplaintModel;
