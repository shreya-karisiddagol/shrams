const pool = require('../db/pool');
const { v4: uuidv4 } = require('../db/uuid');

// ── POST /api/complaints ──────────────────────────────────────────────────────
const createComplaint = async (req, res) => {
  const { room_id, hostel_id, block, floor, category_id, title, description, priority } = req.body;
  const images = req.files ? JSON.stringify(req.files.map(f => f.path)) : '[]';
  const id = uuidv4();

  try {
    await pool.query(
      `INSERT INTO complaints (id, student_id, room_id, hostel_id, block, floor, category_id, title, description, priority, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, room_id, hostel_id, block, floor, category_id, title, description, priority || 'medium', images]
    );
    const { rows } = await pool.query('SELECT * FROM complaints WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('createComplaint error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/complaints/:id ───────────────────────────────────────────────────
const getComplaintById = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, cc.name AS category,
             ca.assigned_at, ca.deadline,
             ms.full_name AS assigned_staff_name
      FROM complaints c
      LEFT JOIN complaint_categories cc ON cc.id = c.category_id
      LEFT JOIN complaint_assignments ca ON ca.complaint_id = c.id AND ca.is_active = 1
      LEFT JOIN maintenance_staff ms ON ms.id = ca.staff_id
      WHERE c.id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const { rows: logs } = await pool.query(
      `SELECT old_status, new_status, note, role, changed_at
       FROM complaint_status_logs WHERE complaint_id = ? ORDER BY changed_at`,
      [req.params.id]
    );

    const data = rows[0];
    try { data.images = JSON.parse(data.images || '[]'); } catch { data.images = []; }

    res.json({ success: true, data: { ...data, status_history: logs } });
  } catch (err) {
    console.error('getComplaintById error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/complaints/categories ───────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM complaint_categories ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createComplaint, getComplaintById, getCategories };
