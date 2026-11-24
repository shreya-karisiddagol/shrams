const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createComplaint, getComplaintById, getCategories } = require('../controllers/complaintController');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// Public (authenticated any role)
router.get('/categories', authenticate, getCategories);

// Student creates complaint
router.post(
  '/',
  authenticate,
  authorize('student'),
  upload.array('images', 5),
  [
    body('room_id').notEmpty().isUUID(),
    body('hostel_id').notEmpty().isUUID(),
    body('category_id').notEmpty().isInt(),
    body('title').notEmpty().isLength({ max: 200 }),
    body('description').notEmpty(),
    body('priority').optional().isIn(['low','medium','high','critical']),
  ],
  validate,
  createComplaint
);

// Any authenticated role can view a specific complaint
router.get('/:id', authenticate, getComplaintById);

module.exports = router;
