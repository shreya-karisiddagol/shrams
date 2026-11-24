/**
 * Allocation Model
 * Query helpers for allocations and related request tables
 */

const pool = require('../config/db');

const AllocationModel = {
  /**
   * Get current active allocation for a student (with full join details)
   */
  findActiveByStudentId: async (studentId) => {
    const result = await pool.query(
      `SELECT
         a.*,
         h.name AS hostel_name, h.type AS hostel_type, h.address AS hostel_address,
         b.block_name,
         r.room_number, r.floor, r.room_type, r.amenities,
         bd.bed_number,
         u.full_name AS allocated_by_name
       FROM allocations a
       JOIN hostels h ON h.id = a.hostel_id
       JOIN blocks b ON b.id = a.block_id
       JOIN rooms r ON r.id = a.room_id
       JOIN beds bd ON bd.id = a.bed_id
       LEFT JOIN users u ON u.id = a.allocated_by
       WHERE a.student_id = $1 AND a.status = 'active'
       LIMIT 1`,
      [studentId]
    );
    return result.rows[0] || null;
  },

  /**
   * Get allocation history for a student
   */
  findHistoryByStudentId: async (studentId, limit, offset) => {
    const result = await pool.query(
      `SELECT
         a.*,
         h.name AS hostel_name,
         b.block_name,
         r.room_number, r.room_type,
         bd.bed_number
       FROM allocations a
       JOIN hostels h ON h.id = a.hostel_id
       JOIN blocks b ON b.id = a.block_id
       JOIN rooms r ON r.id = a.room_id
       JOIN beds bd ON bd.id = a.bed_id
       WHERE a.student_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );
    return result.rows;
  },

  /**
   * Count allocations for a student
   */
  countByStudentId: async (studentId) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM allocations WHERE student_id = $1',
      [studentId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Get all allocations for a hostel (paginated)
   */
  findByHostelId: async (hostelId, limit, offset) => {
    const result = await pool.query(
      `SELECT
         a.*,
         u.full_name AS student_name, u.email AS student_email,
         sp.usn,
         h.name AS hostel_name,
         b.block_name,
         r.room_number, r.room_type,
         bd.bed_number
       FROM allocations a
       JOIN users u ON u.id = a.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = a.student_id
       JOIN hostels h ON h.id = a.hostel_id
       JOIN blocks b ON b.id = a.block_id
       JOIN rooms r ON r.id = a.room_id
       JOIN beds bd ON bd.id = a.bed_id
       WHERE a.hostel_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [hostelId, limit, offset]
    );
    return result.rows;
  },

  /**
   * Count allocations for a hostel
   */
  countByHostelId: async (hostelId) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM allocations WHERE hostel_id = $1',
      [hostelId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Find allocation by ID with full details
   */
  findById: async (id) => {
    const result = await pool.query(
      `SELECT
         a.*,
         u.full_name AS student_name, u.email AS student_email,
         sp.usn, sp.department,
         h.name AS hostel_name,
         b.block_name,
         r.room_number, r.floor, r.room_type,
         bd.bed_number
       FROM allocations a
       JOIN users u ON u.id = a.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = a.student_id
       JOIN hostels h ON h.id = a.hostel_id
       JOIN blocks b ON b.id = a.block_id
       JOIN rooms r ON r.id = a.room_id
       JOIN beds bd ON bd.id = a.bed_id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Get occupancy statistics for a hostel
   */
  getOccupancyStats: async (hostelId) => {
    const result = await pool.query(
      `SELECT
         COUNT(bd.id) AS total_beds,
         COUNT(bd.id) FILTER (WHERE bd.status = 'available') AS available_beds,
         COUNT(bd.id) FILTER (WHERE bd.status = 'occupied') AS occupied_beds,
         COUNT(bd.id) FILTER (WHERE bd.status = 'maintenance') AS maintenance_beds,
         COUNT(bd.id) FILTER (WHERE bd.status = 'reserved') AS reserved_beds,
         COUNT(DISTINCT r.id) AS total_rooms,
         COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'available') AS available_rooms,
         COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'fully_occupied') AS full_rooms,
         COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'maintenance') AS maintenance_rooms
       FROM rooms r
       JOIN blocks b ON r.block_id = b.id
       LEFT JOIN beds bd ON bd.room_id = r.id
       WHERE b.hostel_id = $1`,
      [hostelId]
    );
    return result.rows[0];
  },
};

module.exports = AllocationModel;
