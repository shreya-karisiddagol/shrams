const pool = require('../db/pool');
const { v4: uuidv4 } = require('../db/uuid');

// ── GET /api/staff/profile ───────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM maintenance_staff WHERE user_id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Staff profile not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PATCH /api/staff/profile ─────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { phone } = req.body;
  try {
    await pool.query(
      `UPDATE maintenance_staff SET phone = ?, updated_at = datetime('now') WHERE user_id = ?`,
      [phone, req.user.id]
    );
    const { rows } = await pool.query('SELECT * FROM maintenance_staff WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/staff/workload-stats ────────────────────────────────────────────
const getWorkloadStats = async (req, res) => {
  try {
    const { rows: staffRows } = await pool.query(
      'SELECT id FROM maintenance_staff WHERE user_id = ?', [req.user.id]
    );
    if (!staffRows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    const staffId = staffRows[0].id;

    const { rows } = await pool.query(`
      SELECT
        COUNT(CASE WHEN c.status != 'Resolved' THEN 1 END)              AS total_pending,
        COUNT(CASE WHEN c.status  = 'Resolved' THEN 1 END)              AS total_resolved,
        COUNT(CASE WHEN c.status  = 'In Progress' THEN 1 END)           AS in_progress,
        COUNT(CASE WHEN c.status  = 'On Hold' THEN 1 END)               AS on_hold,
        COUNT(CASE WHEN c.priority = 'critical' AND c.status != 'Resolved' THEN 1 END) AS critical_pending
      FROM complaint_assignments ca
      JOIN complaints c ON c.id = ca.complaint_id
      WHERE ca.staff_id = ? AND ca.is_active = 1`, [staffId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getWorkloadStats error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getProfile, updateProfile, getWorkloadStats };
