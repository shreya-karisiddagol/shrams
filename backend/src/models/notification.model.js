/**
 * Notification Model
 * Query helpers for the notifications table
 */

const pool = require('../config/db');

const NotificationModel = {
  /**
   * Get notifications for a user (paginated, newest first)
   */
  findByUserId: async (userId, limit, offset) => {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  /**
   * Count total notifications for a user
   */
  countByUserId: async (userId) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Count unread notifications for a user
   */
  countUnread: async (userId) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead: async (notificationId, userId) => {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [notificationId, userId]
    );
    return result.rows[0] || null;
  },

  /**
   * Mark all notifications for a user as read
   */
  markAllAsRead: async (userId) => {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );
  },
};

module.exports = NotificationModel;
