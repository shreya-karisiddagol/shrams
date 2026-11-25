/**
 * Warden Routes
 * All routes require authentication + warden role
 * Base: /api/warden
 */

const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const wardenController = require('../controllers/warden.controller');

// All warden routes require authentication + warden role
router.use(authMiddleware, requireRole('warden'));

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', wardenController.getDashboard);

// ─── Applications ─────────────────────────────────────────────────────────────
router.get('/applications', wardenController.getApplications);
router.get('/applications/:id', wardenController.getApplicationById);
router.put('/applications/:id/review', wardenController.reviewApplication);

// ─── Students ─────────────────────────────────────────────────────────────────
router.get('/students', wardenController.getStudents);
router.get('/students/:id', wardenController.getStudentById);

// ─── Rooms ────────────────────────────────────────────────────────────────────
router.get('/rooms', wardenController.getAvailableRooms);
router.get('/rooms/layout', wardenController.getRoomLayout);

// ─── Allocations ──────────────────────────────────────────────────────────────
router.get('/allocations', wardenController.getAllocations);
router.get('/allocations/:id', wardenController.getAllocationById);
router.post('/allocations', wardenController.createAllocation);
router.post('/allocations/auto-allocate', wardenController.autoAllocate);
router.put('/allocations/:id/reallocate', wardenController.reallocateStudent);

// ─── Room Change Requests ─────────────────────────────────────────────────────
router.get('/room-change-requests', wardenController.getRoomChangeRequests);
router.put('/room-change-requests/:id/review', wardenController.reviewRoomChangeRequest);

// ─── Vacating Requests ────────────────────────────────────────────────────────
router.get('/vacating-requests', wardenController.getVacatingRequests);
router.put('/vacating-requests/:id/review', wardenController.reviewVacatingRequest);

// ─── Transfer Requests ────────────────────────────────────────────────────────
router.get('/transfer-requests', wardenController.getTransferRequests);
router.put('/transfer-requests/:id/review', wardenController.reviewTransferRequest);

// ─── Complaints ───────────────────────────────────────────────────────────────
router.get('/complaints', wardenController.getComplaints);
router.get('/complaints/:id', wardenController.getComplaintById);
router.put('/complaints/:id/assign', wardenController.assignComplaint);
router.put('/complaints/:id/status', wardenController.updateComplaintStatus);

// ─── Maintenance Staff ────────────────────────────────────────────────────────
router.get('/maintenance-staff', wardenController.getMaintenanceStaff);

// ─── Occupancy & Layout ───────────────────────────────────────────────────────
router.get('/occupancy', wardenController.getOccupancy);

// ─── Announcements ────────────────────────────────────────────────────────────
router.get('/announcements', wardenController.getAnnouncements);
router.post('/announcements', wardenController.createAnnouncement);
router.delete('/announcements/:id', wardenController.deleteAnnouncement);

// ─── Reports ──────────────────────────────────────────────────────────────────
router.get('/reports/occupancy', wardenController.getOccupancyReport);
router.get('/reports/allocations', wardenController.getAllocationReport);
router.get('/reports/maintenance', wardenController.getMaintenanceReport);

module.exports = router;
