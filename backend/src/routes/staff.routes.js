const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const staffController = require('../controllers/staff.controller');

// Require authentication and maintenance role
router.use(authMiddleware, requireRole('maintenance'));

// Profile
router.get('/profile', staffController.getProfile);
router.patch('/profile', staffController.updateProfile);
router.get('/workload-stats', staffController.getWorkloadStats);

// Tasks
router.get('/tasks', staffController.getAssignedTasks);
router.get('/tasks/history', staffController.getTaskHistory);
router.get('/tasks/:id', staffController.getTaskDetail);
router.patch('/tasks/:id/status', staffController.updateTaskStatus);
router.post('/tasks/:id/notes', staffController.addWorkNote);

module.exports = router;
