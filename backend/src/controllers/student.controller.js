/**
 * Student Controller
 * Full implementations for all student-facing API endpoints
 */

const pool = require('../config/db');
const StudentModel = require('../models/student.model');
const HostelModel = require('../models/hostel.model');
const ApplicationModel = require('../models/application.model');
const AllocationModel = require('../models/allocation.model');
const ComplaintModel = require('../models/complaint.model');
const NotificationModel = require('../models/notification.model');
const { notify } = require('../utils/notifications');
const {
  getPagination, paginatedResponse, sendSuccess, sendError,
  getCurrentAcademicYear, isValidUUID,
} = require('../utils/helpers');

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * GET /api/student/profile
 * Returns full student profile (user + student_profiles join)
 */
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await StudentModel.findByUserId(req.user.id);
    if (!profile) return sendError(res, 'Profile not found.', 404);
    sendSuccess(res, profile, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/student/profile
 * Update student profile fields (non-sensitive)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const {
      full_name, department, semester, gender, date_of_birth,
      address, parent_name, parent_phone, parent_email,
      emergency_contact, blood_group,
    } = req.body;

    // Update user full_name if provided
    if (full_name) {
      await pool.query(
        'UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2',
        [full_name, req.user.id]
      );
    }

    const updatedProfile = await StudentModel.updateProfile(req.user.id, {
      department, semester, gender, date_of_birth, address,
      parent_name, parent_phone, parent_email, emergency_contact, blood_group,
    });

    sendSuccess(res, updatedProfile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/student/profile/photo
 * Upload and update profile photo
 */
exports.updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image file provided.', 400);
    }

    const photoPath = `/uploads/profiles/${req.file.filename}`;

    await StudentModel.updateProfile(req.user.id, { profile_photo: photoPath });
    sendSuccess(res, { profile_photo: photoPath }, 'Profile photo updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/student/profile/contact
 * Update contact information (phone, email)
 */
exports.updateContact = async (req, res, next) => {
  try {
    const { phone, emergency_contact, parent_phone } = req.body;

    if (phone) {
      await pool.query(
        'UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2',
        [phone, req.user.id]
      );
    }

    await StudentModel.updateProfile(req.user.id, {
      emergency_contact: emergency_contact || undefined,
      parent_phone: parent_phone || undefined,
    });

    sendSuccess(res, null, 'Contact information updated successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Hostels ──────────────────────────────────────────────────────────────────

/**
 * GET /api/student/hostels
 * Returns list of active hostels with availability stats
 */
exports.getHostels = async (req, res, next) => {
  try {
    const hostels = await HostelModel.findAll();
    sendSuccess(res, hostels, 'Hostels fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/hostels/:hostelId/rooms
 * Returns available rooms for a specific hostel
 */
exports.getRoomsByHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    if (!isValidUUID(hostelId)) return sendError(res, 'Invalid hostel ID.', 400);

    const { room_type } = req.query;
    const rooms = await HostelModel.getAvailableRooms(hostelId, room_type || null);
    sendSuccess(res, rooms, 'Available rooms fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/hostels/:hostelId/blocks
 * Returns blocks for a specific hostel
 */
exports.getBlocksByHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    if (!isValidUUID(hostelId)) return sendError(res, 'Invalid hostel ID.', 400);

    const result = await pool.query(
      'SELECT id, block_name, total_floors FROM blocks WHERE hostel_id = $1 AND is_active = true ORDER BY block_name ASC',
      [hostelId]
    );
    sendSuccess(res, result.rows, 'Blocks fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Applications ─────────────────────────────────────────────────────────────

/**
 * GET /api/student/applications
 * List all hostel applications by this student
 */
exports.getApplications = async (req, res, next) => {
  try {
    const { limit, offset } = getPagination(req.query);
    const applications = await ApplicationModel.findByStudentId(req.user.id, limit, offset);
    sendSuccess(res, applications, 'Applications fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/student/applications
 * Submit a new hostel application
 */
exports.createApplication = async (req, res, next) => {
  try {
    const { preferred_hostel_id, preferred_room_type, preferred_block_id, reason, semester } = req.body;

    if (!preferred_hostel_id) return sendError(res, 'Preferred hostel is required.', 400);
    if (!isValidUUID(preferred_hostel_id)) return sendError(res, 'Invalid hostel ID.', 400);

    // Check if student already has a pending/approved application
    const existing = await pool.query(
      `SELECT id FROM hostel_applications
       WHERE student_id = $1 AND status IN ('pending','approved','waitlisted')`,
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return sendError(res, 'You already have an active application pending.', 409);
    }

    // Check if student already has an active allocation
    const activeAllocation = await pool.query(
      `SELECT id FROM allocations WHERE student_id = $1 AND status = 'active'`,
      [req.user.id]
    );
    if (activeAllocation.rows.length > 0) {
      return sendError(res, 'You already have an active room allocation.', 409);
    }

    const application = await ApplicationModel.create({
      student_id: req.user.id,
      preferred_hostel_id,
      preferred_room_type: preferred_room_type || null,
      preferred_block_id: preferred_block_id || null,
      reason: reason || null,
      academic_year: getCurrentAcademicYear(),
      semester: semester || null,
    });

    sendSuccess(res, application, 'Application submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/applications/:id
 * Get a specific application by ID
 */
exports.getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, 'Invalid application ID.', 400);

    const application = await ApplicationModel.findById(id);
    if (!application) return sendError(res, 'Application not found.', 404);

    // Ensure student can only view their own applications
    if (application.student_id !== req.user.id) {
      return sendError(res, 'Access denied.', 403);
    }

    sendSuccess(res, application, 'Application fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Allocation ───────────────────────────────────────────────────────────────

/**
 * GET /api/student/allocation
 * Get current active room allocation for the student
 */
exports.getCurrentAllocation = async (req, res, next) => {
  try {
    const allocation = await AllocationModel.findActiveByStudentId(req.user.id);
    if (!allocation) return sendError(res, 'No active allocation found.', 404);
    sendSuccess(res, allocation, 'Current allocation fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/allocation/history
 * Get allocation history for the student
 */
exports.getAllocationHistory = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const [history, total] = await Promise.all([
      AllocationModel.findHistoryByStudentId(req.user.id, limit, offset),
      AllocationModel.countByStudentId(req.user.id),
    ]);
    sendSuccess(res, paginatedResponse(history, total, page, limit), 'Allocation history fetched');
  } catch (error) {
    next(error);
  }
};

// ─── Room-related Requests ────────────────────────────────────────────────────

/**
 * POST /api/student/allocation/room-change-request
 * Submit a room change request (must have active allocation)
 */
exports.createRoomChangeRequest = async (req, res, next) => {
  try {
    const { preferred_room_type, preferred_block_id, reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return sendError(res, 'Reason for room change is required.', 400);
    }

    // Must have active allocation
    const allocation = await AllocationModel.findActiveByStudentId(req.user.id);
    if (!allocation) return sendError(res, 'No active allocation found. You must be allocated a room first.', 400);

    // Check for existing pending request
    const existing = await pool.query(
      `SELECT id FROM room_change_requests WHERE student_id = $1 AND status = 'pending'`,
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return sendError(res, 'You already have a pending room change request.', 409);
    }

    const result = await pool.query(
      `INSERT INTO room_change_requests
         (student_id, current_allocation_id, preferred_room_type, preferred_block_id, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, allocation.id, preferred_room_type || null, preferred_block_id || null, reason.trim()]
    );

    sendSuccess(res, result.rows[0], 'Room change request submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/student/allocation/vacating-request
 * Submit a vacating request
 */
exports.createVacatingRequest = async (req, res, next) => {
  try {
    const { reason, expected_vacating_date } = req.body;

    if (!reason || reason.trim().length === 0) {
      return sendError(res, 'Reason for vacating is required.', 400);
    }

    const allocation = await AllocationModel.findActiveByStudentId(req.user.id);
    if (!allocation) return sendError(res, 'No active allocation found.', 400);

    // Check for existing pending request
    const existing = await pool.query(
      `SELECT id FROM vacating_requests WHERE student_id = $1 AND status = 'pending'`,
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return sendError(res, 'You already have a pending vacating request.', 409);
    }

    const result = await pool.query(
      `INSERT INTO vacating_requests
         (student_id, allocation_id, reason, expected_vacating_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, allocation.id, reason.trim(), expected_vacating_date || null]
    );

    sendSuccess(res, result.rows[0], 'Vacating request submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/student/allocation/transfer-request
 * Submit a hostel transfer request
 */
exports.createTransferRequest = async (req, res, next) => {
  try {
    const { preferred_hostel_id, reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return sendError(res, 'Reason for transfer is required.', 400);
    }
    if (!preferred_hostel_id || !isValidUUID(preferred_hostel_id)) {
      return sendError(res, 'Valid preferred hostel ID is required.', 400);
    }

    const allocation = await AllocationModel.findActiveByStudentId(req.user.id);
    if (!allocation) return sendError(res, 'No active allocation found.', 400);

    const existing = await pool.query(
      `SELECT id FROM transfer_requests WHERE student_id = $1 AND status = 'pending'`,
      [req.user.id]
    );
    if (existing.rows.length > 0) {
      return sendError(res, 'You already have a pending transfer request.', 409);
    }

    const result = await pool.query(
      `INSERT INTO transfer_requests
         (student_id, current_allocation_id, preferred_hostel_id, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, allocation.id, preferred_hostel_id, reason.trim()]
    );

    sendSuccess(res, result.rows[0], 'Transfer request submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

// ─── Complaints ───────────────────────────────────────────────────────────────

/**
 * GET /api/student/complaints
 * List complaints filed by this student
 */
exports.getComplaints = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    const [complaints, total] = await Promise.all([
      ComplaintModel.findByStudentId(req.user.id, limit, offset, status || null),
      ComplaintModel.countByStudentId(req.user.id, status || null),
    ]);

    sendSuccess(res, paginatedResponse(complaints, total, page, limit), 'Complaints fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/student/complaints
 * File a new maintenance complaint
 * Requires student to have an active allocation (to know room_id)
 */
exports.createComplaint = async (req, res, next) => {
  try {
    const { category, title, description, priority } = req.body;

    if (!category || !title) return sendError(res, 'Category and title are required.', 400);

    // Get student's current allocation to find room
    const allocation = await AllocationModel.findActiveByStudentId(req.user.id);
    if (!allocation) {
      return sendError(res, 'You must have an active room allocation to file a complaint.', 400);
    }

    // Build image paths array from uploaded files
    const images = req.files
      ? req.files.map((f) => `/uploads/complaints/${f.filename}`)
      : null;

    const complaint = await ComplaintModel.create({
      student_id: req.user.id,
      room_id: allocation.room_id,
      category: category.trim(),
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: priority || 'medium',
      images,
    });

    sendSuccess(res, complaint, 'Complaint filed successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/complaints/:id
 * Get details of a specific complaint
 */
exports.getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, 'Invalid complaint ID.', 400);

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found.', 404);
    if (complaint.student_id !== req.user.id) return sendError(res, 'Access denied.', 403);

    sendSuccess(res, complaint, 'Complaint fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/student/complaints/:id/reopen
 * Reopen a resolved/closed complaint
 */
exports.reopenComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, 'Invalid complaint ID.', 400);

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found.', 404);
    if (complaint.student_id !== req.user.id) return sendError(res, 'Access denied.', 403);

    if (!['resolved', 'closed'].includes(complaint.status)) {
      return sendError(res, `Cannot reopen a complaint with status '${complaint.status}'.`, 400);
    }

    const updated = await ComplaintModel.updateStatus(id, 'reopened');
    sendSuccess(res, updated, 'Complaint reopened successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/student/complaints/:id/feedback
 * Submit feedback rating for a resolved complaint
 */
exports.submitComplaintFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!isValidUUID(id)) return sendError(res, 'Invalid complaint ID.', 400);
    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, 'Rating must be between 1 and 5.', 400);
    }

    const complaint = await ComplaintModel.findById(id);
    if (!complaint) return sendError(res, 'Complaint not found.', 404);
    if (complaint.student_id !== req.user.id) return sendError(res, 'Access denied.', 403);
    if (!['resolved', 'closed'].includes(complaint.status)) {
      return sendError(res, 'Feedback can only be submitted for resolved complaints.', 400);
    }

    const updated = await ComplaintModel.submitFeedback(id, parseInt(rating, 10), comment || null);
    if (!updated) return sendError(res, 'Could not submit feedback.', 400);

    sendSuccess(res, updated, 'Feedback submitted successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Notifications ────────────────────────────────────────────────────────────

/**
 * GET /api/student/notifications
 * Get all notifications for the student
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const [notifications, total, unread] = await Promise.all([
      NotificationModel.findByUserId(req.user.id, limit, offset),
      NotificationModel.countByUserId(req.user.id),
      NotificationModel.countUnread(req.user.id),
    ]);

    sendSuccess(res, {
      ...paginatedResponse(notifications, total, page, limit),
      unreadCount: unread,
    }, 'Notifications fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/student/notifications/:id/read
 * Mark a single notification as read
 */
exports.markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) return sendError(res, 'Invalid notification ID.', 400);

    const updated = await NotificationModel.markAsRead(id, req.user.id);
    if (!updated) return sendError(res, 'Notification not found.', 404);

    sendSuccess(res, updated, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/student/notifications/read-all
 * Mark all notifications as read
 */
exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await NotificationModel.markAllAsRead(req.user.id);
    sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

// ─── Announcements ────────────────────────────────────────────────────────────

/**
 * GET /api/student/announcements
 * Get announcements relevant to the student's hostel
 */
exports.getAnnouncements = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    // Find student's current hostel (via active allocation)
    const allocation = await AllocationModel.findActiveByStudentId(req.user.id);

    let query;
    let values;

    if (allocation) {
      // Show announcements for their hostel + global announcements (hostel_id IS NULL)
      query = `
        SELECT a.*, u.full_name AS posted_by_name, h.name AS hostel_name
        FROM announcements a
        LEFT JOIN users u ON u.id = a.posted_by
        LEFT JOIN hostels h ON h.id = a.hostel_id
        WHERE (a.hostel_id = $1 OR a.hostel_id IS NULL)
          AND (a.expires_at IS NULL OR a.expires_at > NOW())
        ORDER BY
          CASE a.priority WHEN 'urgent' THEN 1 WHEN 'important' THEN 2 ELSE 3 END,
          a.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      values = [allocation.hostel_id, limit, offset];
    } else {
      // No allocation — show only global announcements
      query = `
        SELECT a.*, u.full_name AS posted_by_name
        FROM announcements a
        LEFT JOIN users u ON u.id = a.posted_by
        WHERE a.hostel_id IS NULL
          AND (a.expires_at IS NULL OR a.expires_at > NOW())
        ORDER BY a.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      values = [limit, offset];
    }

    const result = await pool.query(query, values);

    // Count for pagination
    const countResult = await pool.query(
      allocation
        ? `SELECT COUNT(*) FROM announcements WHERE (hostel_id = $1 OR hostel_id IS NULL) AND (expires_at IS NULL OR expires_at > NOW())`
        : `SELECT COUNT(*) FROM announcements WHERE hostel_id IS NULL AND (expires_at IS NULL OR expires_at > NOW())`,
      allocation ? [allocation.hostel_id] : []
    );

    sendSuccess(
      res,
      paginatedResponse(result.rows, countResult.rows[0].count, page, limit),
      'Announcements fetched'
    );
  } catch (error) {
    next(error);
  }
};
