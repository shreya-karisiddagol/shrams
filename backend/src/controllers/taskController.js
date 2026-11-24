const pool = require('../db/pool');
const { v4: uuidv4 } = require('../db/uuid');

// ── GET /api/staff/tasks ──────────────────────────────────────────────────────
const getAssignedTasks = async (req, res) => {
  try {
    const { rows: staffRows } = await pool.query(
      'SELECT id FROM maintenance_staff WHERE user_id = ?', [req.user.id]
    );
    if (!staffRows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    const staffId = staffRows[0].id;

    const { status, priority, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [staffId];
    let where = 'ca.staff_id = ? AND ca.is_active = 1';

    if (status)   { where += ' AND c.status = ?';   params.push(status);   }
    if (priority) { where += ' AND c.priority = ?';  params.push(priority); }

    const { rows } = await pool.query(`
      SELECT c.id, c.title, c.description, c.priority, c.status,
             c.images, c.block, c.floor, c.submitted_at, c.updated_at,
             ca.assigned_at, ca.deadline, ca.id AS assignment_id,
             cc.name AS category, c.room_id, c.hostel_id
      FROM complaint_assignments ca
      JOIN complaints c   ON c.id = ca.complaint_id
      JOIN complaint_categories cc ON cc.id = c.category_id
      WHERE ${where}
      ORDER BY
        CASE c.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        ca.assigned_at DESC
      LIMIT ? OFFSET ?`, [...params, parseInt(limit), offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM complaint_assignments ca
       JOIN complaints c ON c.id = ca.complaint_id WHERE ${where}`,
      params
    );
    const total = countRows[0].total;

    res.json({
      success: true,
      data: rows,
      meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('getAssignedTasks error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/staff/tasks/:id ──────────────────────────────────────────────────
const getTaskDetail = async (req, res) => {
  try {
    const { rows: staffRows } = await pool.query(
      'SELECT id FROM maintenance_staff WHERE user_id = ?', [req.user.id]
    );
    if (!staffRows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    const staffId = staffRows[0].id;

    const { rows } = await pool.query(`
      SELECT c.*, cc.name AS category,
             ca.assigned_at, ca.deadline, ca.id AS assignment_id
      FROM complaints c
      JOIN complaint_categories cc ON cc.id = c.category_id
      JOIN complaint_assignments ca ON ca.complaint_id = c.id
      WHERE c.id = ? AND ca.staff_id = ? AND ca.is_active = 1`,
      [req.params.id, staffId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Task not found.' });

    const { rows: logs } = await pool.query(
      `SELECT old_status, new_status, note, role, changed_at
       FROM complaint_status_logs WHERE complaint_id = ? ORDER BY changed_at`,
      [req.params.id]
    );

    // Parse images JSON string → array
    const task = rows[0];
    try { task.images = JSON.parse(task.images || '[]'); } catch { task.images = []; }

    res.json({ success: true, data: { ...task, status_history: logs } });
  } catch (err) {
    console.error('getTaskDetail error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PATCH /api/staff/tasks/:id/status ────────────────────────────────────────
const updateTaskStatus = async (req, res) => {
  const { status, note } = req.body;
  const allowedTransitions = {
    Pending:      ['Acknowledged'],
    Acknowledged: ['In Progress'],
    'In Progress':['On Hold', 'Resolved'],
    'On Hold':    ['In Progress', 'Resolved'],
  };

  try {
    const { rows: staffRows } = await pool.query(
      'SELECT id FROM maintenance_staff WHERE user_id = ?', [req.user.id]
    );
    if (!staffRows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    const staffId = staffRows[0].id;

    const { rows: assigned } = await pool.query(`
      SELECT c.status AS current_status FROM complaints c
      JOIN complaint_assignments ca ON ca.complaint_id = c.id
      WHERE c.id = ? AND ca.staff_id = ? AND ca.is_active = 1`,
      [req.params.id, staffId]
    );
    if (!assigned.length) return res.status(404).json({ success: false, message: 'Task not found.' });

    const currentStatus = assigned[0].current_status;
    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move from "${currentStatus}" to "${status}". Allowed: ${allowed.join(', ')}`,
      });
    }
    if (status === 'On Hold' && !note) {
      return res.status(400).json({ success: false, message: 'A reason (note) is required when putting a task On Hold.' });
    }

    await pool.query(
      `UPDATE complaints SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [status, req.params.id]
    );
    await pool.query(
      `INSERT INTO complaint_status_logs (id, complaint_id, changed_by, role, old_status, new_status, note)
       VALUES (?, ?, ?, 'staff', ?, ?, ?)`,
      [uuidv4(), req.params.id, req.user.id, currentStatus, status, note || null]
    );

    res.json({ success: true, message: `Status updated to "${status}".` });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/staff/tasks/:id/notes ──────────────────────────────────────────
const addWorkNote = async (req, res) => {
  const { note } = req.body;
  if (!note?.trim()) return res.status(400).json({ success: false, message: 'Note cannot be empty.' });

  try {
    const { rows: staffRows } = await pool.query(
      'SELECT id FROM maintenance_staff WHERE user_id = ?', [req.user.id]
    );
    if (!staffRows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    const staffId = staffRows[0].id;

    const { rows } = await pool.query(`
      SELECT c.status FROM complaints c
      JOIN complaint_assignments ca ON ca.complaint_id = c.id
      WHERE c.id = ? AND ca.staff_id = ? AND ca.is_active = 1`,
      [req.params.id, staffId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Task not found.' });

    await pool.query(
      `INSERT INTO complaint_status_logs (id, complaint_id, changed_by, role, old_status, new_status, note)
       VALUES (?, ?, ?, 'staff', ?, ?, ?)`,
      [uuidv4(), req.params.id, req.user.id, rows[0].status, rows[0].status, note.trim()]
    );
    res.json({ success: true, message: 'Work note added.' });
  } catch (err) {
    console.error('addWorkNote error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/staff/tasks/history ─────────────────────────────────────────────
const getTaskHistory = async (req, res) => {
  try {
    const { rows: staffRows } = await pool.query(
      'SELECT id FROM maintenance_staff WHERE user_id = ?', [req.user.id]
    );
    if (!staffRows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    const staffId = staffRows[0].id;

    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows } = await pool.query(`
      SELECT c.id, c.title, c.priority, c.status, c.block, c.floor,
             cc.name AS category, ca.assigned_at, c.updated_at
      FROM complaint_assignments ca
      JOIN complaints c ON c.id = ca.complaint_id
      JOIN complaint_categories cc ON cc.id = c.category_id
      WHERE ca.staff_id = ?
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?`, [staffId, parseInt(limit), offset]
    );
    const { rows: countRows } = await pool.query(
      'SELECT COUNT(*) AS total FROM complaint_assignments WHERE staff_id = ?', [staffId]
    );
    res.json({
      success: true,
      data: rows,
      meta: { total: countRows[0].total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    console.error('getTaskHistory error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAssignedTasks, getTaskDetail, updateTaskStatus, addWorkNote, getTaskHistory };
