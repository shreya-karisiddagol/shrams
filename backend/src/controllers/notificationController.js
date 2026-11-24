const pool = require('../db/pool');
const { v4: uuidv4 } = require('../db/uuid');

// ── GET /api/staff/notifications ─────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const { rows: staffRows } = await pool.query(
      'SELECT id FROM maintenance_staff WHERE user_id = ?', [req.user.id]
    );
    if (!staffRows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    const staffId = staffRows[0].id;

    const { rows } = await pool.query(
      `SELECT * FROM staff_notifications WHERE staff_id = ? ORDER BY created_at DESC LIMIT 50`,
      [staffId]
    );
    const unreadCount = rows.filter(n => !n.is_read).length;
    res.json({ success: true, data: rows, unread_count: unreadCount });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PATCH /api/staff/notifications/:id/read ───────────────────────────────────
const markRead = async (req, res) => {
  try {
    const { rows: staffRows } = await pool.query(
      'SELECT id FROM maintenance_staff WHERE user_id = ?', [req.user.id]
    );
    if (!staffRows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    await pool.query(
      `UPDATE staff_notifications SET is_read = 1 WHERE id = ? AND staff_id = ?`,
      [req.params.id, staffRows[0].id]
    );
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── PATCH /api/staff/notifications/mark-all-read ─────────────────────────────
const markAllRead = async (req, res) => {
  try {
    const { rows: staffRows } = await pool.query(
      'SELECT id FROM maintenance_staff WHERE user_id = ?', [req.user.id]
    );
    if (!staffRows.length) return res.status(404).json({ success: false, message: 'Staff not found.' });
    await pool.query(
      `UPDATE staff_notifications SET is_read = 1 WHERE staff_id = ?`,
      [staffRows[0].id]
    );
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getNotifications, markRead, markAllRead };
