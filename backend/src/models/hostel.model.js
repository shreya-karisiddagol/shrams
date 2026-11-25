/**
 * Hostel Model
 * Query helpers for hostels, blocks, and rooms tables
 */

const pool = require('../config/db');

const HostelModel = {
  /**
   * Get all active hostels with block/room summary stats
   */
  findAll: async () => {
    const result = await pool.query(
      `SELECT
         h.*,
         u.full_name AS warden_name,
         (SELECT COUNT(*) FROM blocks b WHERE b.hostel_id = h.id AND b.is_active = true) AS total_blocks,
         (SELECT COUNT(*) FROM rooms r
          JOIN blocks b ON r.block_id = b.id
          WHERE b.hostel_id = h.id) AS total_rooms,
         (SELECT COUNT(*) FROM beds bd
          JOIN rooms r ON bd.room_id = r.id
          JOIN blocks b ON r.block_id = b.id
          WHERE b.hostel_id = h.id AND bd.status = 'available') AS available_beds
       FROM hostels h
       LEFT JOIN users u ON u.id = h.warden_id
       WHERE h.is_active = true
       ORDER BY h.name`
    );
    return result.rows;
  },

  /**
   * Get a single hostel by ID with full details
   */
  findById: async (id) => {
    const result = await pool.query(
      `SELECT h.*, u.full_name AS warden_name
       FROM hostels h
       LEFT JOIN users u ON u.id = h.warden_id
       WHERE h.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Get all blocks for a hostel
   */
  getBlocks: async (hostelId) => {
    const result = await pool.query(
      `SELECT b.*,
         (SELECT COUNT(*) FROM rooms r WHERE r.block_id = b.id) AS total_rooms
       FROM blocks b
       WHERE b.hostel_id = $1 AND b.is_active = true
       ORDER BY b.block_name`,
      [hostelId]
    );
    return result.rows;
  },

  /**
   * Get available rooms for a hostel (with available bed count)
   */
  getAvailableRooms: async (hostelId, roomType = null) => {
    let query = `
      SELECT
        r.*,
        b.block_name, b.id AS block_id,
        h.name AS hostel_name,
        COUNT(bd.id) FILTER (WHERE bd.status = 'available') AS available_beds_count,
        COUNT(bd.id) AS total_beds,
        COALESCE(
          json_agg(
            json_build_object(
              'id', bd.id,
              'bed_number', bd.bed_number,
              'status', bd.status
            ) ORDER BY bd.bed_number
          ) FILTER (WHERE bd.status = 'available'),
          '[]'::json
        ) AS available_beds
      FROM rooms r
      JOIN blocks b ON r.block_id = b.id
      JOIN hostels h ON h.id = b.hostel_id
      LEFT JOIN beds bd ON bd.room_id = r.id
      WHERE b.hostel_id = $1
        AND r.status NOT IN ('maintenance','reserved','fully_occupied')
    `;
    const values = [hostelId];

    if (roomType) {
      query += ` AND r.room_type = $2`;
      values.push(roomType);
    }

    query += ` GROUP BY r.id, b.block_name, b.id, h.name HAVING COUNT(bd.id) FILTER (WHERE bd.status = 'available') > 0 ORDER BY b.block_name, r.room_number`;
    const result = await pool.query(query, values);
    return result.rows;
  },

  /**
   * Get room layout data for a hostel (all rooms with bed statuses)
   */
  getRoomLayout: async (hostelId) => {
    const result = await pool.query(
      `SELECT
         b.block_name, b.id AS block_id,
         r.id AS room_id, r.room_number, r.floor, r.room_type, r.capacity, r.status AS room_status,
         json_agg(json_build_object(
           'id', bd.id,
           'bed_number', bd.bed_number,
           'status', bd.status
         ) ORDER BY bd.bed_number) AS beds
       FROM blocks b
       JOIN rooms r ON r.block_id = b.id
       LEFT JOIN beds bd ON bd.room_id = r.id
       WHERE b.hostel_id = $1
       GROUP BY b.block_name, b.id, r.id
       ORDER BY b.block_name, r.floor, r.room_number`,
      [hostelId]
    );
    return result.rows;
  },

  /**
   * Get hostel assigned to a warden
   */
  findByWardenId: async (wardenId) => {
    const result = await pool.query(
      'SELECT * FROM hostels WHERE warden_id = $1 AND is_active = true',
      [wardenId]
    );
    return result.rows[0] || null;
  },
};

module.exports = HostelModel;
