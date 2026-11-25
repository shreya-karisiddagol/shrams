/**
 * SHRAMS Database Seeder
 * Populates demo accounts for all roles, hostels, blocks, rooms, and sample data.
 * Run: node src/config/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting SHRAMS database seed...');
    await client.query('BEGIN');

    // Password hashes
    const studentPass = await bcrypt.hash('Student@123', 12);
    const wardenPass = await bcrypt.hash('Warden@123', 12);
    const adminPass = await bcrypt.hash('Admin@123', 12);
    const maintPass = await bcrypt.hash('Staff@123', 12);
    const superPass = await bcrypt.hash('SuperAdmin@123', 12);

    // 1. Seed Users
    const usersSql = `
      INSERT INTO users (full_name, email, password_hash, role, phone, is_active)
      VALUES 
        ('Dr. Ramesh Kumar (Warden)', 'warden@shrams.edu', $1, 'warden', '9876543210', true),
        ('Rahul Sharma', 'student@shrams.edu', $2, 'student', '9876543211', true),
        ('Priya Patel', 'priya@shrams.edu', $2, 'student', '9876543212', true),
        ('Amit Verma (Admin)', 'admin@shrams.edu', $3, 'admin', '9876543213', true),
        ('Suresh Plumber (Staff)', 'maintenance@shrams.edu', $4, 'maintenance', '9876543214', true),
        ('Rajesh Electrician (Staff)', 'electrician@shrams.edu', $4, 'maintenance', '9876543215', true),
        ('System Administrator', 'superadmin@shrams.edu', $5, 'super_admin', '9876543216', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, role;
    `;
    const usersResult = await client.query(usersSql, [wardenPass, studentPass, adminPass, maintPass, superPass]);
    console.log(`✅ Users checked/seeded.`);

    // Fetch user IDs
    const users = (await client.query('SELECT id, email, role FROM users')).rows;
    const userMap = {};
    users.forEach(u => { userMap[u.email] = u.id; });

    const studentId = userMap['student@shrams.edu'];
    const priyaId = userMap['priya@shrams.edu'];
    const wardenId = userMap['warden@shrams.edu'];
    const maintId = userMap['maintenance@shrams.edu'];

    // 2. Seed Student Profiles
    if (studentId) {
      await client.query(`
        INSERT INTO student_profiles 
          (user_id, usn, department, semester, gender, date_of_birth, address, parent_name, parent_phone, parent_email, emergency_contact, blood_group)
        VALUES 
          ($1, '1MS21CS045', 'Computer Science & Engineering', 5, 'male', '2003-05-15', 'Flat 402, Green Glen Layout, Bellandur, Bangalore', 'Sanjay Sharma', '9876500001', 'sanjay.sharma@gmail.com', '9876500002', 'B+')
        ON CONFLICT (usn) DO NOTHING;
      `, [studentId]);
    }

    if (priyaId) {
      await client.query(`
        INSERT INTO student_profiles 
          (user_id, usn, department, semester, gender, date_of_birth, address, parent_name, parent_phone, parent_email, emergency_contact, blood_group)
        VALUES 
          ($1, '1MS21IS088', 'Information Science & Engineering', 5, 'female', '2003-08-20', 'House No 12, Indiranagar, Bangalore', 'Mahesh Patel', '9876500003', 'mahesh.patel@gmail.com', '9876500004', 'O+')
        ON CONFLICT (usn) DO NOTHING;
      `, [priyaId]);
    }
    console.log('✅ Student profiles seeded.');

    // 3. Seed Hostels
    const hostelRes = await client.query(`
      INSERT INTO hostels (name, type, address, total_capacity, warden_id, facilities, rules)
      VALUES 
        ('Aryabhata Boys Hostel', 'boys', 'Campus North Wing, University Campus', 120, $1, 
         ARRAY['High-Speed WiFi', '24/7 Security', 'Mess / Canteen', 'Study Room', 'Gym', 'Laundry Room', 'Power Backup'],
         '1. Entry restricted after 9:30 PM. 2. Ragging is strictly forbidden. 3. Maintain silence after 10 PM.'),
        ('Gargi Girls Hostel', 'girls', 'Campus South Wing, University Campus', 100, $1, 
         ARRAY['High-Speed WiFi', '24/7 Security', 'Mess / Canteen', 'Study Room', 'Medical Room', 'Laundry Room', 'Power Backup'],
         '1. Entry restricted after 9:00 PM. 2. Visitors permitted in lobby only. 3. Proper ID card required.')
      RETURNING id, name;
    `, [wardenId]);
    console.log('✅ Hostels seeded.');

    const boysHostelId = hostelRes.rows.find(h => h.name.includes('Boys'))?.id;
    const girlsHostelId = hostelRes.rows.find(h => h.name.includes('Girls'))?.id;

    // 4. Seed Blocks for each Hostel
    const blocksData = [
      { hostel_id: boysHostelId, name: 'A', floors: 3 },
      { hostel_id: boysHostelId, name: 'B', floors: 3 },
      { hostel_id: girlsHostelId, name: 'A', floors: 3 },
      { hostel_id: girlsHostelId, name: 'B', floors: 2 },
    ];

    const blockMap = {};
    for (const b of blocksData) {
      if (!b.hostel_id) continue;
      const bRes = await client.query(`
        INSERT INTO blocks (hostel_id, block_name, total_floors)
        VALUES ($1, $2, $3)
        RETURNING id, block_name, hostel_id;
      `, [b.hostel_id, b.name, b.floors]);
      const key = `${b.hostel_id}_${b.name}`;
      blockMap[key] = bRes.rows[0].id;
    }
    console.log('✅ Blocks seeded.');

    // 5. Seed Rooms & Beds for Boys Block A and Girls Block A
    const boysBlockA = blockMap[`${boysHostelId}_A`];
    const girlsBlockA = blockMap[`${girlsHostelId}_A`];

    const sampleRooms = [
      // Floor 1
      { block_id: boysBlockA, room_number: '101', floor: 1, type: 'double', capacity: 2, amenities: ['WiFi', 'Study Table', 'Attached Bathroom'] },
      { block_id: boysBlockA, room_number: '102', floor: 1, type: 'single', capacity: 1, amenities: ['WiFi', 'Study Table', 'Balcony'] },
      { block_id: boysBlockA, room_number: '103', floor: 1, type: 'triple', capacity: 3, amenities: ['WiFi', 'Study Table'] },
      // Floor 2
      { block_id: boysBlockA, room_number: '201', floor: 2, type: 'double', capacity: 2, amenities: ['WiFi', 'Study Table', 'Attached Bathroom'] },
      { block_id: boysBlockA, room_number: '202', floor: 2, type: 'double', capacity: 2, amenities: ['WiFi', 'Study Table'] },
      // Girls Hostel Floor 1
      { block_id: girlsBlockA, room_number: 'G101', floor: 1, type: 'double', capacity: 2, amenities: ['WiFi', 'Study Table', 'Attached Bathroom'] },
      { block_id: girlsBlockA, room_number: 'G102', floor: 1, type: 'single', capacity: 1, amenities: ['WiFi', 'Study Table', 'Balcony'] },
    ];

    let firstBedId = null;
    let firstRoomId = null;

    for (const r of sampleRooms) {
      if (!r.block_id) continue;
      const roomRes = await client.query(`
        INSERT INTO rooms (block_id, room_number, floor, room_type, capacity, status, amenities)
        VALUES ($1, $2, $3, $4, $5, 'available', $6)
        RETURNING id;
      `, [r.block_id, r.room_number, r.floor, r.type, r.capacity, r.amenities]);
      const roomId = roomRes.rows[0].id;
      if (!firstRoomId) firstRoomId = roomId;

      // Create beds for this room
      for (let i = 1; i <= r.capacity; i++) {
        const bedRes = await client.query(`
          INSERT INTO beds (room_id, bed_number, status)
          VALUES ($1, $2, 'available')
          RETURNING id;
        `, [roomId, `Bed-${i}`]);
        if (!firstBedId) firstBedId = bedRes.rows[0].id;
      }
    }
    console.log('✅ Rooms & Beds seeded.');

    // 6. Pre-allocate Room 101 Bed-1 to Student Rahul Sharma
    if (studentId && firstBedId && firstRoomId && boysHostelId && boysBlockA) {
      await client.query(`
        INSERT INTO allocations (student_id, hostel_id, block_id, room_id, bed_id, allocated_by, allocation_date, check_in_date, status)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, CURRENT_DATE, 'active')
        ON CONFLICT DO NOTHING;
      `, [studentId, boysHostelId, boysBlockA, firstRoomId, firstBedId, wardenId]);

      // Update bed & room status
      await client.query(`UPDATE beds SET status = 'occupied' WHERE id = $1`, [firstBedId]);
      await client.query(`UPDATE rooms SET status = 'partially_occupied' WHERE id = $1`, [firstRoomId]);
      console.log('✅ Sample allocation seeded for student.');
    }

    // 7. Seed Sample Announcements
    await client.query(`
      INSERT INTO announcements (hostel_id, title, content, posted_by, priority)
      VALUES 
        ($1, 'Welcome to the New Academic Semester 2026-27', 'Hostel gates will remain open till 10:00 PM during the induction week. Please ensure you have completed your biometric registration at the hostel reception.', $2, 'important'),
        ($1, 'Mess Timings Update', 'Breakfast: 7:30 AM – 9:00 AM\nLunch: 12:30 PM – 2:00 PM\nSnacks: 5:00 PM – 6:00 PM\nDinner: 7:30 PM – 9:30 PM.\nSpecial feast this Sunday!', $2, 'normal'),
        ($1, 'Water Tank Maintenance on Saturday', 'Periodic cleaning of overhead water tanks is scheduled for Saturday between 10 AM and 2 PM. Water supply may be interrupted during this period. Please store sufficient water.', $2, 'urgent');
    `, [boysHostelId, wardenId]);
    console.log('✅ Announcements seeded.');

    // 8. Seed Sample Notification for student
    if (studentId) {
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, is_read)
        VALUES 
          ($1, 'Welcome to SHRAMS', 'Your account has been set up. Check your room allocation details in the Room Allocation tab.', 'info', false),
          ($1, 'Room Allocation Confirmed', 'You have been allocated Room 101, Bed-1 in Aryabhata Boys Hostel Block A.', 'allocation', false);
      `, [studentId]);
      console.log('✅ Notifications seeded.');
    }

    await client.query('COMMIT');
    console.log('🎉 Database seeding completed successfully!\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
