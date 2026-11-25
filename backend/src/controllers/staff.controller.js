/**
 * Maintenance Staff Controller
 * Implements task tracking and complaint resolution for Maintenance Staff
 */

const pool = require('../config/db');
const { getPagination, paginatedResponse, sendSuccess, sendError, isValidUUID } = require('../utils/helpers');
const { notify } = require('../utils/notifications');

/**
 * GET /api/staff/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userRes = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role,
              msp.employee_id, msp.category, msp.is_available,
              b.block_name AS assigned_block, h.name AS hostel_name
       FROM users u
       LEFT JOIN maintenance_staff_profiles msp ON msp.user_id = u.id
       LEFT JOIN blocks b ON b.id = msp.assigned_block_id
       LEFT JOIN hostels h ON h.id = b.hostel_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) return sendError(res, 'Staff member not found.', 404);
    sendSuccess(res, userRes.rows[0], 'Profile fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/staff/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { phone, is_available } = req.body;
    if (phone) {
      await pool.query('UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2', [phone, req.user.id]);
    }
    if (is_available !== undefined) {
      await pool.query(
        `INSERT INTO maintenance_staff_profiles (user_id, is_available)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET is_available = $2`,
        [req.user.id, is_available]
      );
    }
    sendSuccess(res, null, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/staff/workload-stats
 */
exports.getWorkloadStats = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') AS total_pending,
         COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
         COUNT(*) FILTER (WHERE status = 'on_hold') AS on_hold,
         COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) AS total_resolved,
         COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('resolved', 'closed')) AS critical_pending
       FROM complaints
       WHERE assigned_to = $1`,
      [req.user.id]
    );

    const row = result.rows[0] || {};
    sendSuccess(res, {
      total_pending: parseInt(row.total_pending || 0, 10),
      in_progress: parseInt(row.in_progress || 0, 10),
      on_hold: parseInt(row.on_hold || 0, 10),
      total_resolved: parseInt(row.total_resolved || 0, 10),
      critical_pending: parseInt(row.critical_pending || 0, 10),
    }, 'Workload stats fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/staff/tasks
 */
exports.getAssignedTasks = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query, 12);
    const { status, priority } = req.query;

    let query = `
      SELECT c.id, c.title, c.description, c.category, c.priority, c.status,
             c.images, c.created_at, c.updated_at, c.assigned_at, c.resolved_at,
             r.room_number, b.block_name, h.name AS hostel_name,
             u.full_name AS student_name, sp.usn
      FROM complaints c
      JOIN rooms r ON r.id = c.room_id
      JOIN blocks b ON b.id = r.block_id
      JOIN hostels h ON h.id = b.hostel_id
      JOIN users u ON u.id = c.student_id
      LEFT JOIN student_profiles sp ON sp.user_id = c.student_id
      WHERE c.assigned_to = $1
    `;
    const values = [req.user.id];
    let idx = 2;

    if (status) {
      query += ` AND c.status = $${idx++}`;
      values.push(status.toLowerCase());
    }
    if (priority) {
      query += ` AND c.priority = $${idx++}`;
      values.push(priority.toLowerCase());
    }

    query += ` ORDER BY
      CASE c.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      c.created_at DESC
      LIMIT $${idx++} OFFSET $${idx}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    let countQuery = `SELECT COUNT(*) FROM complaints WHERE assigned_to = $1`;
    const countValues = [req.user.id];
    let cIdx = 2;
    if (status) {
      countQuery += ` AND status = $${cIdx++}`;
      countValues.push(status.toLowerCase());
    }
    if (priority) {
      countQuery += ` AND priority = $${cIdx++}`;
      countValues.push(priority.toLowerCase());
    }
    const countRes = await pool.query(countQuery, countValues);

    const total = parseInt(countRes.rows[0]?.count || 0, 10);
    sendSuccess(res, {
      tasks: result.rows,
      data: result.rows,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
      total,
    }, 'Assigned tasks fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/staff/tasks/:id
 */
exports.getTaskDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, 'Invalid task ID.', 400);

    const result = await pool.query(
      `SELECT c.*,
              r.room_number, r.floor, b.block_name, h.name AS hostel_name,
              u.full_name AS student_name, u.phone AS student_phone, sp.usn
       FROM complaints c
       JOIN rooms r ON r.id = c.room_id
       JOIN blocks b ON b.id = r.block_id
       JOIN hostels h ON h.id = b.hostel_id
       JOIN users u ON u.id = c.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = c.student_id
       WHERE c.id = $1 AND c.assigned_to = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) return sendError(res, 'Task not found or not assigned to you.', 404);
    sendSuccess(res, result.rows[0], 'Task details fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/staff/tasks/:id/status
 * Body: { status: 'acknowledged'|'in_progress'|'on_hold'|'resolved', note: '...' }
 */
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!isValidUUID(id)) return sendError(res, 'Invalid task ID.', 400);

    const cleanStatus = status?.toLowerCase().replace(/\s+/g, '_');
    const validStatuses = ['acknowledged', 'in_progress', 'on_hold', 'resolved'];
    if (!validStatuses.includes(cleanStatus)) {
      return sendError(res, `Invalid status. Allowed: ${validStatuses.join(', ')}`, 400);
    }

    if (cleanStatus === 'on_hold' && !note?.trim()) {
      return sendError(res, 'A note is required when putting a task on hold.', 400);
    }

    const check = await pool.query('SELECT status, work_notes, student_id FROM complaints WHERE id = $1 AND assigned_to = $2', [id, req.user.id]);
    if (check.rows.length === 0) return sendError(res, 'Task not found.', 404);

    const prevNotes = check.rows[0].work_notes ? `${check.rows[0].work_notes}\n` : '';
    const newNote = note?.trim() ? `[${new Date().toLocaleString()}] Status changed to ${cleanStatus}: ${note.trim()}` : `[${new Date().toLocaleString()}] Status changed to ${cleanStatus}`;
    const updatedNotes = prevNotes + newNote;

    const isResolved = cleanStatus === 'resolved';

    await pool.query(
      `UPDATE complaints
       SET status = $1,
           work_notes = $2,
           resolved_at = CASE WHEN $3 = true THEN NOW() ELSE resolved_at END,
           updated_at = NOW()
       WHERE id = $4`,
      [cleanStatus, updatedNotes, isResolved, id]
    );

    if (isResolved && check.rows[0].student_id) {
      await notify.complaintResolved(check.rows[0].student_id, id);
    }

    sendSuccess(res, null, `Task status updated to ${cleanStatus}`);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/staff/tasks/:id/notes
 * Body: { note: '...' }
 */
exports.addWorkNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!isValidUUID(id)) return sendError(res, 'Invalid task ID.', 400);
    if (!note?.trim()) return sendError(res, 'Note cannot be empty.', 400);

    const check = await pool.query('SELECT work_notes FROM complaints WHERE id = $1 AND assigned_to = $2', [id, req.user.id]);
    if (check.rows.length === 0) return sendError(res, 'Task not found.', 404);

    const prevNotes = check.rows[0].work_notes ? `${check.rows[0].work_notes}\n` : '';
    const updatedNotes = `${prevNotes}[${new Date().toLocaleString()}] ${note.trim()}`;

    await pool.query('UPDATE complaints SET work_notes = $1, updated_at = NOW() WHERE id = $2', [updatedNotes, id]);
    sendSuccess(res, null, 'Work note added successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/staff/tasks/history
 */
exports.getTaskHistory = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query, 20);

    const result = await pool.query(
      `SELECT c.id, c.title, c.category, c.priority, c.status,
              c.resolved_at, c.created_at, c.feedback_rating,
              r.room_number, b.block_name, h.name AS hostel_name,
              u.full_name AS student_name
       FROM complaints c
       JOIN rooms r ON r.id = c.room_id
       JOIN blocks b ON b.id = r.block_id
       JOIN hostels h ON h.id = b.hostel_id
       JOIN users u ON u.id = c.student_id
       WHERE c.assigned_to = $1 AND c.status IN ('resolved', 'closed')
       ORDER BY c.resolved_at DESC NULLS LAST
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM complaints WHERE assigned_to = $1 AND status IN ('resolved', 'closed')`,
      [req.user.id]
    );

    const total = parseInt(countRes.rows[0]?.count || 0, 10);
    sendSuccess(res, {
      history: result.rows,
      data: result.rows,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
      total,
    }, 'Task history fetched');
  } catch (error) {
    next(error);
  }
};
