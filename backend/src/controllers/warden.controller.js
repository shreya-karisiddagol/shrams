/**
 * Warden Controller
 * Full implementations for all warden-facing API endpoints
 */

const pool = require('../config/db');
const HostelModel = require('../models/hostel.model');
const ApplicationModel = require('../models/application.model');
const AllocationModel = require('../models/allocation.model');
const ComplaintModel = require('../models/complaint.model');
const StudentModel = require('../models/student.model');
const { notify, createBulkNotifications } = require('../utils/notifications');
const {
  getPagination, paginatedResponse, sendSuccess, sendError, isValidUUID,
} = require('../utils/helpers');

// ─── Helper: Get warden's hostel ──────────────────────────────────────────────
/**
 * Finds the hostel assigned to the logged-in warden.
 * Returns null if none assigned.
 */
const getWardenHostel = async (wardenId) => {
  return HostelModel.findByWardenId(wardenId);
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * GET /api/warden/dashboard
 * Returns key stats for the warden's hostel
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned to this warden.', 404);

    const [occupancy, appStats, complaintStats] = await Promise.all([
      AllocationModel.getOccupancyStats(hostel.id),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'pending') AS pending_applications,
           COUNT(*) FILTER (WHERE status = 'approved') AS approved_applications,
           COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_applications,
           COUNT(*) FILTER (WHERE status = 'waitlisted') AS waitlisted_applications
         FROM hostel_applications WHERE preferred_hostel_id = $1`,
        [hostel.id]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE c.status = 'pending') AS pending_complaints,
           COUNT(*) FILTER (WHERE c.status = 'in_progress') AS in_progress_complaints,
           COUNT(*) FILTER (WHERE c.status = 'resolved') AS resolved_complaints,
           COUNT(*) FILTER (WHERE c.priority = 'critical' AND c.status NOT IN ('resolved','closed')) AS critical_open
         FROM complaints c
         JOIN rooms r ON r.id = c.room_id
         JOIN blocks b ON b.id = r.block_id
         WHERE b.hostel_id = $1`,
        [hostel.id]
      ),
    ]);

    const occupancyRate =
      occupancy.total_beds > 0
        ? Math.round((occupancy.occupied_beds / occupancy.total_beds) * 100)
        : 0;

    sendSuccess(res, {
      hostel: { id: hostel.id, name: hostel.name, type: hostel.type },
      occupancy: { ...occupancy, occupancyRate },
      applications: appStats.rows[0],
      complaints: complaintStats.rows[0],
    }, 'Dashboard data fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Applications ─────────────────────────────────────────────────────────────

/**
 * GET /api/warden/applications
 * List all applications for the warden's hostel with optional status filter
 */
exports.getApplications = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    const [applications, total] = await Promise.all([
      ApplicationModel.findByHostelId(hostel.id, status || null, limit, offset),
      ApplicationModel.countByHostelId(hostel.id, status || null),
    ]);

    sendSuccess(res, paginatedResponse(applications, total, page, limit), 'Applications fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/warden/applications/:id
 * Get a specific application's full details
 */
exports.getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, 'Invalid application ID.', 400);

    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const application = await ApplicationModel.findById(id);
    if (!application) return sendError(res, 'Application not found.', 404);

    // Ensure it's for this warden's hostel
    if (application.preferred_hostel_id !== hostel.id) {
      return sendError(res, 'Access denied. This application is not for your hostel.', 403);
    }

    sendSuccess(res, application, 'Application fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/warden/applications/:id/review
 * Approve / reject / waitlist an application
 * Body: { status: 'approved'|'rejected'|'waitlisted', review_notes: '...' }
 */
exports.reviewApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    if (!isValidUUID(id)) return sendError(res, 'Invalid application ID.', 400);
    if (!['approved', 'rejected', 'waitlisted'].includes(status)) {
      return sendError(res, "Status must be 'approved', 'rejected', or 'waitlisted'.", 400);
    }

    const application = await ApplicationModel.findById(id);
    if (!application) return sendError(res, 'Application not found.', 404);
    if (application.status !== 'pending') {
      return sendError(res, `Application has already been reviewed (status: ${application.status}).`, 400);
    }

    const updated = await ApplicationModel.review(id, req.user.id, status, review_notes);

    // Send notification to student
    if (status === 'approved') {
      await notify.applicationApproved(application.student_id, id);
    } else if (status === 'rejected') {
      await notify.applicationRejected(application.student_id, id, review_notes);
    } else {
      await notify.applicationWaitlisted(application.student_id, id);
    }

    sendSuccess(res, updated, `Application ${status} successfully`);
  } catch (error) {
    next(error);
  }
};

// ─── Students ─────────────────────────────────────────────────────────────────

/**
 * GET /api/warden/students
 * List all students in the warden's hostel (via active allocations)
 */
exports.getStudents = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { page, limit, offset } = getPagination(req.query);
    const { search = '' } = req.query;
    const searchParam = `%${search}%`;

    const result = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.phone,
         sp.usn, sp.department, sp.semester, sp.gender, sp.profile_photo,
         a.id AS allocation_id, a.allocation_date, a.status AS allocation_status,
         r.room_number, b.block_name, bd.bed_number
       FROM allocations a
       JOIN users u ON u.id = a.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = a.student_id
       JOIN rooms r ON r.id = a.room_id
       JOIN blocks b ON b.id = a.block_id
       JOIN beds bd ON bd.id = a.bed_id
       WHERE a.hostel_id = $1 AND a.status = 'active'
         AND (u.full_name ILIKE $2 OR u.email ILIKE $2 OR sp.usn ILIKE $2 OR sp.department ILIKE $2)
       ORDER BY u.full_name
       LIMIT $3 OFFSET $4`,
      [hostel.id, searchParam, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM allocations a
       JOIN users u ON u.id = a.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = a.student_id
       WHERE a.hostel_id = $1 AND a.status = 'active'
         AND (u.full_name ILIKE $2 OR u.email ILIKE $2 OR sp.usn ILIKE $2 OR sp.department ILIKE $2)`,
      [hostel.id, searchParam]
    );

    sendSuccess(
      res,
      paginatedResponse(result.rows, countResult.rows[0].count, page, limit),
      'Students fetched'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/warden/students/:id
 * Get full details for a specific student
 */
exports.getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, 'Invalid student ID.', 400);

    const student = await StudentModel.findByUserId(id);
    if (!student || student.role === 'warden') return sendError(res, 'Student not found.', 404);

    // Also get current allocation
    const allocation = await AllocationModel.findActiveByStudentId(id);

    sendSuccess(res, { ...student, allocation: allocation || null }, 'Student details fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Rooms ────────────────────────────────────────────────────────────────────

/**
 * GET /api/warden/rooms
 * Get available rooms (and beds) in the warden's hostel
 */
exports.getAvailableRooms = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { room_type } = req.query;
    const rooms = await HostelModel.getAvailableRooms(hostel.id, room_type || null);
    sendSuccess(res, rooms, 'Available rooms fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/warden/rooms/layout
 * Get full room layout (all rooms + beds with statuses)
 */
exports.getRoomLayout = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const layout = await HostelModel.getRoomLayout(hostel.id);
    sendSuccess(res, layout, 'Room layout fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Allocations ─────────────────────────────────────────────────────────────

/**
 * GET /api/warden/allocations
 * List all allocations in the warden's hostel
 */
exports.getAllocations = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { page, limit, offset } = getPagination(req.query);
    const [allocations, total] = await Promise.all([
      AllocationModel.findByHostelId(hostel.id, limit, offset),
      AllocationModel.countByHostelId(hostel.id),
    ]);

    sendSuccess(res, paginatedResponse(allocations, total, page, limit), 'Allocations fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/warden/allocations/:id
 * Get a specific allocation's details
 */
exports.getAllocationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, 'Invalid allocation ID.', 400);

    const allocation = await AllocationModel.findById(id);
    if (!allocation) return sendError(res, 'Allocation not found.', 404);

    sendSuccess(res, allocation, 'Allocation fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/warden/allocations
 * Manually allocate a student to a specific bed
 * Body: { student_id, bed_id, check_in_date }
 */
exports.createAllocation = async (req, res, next) => {
  try {
    const { student_id, bed_id, check_in_date } = req.body;

    if (!student_id || !bed_id) return sendError(res, 'student_id and bed_id are required.', 400);
    if (!isValidUUID(student_id) || !isValidUUID(bed_id)) return sendError(res, 'Invalid UUID format.', 400);

    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the bed row to prevent race conditions
      const bedResult = await client.query(
        `SELECT bd.*, r.id AS room_id, r.room_type, r.block_id,
                b.hostel_id
         FROM beds bd
         JOIN rooms r ON r.id = bd.room_id
         JOIN blocks b ON b.id = r.block_id
         WHERE bd.id = $1 FOR UPDATE`,
        [bed_id]
      );

      if (bedResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return sendError(res, 'Bed not found.', 404);
      }

      const bed = bedResult.rows[0];

      if (bed.hostel_id !== hostel.id) {
        await client.query('ROLLBACK');
        return sendError(res, 'Bed does not belong to your hostel.', 403);
      }

      if (bed.status !== 'available') {
        await client.query('ROLLBACK');
        return sendError(res, `Bed is not available (current status: ${bed.status}).`, 400);
      }

      // Check student doesn't already have an active allocation
      const existingAlloc = await client.query(
        `SELECT id FROM allocations WHERE student_id = $1 AND status = 'active'`,
        [student_id]
      );
      if (existingAlloc.rows.length > 0) {
        await client.query('ROLLBACK');
        return sendError(res, 'Student already has an active allocation.', 409);
      }

      // Create the allocation
      const allocResult = await client.query(
        `INSERT INTO allocations
           (student_id, hostel_id, block_id, room_id, bed_id, allocated_by, check_in_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
         RETURNING *`,
        [student_id, hostel.id, bed.block_id, bed.room_id, bed_id, req.user.id, check_in_date || null]
      );

      // Mark bed as occupied
      await client.query(`UPDATE beds SET status = 'occupied' WHERE id = $1`, [bed_id]);

      // Update room status based on occupancy
      await client.query(`
        UPDATE rooms SET status =
          CASE
            WHEN (SELECT COUNT(*) FROM beds WHERE room_id = $1 AND status = 'available') = 0 THEN 'fully_occupied'
            ELSE 'partially_occupied'
          END
        WHERE id = $1`, [bed.room_id]
      );

      await client.query('COMMIT');

      // Get room number for notification
      const roomResult = await pool.query('SELECT room_number FROM rooms WHERE id = $1', [bed.room_id]);
      await notify.roomAllocated(student_id, allocResult.rows[0].id, roomResult.rows[0]?.room_number);

      sendSuccess(res, allocResult.rows[0], 'Student allocated successfully', 201);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/warden/allocations/auto-allocate
 * Smart auto-allocation: matches approved unallocated applications to available beds
 * Respects preferred_room_type and preferred_block_id
 */
exports.autoAllocate = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    // Get all approved, unallocated applications for this hostel
    const applications = await ApplicationModel.findApprovedUnallocated(hostel.id);

    if (applications.length === 0) {
      return sendSuccess(res, { allocated: [], failed: [] }, 'No approved unallocated applications found.');
    }

    const allocated = [];
    const failed = [];
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const app of applications) {
        // Find an available bed matching preferences (preferred_room_type, preferred_block_id)
        let bedQuery = `
          SELECT bd.id AS bed_id, bd.room_id, r.block_id, b.hostel_id, r.room_number, r.room_type, bd.bed_number
          FROM beds bd
          JOIN rooms r ON r.id = bd.room_id
          JOIN blocks b ON b.id = r.block_id
          WHERE b.hostel_id = $1
            AND bd.status = 'available'
        `;
        const bedValues = [hostel.id];
        let idx = 2;

        if (app.preferred_room_type) {
          bedQuery += ` AND r.room_type = $${idx++}`;
          bedValues.push(app.preferred_room_type);
        }

        if (app.preferred_block_id) {
          bedQuery += ` AND b.id = $${idx++}`;
          bedValues.push(app.preferred_block_id);
        }

        bedQuery += ` ORDER BY b.block_name, r.room_number, bd.bed_number LIMIT 1 FOR UPDATE SKIP LOCKED`;

        const bedResult = await client.query(bedQuery, bedValues);

        if (bedResult.rows.length === 0) {
          failed.push({ application_id: app.id, student_id: app.student_id, reason: 'No available bed matching preferences.' });
          continue;
        }

        const bed = bedResult.rows[0];

        // Create allocation
        const allocResult = await client.query(
          `INSERT INTO allocations
             (student_id, hostel_id, block_id, room_id, bed_id, allocated_by, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'active')
           RETURNING *`,
          [app.student_id, hostel.id, bed.block_id, bed.bed_id, bed.bed_id, req.user.id]
        );

        // Mark bed occupied
        await client.query(`UPDATE beds SET status = 'occupied' WHERE id = $1`, [bed.bed_id]);

        // Update room status
        await client.query(`
          UPDATE rooms SET status =
            CASE
              WHEN (SELECT COUNT(*) FROM beds WHERE room_id = $1 AND status = 'available') = 0 THEN 'fully_occupied'
              ELSE 'partially_occupied'
            END
          WHERE id = $1`, [bed.room_id]
        );

        allocated.push({
          application_id: app.id,
          student_id: app.student_id,
          allocation_id: allocResult.rows[0].id,
          room_number: bed.room_number,
          bed_number: bed.bed_number,
        });
      }

      await client.query('COMMIT');

      // Send notifications outside transaction
      for (const a of allocated) {
        await notify.roomAllocated(a.student_id, a.allocation_id, a.room_number);
      }

      sendSuccess(res, {
        summary: { totalProcessed: applications.length, allocated: allocated.length, failed: failed.length },
        allocated,
        failed,
      }, `Auto-allocation complete. ${allocated.length} student(s) allocated.`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/warden/allocations/:id/reallocate
 * Move a student to a different bed
 * Body: { new_bed_id, reason }
 */
exports.reallocateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_bed_id } = req.body;

    if (!isValidUUID(id) || !isValidUUID(new_bed_id)) return sendError(res, 'Invalid UUID format.', 400);

    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the existing allocation
      const allocResult = await client.query(
        `SELECT * FROM allocations WHERE id = $1 AND status = 'active' FOR UPDATE`,
        [id]
      );
      if (allocResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return sendError(res, 'Active allocation not found.', 404);
      }

      const oldAlloc = allocResult.rows[0];

      // Lock the new bed
      const newBedResult = await client.query(
        `SELECT bd.*, r.block_id, b.hostel_id
         FROM beds bd
         JOIN rooms r ON r.id = bd.room_id
         JOIN blocks b ON b.id = r.block_id
         WHERE bd.id = $1 FOR UPDATE`,
        [new_bed_id]
      );

      if (newBedResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return sendError(res, 'New bed not found.', 404);
      }

      const newBed = newBedResult.rows[0];

      if (newBed.status !== 'available') {
        await client.query('ROLLBACK');
        return sendError(res, 'New bed is not available.', 400);
      }

      // Free old bed
      await client.query(`UPDATE beds SET status = 'available' WHERE id = $1`, [oldAlloc.bed_id]);

      // Update old room status
      await client.query(`
        UPDATE rooms SET status =
          CASE
            WHEN (SELECT COUNT(*) FROM beds WHERE room_id = $1 AND status = 'available') = capacity THEN 'available'
            WHEN (SELECT COUNT(*) FROM beds WHERE room_id = $1 AND status = 'available') = 0 THEN 'fully_occupied'
            ELSE 'partially_occupied'
          END
        WHERE id = $1`, [oldAlloc.room_id]
      );

      // Occupy new bed
      await client.query(`UPDATE beds SET status = 'occupied' WHERE id = $1`, [new_bed_id]);

      // Update new room status
      await client.query(`
        UPDATE rooms SET status =
          CASE
            WHEN (SELECT COUNT(*) FROM beds WHERE room_id = $1 AND status = 'available') = 0 THEN 'fully_occupied'
            ELSE 'partially_occupied'
          END
        WHERE id = $1`, [newBed.room_id]
      );

      // Update allocation record
      const updatedAlloc = await client.query(
        `UPDATE allocations
         SET bed_id = $1, room_id = $2, block_id = $3
         WHERE id = $4
         RETURNING *`,
        [new_bed_id, newBed.room_id, newBed.block_id, id]
      );

      await client.query('COMMIT');
      sendSuccess(res, updatedAlloc.rows[0], 'Student reallocated successfully');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// ─── Room Change Requests ─────────────────────────────────────────────────────

/**
 * GET /api/warden/room-change-requests
 */
exports.getRoomChangeRequests = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    let query = `
      SELECT rcr.*, u.full_name AS student_name, sp.usn,
             r.room_number AS current_room, b.block_name AS current_block,
             pb.block_name AS preferred_block_name
      FROM room_change_requests rcr
      JOIN allocations a ON a.id = rcr.current_allocation_id
      JOIN users u ON u.id = rcr.student_id
      LEFT JOIN student_profiles sp ON sp.user_id = rcr.student_id
      JOIN rooms r ON r.id = a.room_id
      JOIN blocks b ON b.id = a.block_id
      LEFT JOIN blocks pb ON pb.id = rcr.preferred_block_id
      WHERE b.hostel_id = $1
    `;
    const values = [hostel.id];
    let idx = 2;

    if (status) { query += ` AND rcr.status = $${idx++}`; values.push(status); }
    query += ` ORDER BY rcr.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    const countQ = status
      ? `SELECT COUNT(*) FROM room_change_requests rcr JOIN allocations a ON a.id = rcr.current_allocation_id JOIN rooms r ON r.id = a.room_id JOIN blocks b ON b.id = r.block_id WHERE b.hostel_id = $1 AND rcr.status = $2`
      : `SELECT COUNT(*) FROM room_change_requests rcr JOIN allocations a ON a.id = rcr.current_allocation_id JOIN rooms r ON r.id = a.room_id JOIN blocks b ON b.id = r.block_id WHERE b.hostel_id = $1`;
    const countResult = await pool.query(countQ, status ? [hostel.id, status] : [hostel.id]);

    sendSuccess(res, paginatedResponse(result.rows, countResult.rows[0].count, page, limit), 'Room change requests fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/warden/room-change-requests/:id/review
 * Body: { status: 'approved'|'rejected', review_notes, new_bed_id (if approved) }
 */
exports.reviewRoomChangeRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, review_notes, new_bed_id } = req.body;

    if (!isValidUUID(id)) return sendError(res, 'Invalid request ID.', 400);
    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, "Status must be 'approved' or 'rejected'.", 400);
    }

    const reqResult = await pool.query(`SELECT * FROM room_change_requests WHERE id = $1`, [id]);
    if (reqResult.rows.length === 0) return sendError(res, 'Request not found.', 404);
    const changeReq = reqResult.rows[0];

    if (changeReq.status !== 'pending') {
      return sendError(res, 'Request has already been reviewed.', 400);
    }

    // If approved and new_bed_id provided, perform reallocation
    if (status === 'approved' && new_bed_id) {
      if (!isValidUUID(new_bed_id)) return sendError(res, 'Invalid bed ID.', 400);
      // Reuse the reallocate logic by calling it directly (inline)
      req.params.id = changeReq.current_allocation_id;
      req.body.new_bed_id = new_bed_id;
      // We'll call pool directly here for simplicity
    }

    const updated = await pool.query(
      `UPDATE room_change_requests
       SET status = $1, reviewed_by = $2, review_notes = $3, reviewed_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, req.user.id, review_notes || null, id]
    );

    await notify.roomChangeReviewed(changeReq.student_id, id, status === 'approved');
    sendSuccess(res, updated.rows[0], `Room change request ${status}`);
  } catch (error) {
    next(error);
  }
};

// ─── Vacating Requests ────────────────────────────────────────────────────────

/**
 * GET /api/warden/vacating-requests
 */
exports.getVacatingRequests = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    let query = `
      SELECT vr.*, u.full_name AS student_name, sp.usn,
             r.room_number, b.block_name, bd.bed_number
      FROM vacating_requests vr
      JOIN allocations a ON a.id = vr.allocation_id
      JOIN users u ON u.id = vr.student_id
      LEFT JOIN student_profiles sp ON sp.user_id = vr.student_id
      JOIN rooms r ON r.id = a.room_id
      JOIN blocks b ON b.id = a.block_id
      JOIN beds bd ON bd.id = a.bed_id
      WHERE a.hostel_id = $1
    `;
    const values = [hostel.id];
    let idx = 2;

    if (status) { query += ` AND vr.status = $${idx++}`; values.push(status); }
    query += ` ORDER BY vr.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    sendSuccess(res, result.rows, 'Vacating requests fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/warden/vacating-requests/:id/review
 * Body: { status: 'approved'|'rejected', review_notes }
 * If approved, marks allocation as vacated and frees the bed
 */
exports.reviewVacatingRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    if (!isValidUUID(id)) return sendError(res, 'Invalid request ID.', 400);
    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, "Status must be 'approved' or 'rejected'.", 400);
    }

    const reqResult = await pool.query(`SELECT * FROM vacating_requests WHERE id = $1`, [id]);
    if (reqResult.rows.length === 0) return sendError(res, 'Request not found.', 404);
    const vacReq = reqResult.rows[0];
    if (vacReq.status !== 'pending') return sendError(res, 'Already reviewed.', 400);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE vacating_requests SET status=$1, reviewed_by=$2, review_notes=$3, reviewed_at=NOW() WHERE id=$4`,
        [status, req.user.id, review_notes || null, id]
      );

      if (status === 'approved') {
        // Get allocation details
        const allocResult = await client.query(`SELECT * FROM allocations WHERE id = $1`, [vacReq.allocation_id]);
        const alloc = allocResult.rows[0];

        // Mark allocation as vacated
        await client.query(
          `UPDATE allocations SET status='vacated', check_out_date=NOW() WHERE id=$1`,
          [alloc.id]
        );

        // Free the bed
        await client.query(`UPDATE beds SET status='available' WHERE id=$1`, [alloc.bed_id]);

        // Update room status
        await client.query(`
          UPDATE rooms SET status =
            CASE
              WHEN (SELECT COUNT(*) FROM beds WHERE room_id = $1 AND status = 'available') = capacity THEN 'available'
              ELSE 'partially_occupied'
            END
          WHERE id = $1`, [alloc.room_id]
        );
      }

      await client.query('COMMIT');
      await notify.vacatingApproved(vacReq.student_id, id);
      sendSuccess(res, null, `Vacating request ${status} successfully`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// ─── Transfer Requests ────────────────────────────────────────────────────────

/**
 * GET /api/warden/transfer-requests
 */
exports.getTransferRequests = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    let query = `
      SELECT tr.*, u.full_name AS student_name, sp.usn,
             h.name AS preferred_hostel_name
      FROM transfer_requests tr
      JOIN allocations a ON a.id = tr.current_allocation_id
      JOIN users u ON u.id = tr.student_id
      LEFT JOIN student_profiles sp ON sp.user_id = tr.student_id
      LEFT JOIN hostels h ON h.id = tr.preferred_hostel_id
      WHERE a.hostel_id = $1
    `;
    const values = [hostel.id];
    let idx = 2;

    if (status) { query += ` AND tr.status = $${idx++}`; values.push(status); }
    query += ` ORDER BY tr.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    sendSuccess(res, result.rows, 'Transfer requests fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/warden/transfer-requests/:id/review
 */
exports.reviewTransferRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, review_notes } = req.body;

    if (!isValidUUID(id)) return sendError(res, 'Invalid request ID.', 400);
    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, "Status must be 'approved' or 'rejected'.", 400);
    }

    const reqResult = await pool.query(`SELECT * FROM transfer_requests WHERE id = $1`, [id]);
    if (reqResult.rows.length === 0) return sendError(res, 'Request not found.', 404);
    const transReq = reqResult.rows[0];
    if (transReq.status !== 'pending') return sendError(res, 'Already reviewed.', 400);

    await pool.query(
      `UPDATE transfer_requests SET status=$1, reviewed_by=$2, review_notes=$3, reviewed_at=NOW() WHERE id=$4`,
      [status, req.user.id, review_notes || null, id]
    );

    await notify.transferReviewed(transReq.student_id, id, status === 'approved');
    sendSuccess(res, null, `Transfer request ${status} successfully`);
  } catch (error) {
    next(error);
  }
};

// ─── Complaints ───────────────────────────────────────────────────────────────

/**
 * GET /api/warden/complaints
 * List complaints in the warden's hostel with optional filters
 */
exports.getComplaints = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { page, limit, offset } = getPagination(req.query);
    const filters = {
      status: req.query.status || null,
      priority: req.query.priority || null,
      category: req.query.category || null,
    };

    const [complaints, total] = await Promise.all([
      ComplaintModel.findByHostelId(hostel.id, filters, limit, offset),
      ComplaintModel.countByHostelId(hostel.id, filters),
    ]);

    sendSuccess(res, paginatedResponse(complaints, total, page, limit), 'Complaints fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/warden/complaints/:id
 */
exports.getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, 'Invalid complaint ID.', 400);

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found.', 404);

    sendSuccess(res, complaint, 'Complaint fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/warden/complaints/:id/assign
 * Assign a complaint to a maintenance staff member
 * Body: { assigned_to (user_id), work_notes }
 */
exports.assignComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigned_to, work_notes } = req.body;

    if (!isValidUUID(id)) return sendError(res, 'Invalid complaint ID.', 400);
    if (!assigned_to || !isValidUUID(assigned_to)) return sendError(res, 'Valid assigned_to user ID required.', 400);

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found.', 404);

    const updated = await ComplaintModel.updateStatus(id, 'in_progress', {
      assignedTo: assigned_to,
      workNotes: work_notes || null,
    });

    // Notify the student
    await notify.complaintAssigned(complaint.student_id, id);

    sendSuccess(res, updated, 'Complaint assigned successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/warden/complaints/:id/status
 * Update complaint status manually
 * Body: { status, work_notes }
 */
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, work_notes } = req.body;

    if (!isValidUUID(id)) return sendError(res, 'Invalid complaint ID.', 400);

    const validStatuses = ['acknowledged', 'in_progress', 'on_hold', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found.', 404);

    const updated = await ComplaintModel.updateStatus(id, status, { workNotes: work_notes || null });

    if (status === 'resolved') {
      await notify.complaintResolved(complaint.student_id, id);
    }

    sendSuccess(res, updated, `Complaint status updated to '${status}'`);
  } catch (error) {
    next(error);
  }
};

// ─── Maintenance Staff ────────────────────────────────────────────────────────

/**
 * GET /api/warden/maintenance-staff
 * List all maintenance staff available for assignment
 */
exports.getMaintenanceStaff = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const result = await pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.phone,
         msp.employee_id, msp.category, msp.is_available,
         b.block_name AS assigned_block,
         (SELECT COUNT(*) FROM complaints c WHERE c.assigned_to = u.id AND c.status NOT IN ('resolved','closed')) AS active_complaints
       FROM users u
       JOIN maintenance_staff_profiles msp ON msp.user_id = u.id
       LEFT JOIN blocks b ON b.id = msp.assigned_block_id
       WHERE u.role = 'maintenance' AND u.is_active = true
       ORDER BY msp.is_available DESC, u.full_name`
    );

    sendSuccess(res, result.rows, 'Maintenance staff fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Occupancy ────────────────────────────────────────────────────────────────

/**
 * GET /api/warden/occupancy
 */
exports.getOccupancy = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const stats = await AllocationModel.getOccupancyStats(hostel.id);

    // Block-wise occupancy breakdown
    const blockBreakdown = await pool.query(
      `SELECT
         b.block_name, b.id AS block_id,
         COUNT(bd.id) AS total_beds,
         COUNT(bd.id) FILTER (WHERE bd.status = 'available') AS available_beds,
         COUNT(bd.id) FILTER (WHERE bd.status = 'occupied') AS occupied_beds
       FROM blocks b
       LEFT JOIN rooms r ON r.block_id = b.id
       LEFT JOIN beds bd ON bd.room_id = r.id
       WHERE b.hostel_id = $1 AND b.is_active = true
       GROUP BY b.block_name, b.id
       ORDER BY b.block_name`,
      [hostel.id]
    );

    sendSuccess(res, {
      hostel: { id: hostel.id, name: hostel.name },
      overall: stats,
      byBlock: blockBreakdown.rows,
    }, 'Occupancy data fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Announcements ────────────────────────────────────────────────────────────

/**
 * GET /api/warden/announcements
 */
exports.getAnnouncements = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { page, limit, offset } = getPagination(req.query);

    const result = await pool.query(
      `SELECT a.*, u.full_name AS posted_by_name
       FROM announcements a
       JOIN users u ON u.id = a.posted_by
       WHERE a.hostel_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [hostel.id, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM announcements WHERE hostel_id = $1`, [hostel.id]
    );

    sendSuccess(res, paginatedResponse(result.rows, countResult.rows[0].count, page, limit), 'Announcements fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/warden/announcements
 * Body: { title, content, priority, expires_at }
 */
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority, expires_at } = req.body;

    if (!title || !content) return sendError(res, 'Title and content are required.', 400);

    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const result = await pool.query(
      `INSERT INTO announcements (hostel_id, title, content, posted_by, priority, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [hostel.id, title.trim(), content.trim(), req.user.id, priority || 'normal', expires_at || null]
    );

    sendSuccess(res, result.rows[0], 'Announcement posted successfully', 201);
  } catch (error) {
    next(error);
  }
};

// ─── Reports ──────────────────────────────────────────────────────────────────

/**
 * GET /api/warden/reports/occupancy
 */
exports.getOccupancyReport = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const [overall, byRoomType, byBlock, timeline] = await Promise.all([
      AllocationModel.getOccupancyStats(hostel.id),

      // Occupancy by room type
      pool.query(`
        SELECT r.room_type,
               COUNT(bd.id) AS total_beds,
               COUNT(bd.id) FILTER (WHERE bd.status = 'occupied') AS occupied_beds,
               COUNT(bd.id) FILTER (WHERE bd.status = 'available') AS available_beds
        FROM rooms r
        JOIN blocks b ON r.block_id = b.id
        LEFT JOIN beds bd ON bd.room_id = r.id
        WHERE b.hostel_id = $1
        GROUP BY r.room_type`, [hostel.id]),

      // Occupancy by block
      pool.query(`
        SELECT b.block_name,
               COUNT(bd.id) AS total_beds,
               COUNT(bd.id) FILTER (WHERE bd.status = 'occupied') AS occupied_beds
        FROM blocks b
        LEFT JOIN rooms r ON r.block_id = b.id
        LEFT JOIN beds bd ON bd.room_id = r.id
        WHERE b.hostel_id = $1 AND b.is_active = true
        GROUP BY b.block_name ORDER BY b.block_name`, [hostel.id]),

      // Monthly allocation trend (last 6 months)
      pool.query(`
        SELECT DATE_TRUNC('month', allocation_date) AS month,
               COUNT(*) AS allocations
        FROM allocations
        WHERE hostel_id = $1
          AND allocation_date >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month`, [hostel.id]),
    ]);

    sendSuccess(res, {
      overall,
      byRoomType: byRoomType.rows,
      byBlock: byBlock.rows,
      monthlyTrend: timeline.rows,
    }, 'Occupancy report fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/warden/reports/allocations
 */
exports.getAllocationReport = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const { from, to } = req.query;

    let dateFilter = '';
    const values = [hostel.id];
    if (from) { dateFilter += ` AND a.allocation_date >= $${values.length + 1}`; values.push(from); }
    if (to)   { dateFilter += ` AND a.allocation_date <= $${values.length + 1}`; values.push(to); }

    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_allocations,
        COUNT(*) FILTER (WHERE a.status = 'active') AS active,
        COUNT(*) FILTER (WHERE a.status = 'vacated') AS vacated,
        COUNT(*) FILTER (WHERE a.status = 'transferred') AS transferred,
        MIN(a.allocation_date) AS earliest_allocation,
        MAX(a.allocation_date) AS latest_allocation
      FROM allocations a
      WHERE a.hostel_id = $1 ${dateFilter}`, values);

    sendSuccess(res, result.rows[0], 'Allocation report fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/warden/reports/maintenance
 */
exports.getMaintenanceReport = async (req, res, next) => {
  try {
    const hostel = await getWardenHostel(req.user.id);
    if (!hostel) return sendError(res, 'No hostel assigned.', 404);

    const [summary, byCategory, avgResolutionTime, byPriority] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE c.status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE c.status = 'in_progress') AS in_progress,
          COUNT(*) FILTER (WHERE c.status = 'resolved') AS resolved,
          COUNT(*) FILTER (WHERE c.status = 'closed') AS closed,
          ROUND(AVG(c.feedback_rating) FILTER (WHERE c.feedback_rating IS NOT NULL), 2) AS avg_rating
        FROM complaints c
        JOIN rooms r ON r.id = c.room_id
        JOIN blocks b ON b.id = r.block_id
        WHERE b.hostel_id = $1`, [hostel.id]),

      pool.query(`
        SELECT c.category, COUNT(*) AS count,
               COUNT(*) FILTER (WHERE c.status = 'resolved') AS resolved
        FROM complaints c
        JOIN rooms r ON r.id = c.room_id
        JOIN blocks b ON b.id = r.block_id
        WHERE b.hostel_id = $1
        GROUP BY c.category ORDER BY count DESC`, [hostel.id]),

      pool.query(`
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM (c.resolved_at - c.created_at))/3600), 2) AS avg_resolution_hours
        FROM complaints c
        JOIN rooms r ON r.id = c.room_id
        JOIN blocks b ON b.id = r.block_id
        WHERE b.hostel_id = $1 AND c.resolved_at IS NOT NULL`, [hostel.id]),

      pool.query(`
        SELECT c.priority, COUNT(*) AS count
        FROM complaints c
        JOIN rooms r ON r.id = c.room_id
        JOIN blocks b ON b.id = r.block_id
        WHERE b.hostel_id = $1
        GROUP BY c.priority`, [hostel.id]),
    ]);

    sendSuccess(res, {
      summary: summary.rows[0],
      byCategory: byCategory.rows,
      avgResolutionHours: avgResolutionTime.rows[0]?.avg_resolution_hours,
      byPriority: byPriority.rows,
    }, 'Maintenance report fetched');
  } catch (error) {
    next(error);
  }
};
