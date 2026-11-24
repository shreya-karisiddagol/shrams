const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getProfile, updateProfile, getWorkloadStats } = require('../controllers/staffController');
const { getAssignedTasks, getTaskDetail, updateTaskStatus, addWorkNote, getTaskHistory } = require('../controllers/taskController');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// All routes require a valid JWT and maintenance_staff role
router.use(authenticate, authorize('maintenance_staff'));

// Profile
router.get('/profile',        getProfile);
router.patch('/profile',      body('phone').optional().isMobilePhone(), validate, updateProfile);
router.get('/workload-stats', getWorkloadStats);

// Tasks
router.get('/tasks',                   getAssignedTasks);
router.get('/tasks/history',           getTaskHistory);
router.get('/tasks/:id',               getTaskDetail);
router.patch(
  '/tasks/:id/status',
  [
    body('status').isIn(['Acknowledged','In Progress','On Hold','Resolved']).withMessage('Invalid status.'),
    body('note').optional().isString(),
  ],
  validate,
  updateTaskStatus
);
router.post(
  '/tasks/:id/notes',
  body('note').notEmpty().withMessage('Note is required.'),
  validate,
  addWorkNote
);

// Notifications
router.get('/notifications',                   getNotifications);
router.patch('/notifications/mark-all-read',   markAllRead);
router.patch('/notifications/:id/read',        markRead);

module.exports = router;
