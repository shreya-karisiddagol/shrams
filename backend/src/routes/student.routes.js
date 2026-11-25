/**
 * Student Routes
 * All routes require authentication and student role
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { uploadComplaintImages, uploadProfilePhoto } = require('../middleware/upload');
const studentController = require('../controllers/student.controller');

// All student routes require authentication + student role
router.use(authMiddleware, requireRole('student'));

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.put('/profile/photo', uploadProfilePhoto, studentController.updateProfilePhoto);
router.put('/profile/contact', studentController.updateContact);

// ─── Hostels ──────────────────────────────────────────────────────────────────
router.get('/hostels', studentController.getHostels);
router.get('/hostels/:hostelId/blocks', studentController.getBlocksByHostel);
router.get('/hostels/:hostelId/rooms', studentController.getRoomsByHostel);

// ─── Applications ─────────────────────────────────────────────────────────────
router.get('/applications', studentController.getApplications);
router.post('/applications', studentController.createApplication);
router.get('/applications/:id', studentController.getApplicationById);

// ─── Allocation ───────────────────────────────────────────────────────────────
router.get('/allocation', studentController.getCurrentAllocation);
router.get('/allocation/history', studentController.getAllocationHistory);

// ─── Room Requests ────────────────────────────────────────────────────────────
router.post('/allocation/room-change-request', studentController.createRoomChangeRequest);
router.post('/allocation/vacating-request', studentController.createVacatingRequest);
router.post('/allocation/transfer-request', studentController.createTransferRequest);

// ─── Complaints ───────────────────────────────────────────────────────────────
router.get('/complaints', studentController.getComplaints);
router.post('/complaints', uploadComplaintImages, studentController.createComplaint);
router.get('/complaints/:id', studentController.getComplaintById);
router.put('/complaints/:id/reopen', studentController.reopenComplaint);
router.put('/complaints/:id/feedback', studentController.submitComplaintFeedback);

// ─── Notifications ────────────────────────────────────────────────────────────
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationRead);
router.put('/notifications/read-all', studentController.markAllNotificationsRead);

// ─── Announcements ────────────────────────────────────────────────────────────
router.get('/announcements', studentController.getAnnouncements);

module.exports = router;
