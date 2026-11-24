const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Demo staff accounts (password hashed externally via auth service)
    await client.query(`
      INSERT INTO maintenance_staff
        (user_id, employee_id, full_name, phone, email, category, assigned_block)
      VALUES
        ('00000000-0000-0000-0000-000000000011','EMP001','Ravi Kumar',
         '9876543210','ravi.kumar@shrams.in','Electrical','Block A'),
        ('00000000-0000-0000-0000-000000000012','EMP002','Suresh Plumber',
         '9876543211','suresh.p@shrams.in','Plumbing','Block B'),
        ('00000000-0000-0000-0000-000000000013','EMP003','Mohan Carpenter',
         '9876543212','mohan.c@shrams.in','Carpentry',NULL)
      ON CONFLICT (employee_id) DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅  Seed data inserted.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
