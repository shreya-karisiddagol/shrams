/**
 * Notification Utility
 * Creates notification records in the database
 */

const pool = require('../config/db');

/**
 * Create a single notification for a user
 * @param {Object} options
 * @param {string} options.userId - Recipient user UUID
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification body text
 * @param {string} [options.type='info'] - Type: info | success | warning | error
 * @param {string} [options.relatedId] - UUID of related entity (e.g. application ID)
 * @param {string} [options.relatedType] - Entity type (e.g. 'application', 'allocation', 'complaint')
 * @param {Object} [options.client] - Optional pg client for use inside transactions
 */
const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  relatedId = null,
  relatedType = null,
  client = null,
}) => {
  try {
    const query = `
      INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [userId, title, message, type, relatedId, relatedType];

    // Use provided transaction client or default pool
    const db = client || pool;
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    // Don't throw — notification failure should not break main flow
    console.error('Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Create notifications for multiple users at once
 * @param {Array<Object>} notifications - Array of notification option objects
 * @param {Object} [client] - Optional pg client for use inside transactions
 */
const createBulkNotifications = async (notifications, client = null) => {
  const promises = notifications.map((n) => createNotification({ ...n, client }));
  return Promise.allSettled(promises);
};

/**
 * Notify all students in a hostel (via their current allocations)
 * @param {string} hostelId
 * @param {string} title
 * @param {string} message
 * @param {string} type
 */
const notifyHostelStudents = async (hostelId, title, message, type = 'info') => {
  try {
    // Get all active students in the hostel
    const result = await pool.query(
      `SELECT DISTINCT a.student_id
       FROM allocations a
       WHERE a.hostel_id = $1 AND a.status = 'active'`,
      [hostelId]
    );

    const notifications = result.rows.map((row) => ({
      userId: row.student_id,
      title,
      message,
      type,
    }));

    return createBulkNotifications(notifications);
  } catch (error) {
    console.error('Failed to notify hostel students:', error.message);
  }
};

// ─── Pre-built Notification Templates ────────────────────────────────────────

const notify = {
  applicationApproved: (userId, applicationId) =>
    createNotification({
      userId,
      title: 'Application Approved ✅',
      message: 'Your hostel application has been approved! You will be allocated a room soon.',
      type: 'success',
      relatedId: applicationId,
      relatedType: 'application',
    }),

  applicationRejected: (userId, applicationId, reason) =>
    createNotification({
      userId,
      title: 'Application Rejected ❌',
      message: `Your hostel application was rejected. Reason: ${reason || 'Not specified.'}`,
      type: 'error',
      relatedId: applicationId,
      relatedType: 'application',
    }),

  applicationWaitlisted: (userId, applicationId) =>
    createNotification({
      userId,
      title: 'Application Waitlisted ⏳',
      message: 'Your hostel application has been placed on the waitlist. We will notify you when a spot opens.',
      type: 'warning',
      relatedId: applicationId,
      relatedType: 'application',
    }),

  roomAllocated: (userId, allocationId, roomNumber) =>
    createNotification({
      userId,
      title: 'Room Allocated 🏠',
      message: `You have been allocated Room ${roomNumber}. Please check your allocation details.`,
      type: 'success',
      relatedId: allocationId,
      relatedType: 'allocation',
    }),

  complaintAssigned: (userId, complaintId) =>
    createNotification({
      userId,
      title: 'Complaint Assigned 🔧',
      message: 'Your maintenance complaint has been assigned to a staff member and is being addressed.',
      type: 'info',
      relatedId: complaintId,
      relatedType: 'complaint',
    }),

  taskAssignedToStaff: (userId, complaintId, taskTitle) =>
    createNotification({
      userId,
      title: 'New Maintenance Task Assigned 🔧',
      message: `You have been assigned a new task: ${taskTitle || 'Maintenance task'}.`,
      type: 'info',
      relatedId: complaintId,
      relatedType: 'complaint',
    }),

  complaintResolved: (userId, complaintId) =>
    createNotification({
      userId,
      title: 'Complaint Resolved ✅',
      message: 'Your maintenance complaint has been marked as resolved. Please provide feedback.',
      type: 'success',
      relatedId: complaintId,
      relatedType: 'complaint',
    }),

  roomChangeReviewed: (userId, requestId, approved) =>
    createNotification({
      userId,
      title: approved ? 'Room Change Approved ✅' : 'Room Change Rejected ❌',
      message: approved
        ? 'Your room change request has been approved. Your new room will be allocated shortly.'
        : 'Your room change request has been rejected.',
      type: approved ? 'success' : 'error',
      relatedId: requestId,
      relatedType: 'room_change_request',
    }),

  vacatingApproved: (userId, requestId) =>
    createNotification({
      userId,
      title: 'Vacating Request Approved ✅',
      message: 'Your vacating request has been approved. Please complete check-out formalities.',
      type: 'success',
      relatedId: requestId,
      relatedType: 'vacating_request',
    }),

  transferReviewed: (userId, requestId, approved) =>
    createNotification({
      userId,
      title: approved ? 'Transfer Request Approved ✅' : 'Transfer Request Rejected ❌',
      message: approved
        ? 'Your transfer request has been approved.'
        : 'Your transfer request has been rejected.',
      type: approved ? 'success' : 'error',
      relatedId: requestId,
      relatedType: 'transfer_request',
    }),
};

module.exports = { createNotification, createBulkNotifications, notifyHostelStudents, notify };
