require('dotenv').config();
const pool = require('./db');

async function seedMaintenance() {
  try {
    console.log('Seeding maintenance staff profiles and test task...');

    // 1. Get maintenance users
    const usersRes = await pool.query("SELECT id, full_name, email FROM users WHERE role = 'maintenance'");
    console.log(`Found ${usersRes.rows.length} maintenance users.`);

    // 2. Get blocks
    const blocksRes = await pool.query("SELECT id, block_name FROM blocks LIMIT 2");
    const blockA = blocksRes.rows[0]?.id || null;
    const blockB = blocksRes.rows[1]?.id || null;

    for (const u of usersRes.rows) {
      const isPlumber = u.email.includes('maintenance') || u.full_name.toLowerCase().includes('plumb');
      const category = isPlumber ? 'Plumbing' : 'Electrical';
      const employeeId = isPlumber ? 'MS-PLUMB-01' : 'MS-ELEC-02';
      const assignedBlock = isPlumber ? blockA : blockB;

      const profCheck = await pool.query('SELECT id FROM maintenance_staff_profiles WHERE user_id = $1', [u.id]);
      if (profCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO maintenance_staff_profiles (user_id, employee_id, category, assigned_block_id, is_available)
           VALUES ($1, $2, $3, $4, true)`,
          [u.id, employeeId, category, assignedBlock]
        );
      } else {
        await pool.query(
          `UPDATE maintenance_staff_profiles
           SET category = $1, assigned_block_id = $2, employee_id = $3, is_available = true
           WHERE user_id = $4`,
          [category, assignedBlock, employeeId, u.id]
        );
      }
      console.log(`✓ Profile synced for ${u.full_name} (${category})`);
    }

    // 3. Check if there are any complaints assigned to Suresh Plumber
    const suresh = usersRes.rows.find(u => u.email.includes('maintenance'));
    if (suresh) {
      const existing = await pool.query("SELECT id FROM complaints WHERE assigned_to = $1", [suresh.id]);
      if (existing.rows.length === 0) {
        // Find a student and room
        const alloc = await pool.query(`
          SELECT student_id, room_id
          FROM allocations
          WHERE status = 'active'
          LIMIT 1
        `);

        if (alloc.rows.length > 0) {
          const { student_id, room_id } = alloc.rows[0];
          await pool.query(
            `INSERT INTO complaints (
               student_id, room_id, category, title, description,
               priority, status, assigned_to, assigned_at, work_notes
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)`,
            [
              student_id,
              room_id,
              'Plumbing',
              'Bathroom Tap Leakage in Room',
              'Continuous leakage from the washbasin tap creating water puddle on floor. Needs rubber washer replacement or new tap.',
              'high',
              'in_progress',
              suresh.id,
              `[${new Date().toLocaleString()}] Task assigned by Warden.\n[${new Date().toLocaleString()}] Inspected leak; ordered rubber washer.`
            ]
          );
          console.log('✓ Created initial high-priority plumbing task assigned to Suresh Plumber');
        }
      } else {
        console.log(`✓ Suresh already has ${existing.rows.length} assigned tasks.`);
      }
    }

    console.log('✅ Maintenance seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Maintenance seed failed:', error);
    process.exit(1);
  }
}

seedMaintenance();
