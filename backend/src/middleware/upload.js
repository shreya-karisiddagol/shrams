/**
 * Multer Upload Middleware
 * Handles multipart/form-data image uploads
 * - Max 5 images per request
 * - Max 5MB per image
 * - Only image MIME types allowed
 * - Files saved to /uploads/<subfolder>/
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Ensure the upload directory exists; create it if not
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Disk storage configuration
 * Files are stored as: uploads/<destination>/<timestamp>-<originalname>
 */
const createStorage = (destination) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '../../uploads', destination);
      ensureDir(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });

/**
 * File filter: allow only images
 */
const imageFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

/**
 * Upload middleware for complaint images (up to 5 images)
 */
const uploadComplaintImages = multer({
  storage: createStorage('complaints'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,                   // Max 5 files
  },
}).array('images', 5);

/**
 * Upload middleware for profile photos (single image)
 */
const uploadProfilePhoto = multer({
  storage: createStorage('profiles'),
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
}).single('profile_photo');

/**
 * Wrapper to handle Multer errors gracefully and pass to Express error handler
 */
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5MB per image.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, message: 'Too many files. Maximum 5 images allowed.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: err.field || 'Only image files are allowed.' });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }

    // Non-multer error
    next(err);
  });
};

module.exports = {
  uploadComplaintImages: handleUpload(uploadComplaintImages),
  uploadProfilePhoto: handleUpload(uploadProfilePhoto),
};
