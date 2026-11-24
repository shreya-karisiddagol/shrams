// Seeds realistic demo complaints + assignments
const { db } = require('./pool');
const { v4: uuidv4 } = require('./uuid');

function seedDemo() {
  const existing = db.prepare('SELECT COUNT(*) AS cnt FROM complaints').get();
  if (existing.cnt > 0) return; // already seeded

  const staff = db.prepare('SELECT id FROM maintenance_staff').all();
  if (!staff.length) return;

  const catMap = {};
  db.prepare('SELECT id, name FROM complaint_categories').all()
    .forEach(c => { catMap[c.name] = c.id; });

  const complaints = [
    { id: uuidv4(), student_id: 'student-001', room_id: 'room-101', hostel_id: 'hostel-1',
      block: 'Block A', floor: '1', category_id: catMap['Electrical'],
      title: 'Fan not working in Room 101',
      description: 'The ceiling fan stopped working suddenly and makes a buzzing sound when switched on.',
      priority: 'high', status: 'Acknowledged' },
    { id: uuidv4(), student_id: 'student-002', room_id: 'room-205', hostel_id: 'hostel-1',
      block: 'Block B', floor: '2', category_id: catMap['Plumbing'],
      title: 'Water leakage from bathroom tap',
      description: 'The tap in the attached bathroom is leaking continuously. Water is pooling on the floor.',
      priority: 'critical', status: 'In Progress' },
    { id: uuidv4(), student_id: 'student-003', room_id: 'room-310', hostel_id: 'hostel-1',
      block: 'Block A', floor: '3', category_id: catMap['Internet / Wi-Fi'],
      title: 'Wi-Fi router not connecting on Floor 3',
      description: 'The Wi-Fi router has not been broadcasting a signal since yesterday evening.',
      priority: 'medium', status: 'Pending' },
    { id: uuidv4(), student_id: 'student-004', room_id: 'room-412', hostel_id: 'hostel-1',
      block: 'Block A', floor: '4', category_id: catMap['Carpentry'],
      title: 'Wardrobe door hinge broken',
      description: 'The wardrobe door hinge is completely broken. The door cannot be closed properly.',
      priority: 'low', status: 'Resolved' },
    { id: uuidv4(), student_id: 'student-005', room_id: 'room-115', hostel_id: 'hostel-1',
      block: 'Block B', floor: '1', category_id: catMap['Electrical'],
      title: 'Power socket sparking near study table',
      description: 'The socket sparks when a plug is inserted. This is very dangerous.',
      priority: 'critical', status: 'Acknowledged' },
  ];

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (id, student_id, room_id, hostel_id, block, floor, category_id, title, description, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAssignment = db.prepare(`
    INSERT INTO complaint_assignments (id, complaint_id, staff_id, assigned_by)
    VALUES (?, ?, ?, 'warden-001')
  `);
  const insertLog = db.prepare(`
    INSERT INTO complaint_status_logs (id, complaint_id, changed_by, role, old_status, new_status, note)
    VALUES (?, ?, 'warden-001', 'warden', 'Pending', ?, ?)
  `);
  const insertNotif = db.prepare(`
    INSERT INTO staff_notifications (id, staff_id, type, title, message, complaint_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  complaints.forEach((c, i) => {
    insertComplaint.run(c.id, c.student_id, c.room_id, c.hostel_id, c.block, c.floor,
      c.category_id, c.title, c.description, c.priority, c.status);

    const assignedStaff = staff[i % staff.length];
    insertAssignment.run(uuidv4(), c.id, assignedStaff.id);

    if (c.status !== 'Pending') {
      insertLog.run(uuidv4(), c.id, c.status, c.status === 'Resolved' ? 'Fixed successfully.' : null);
    }

    insertNotif.run(
      uuidv4(), assignedStaff.id,
      c.priority === 'critical' ? 'critical_alert' : 'new_task',
      c.priority === 'critical' ? '🚨 Critical Task Assigned' : '📋 New Task Assigned',
      c.title, c.id
    );
  });

  console.log('✅  Demo complaints and assignments seeded.');
}

module.exports = { seedDemo };
