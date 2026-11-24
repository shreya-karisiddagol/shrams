/**
 * General Helper Utilities
 * Pagination, response formatting, and miscellaneous helpers
 */

/**
 * Parse and validate pagination parameters from query string
 * @param {Object} query - req.query object
 * @param {number} [defaultLimit=10] - Default page size
 * @param {number} [maxLimit=100] - Maximum allowed page size
 * @returns {{ page, limit, offset }}
 */
const getPagination = (query, defaultLimit = 10, maxLimit = 100) => {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || defaultLimit;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > maxLimit) limit = maxLimit;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

/**
 * Build a standard paginated response object
 * @param {Array} data - Current page results
 * @param {number} totalCount - Total number of records
 * @param {number} page - Current page number
 * @param {number} limit - Page size
 * @returns {Object}
 */
const paginatedResponse = (data, totalCount, page, limit) => ({
  data,
  pagination: {
    total: parseInt(totalCount, 10),
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
    hasNextPage: page * limit < totalCount,
    hasPrevPage: page > 1,
  },
});

/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {*} data - Response payload
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
  });
};

/**
 * Standard error response (use next(err) for global handler instead when possible)
 * @param {Object} res - Express response object
 * @param {string} message
 * @param {number} [statusCode=400]
 * @param {*} [errors] - Optional validation error details
 */
const sendError = (res, message, statusCode = 400, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  res.status(statusCode).json(response);
};

/**
 * Format express-validator errors into a clean object
 * @param {Array} validationErrors - result.array() from express-validator
 * @returns {Object} - { fieldName: 'error message' }
 */
const formatValidationErrors = (validationErrors) => {
  return validationErrors.reduce((acc, err) => {
    if (!acc[err.path]) acc[err.path] = err.msg;
    return acc;
  }, {});
};

/**
 * Remove sensitive fields from user object before sending to client
 * @param {Object} user
 * @returns {Object}
 */
const sanitizeUser = (user) => {
  const { password_hash, reset_token, reset_token_expires, ...safe } = user;
  return safe;
};

/**
 * Generate a random alphanumeric token of given length
 * Used for password reset tokens, etc.
 * @param {number} length
 * @returns {string}
 */
const generateToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Calculate current academic year string, e.g. "2024-2025"
 * Academic year starts in August
 */
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

/**
 * Check if a string is a valid UUID v4
 */
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Build a dynamic UPDATE query from an object of field:value pairs
 * Skips undefined values
 * @param {Object} fields - { fieldName: value }
 * @param {number} startParamIndex - Starting $N index (for prepended WHERE clauses)
 * @returns {{ setClauses: string, values: Array, nextIndex: number }}
 */
const buildUpdateQuery = (fields, startParamIndex = 1) => {
  const setClauses = [];
  const values = [];
  let idx = startParamIndex;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      setClauses.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  return { setClauses: setClauses.join(', '), values, nextIndex: idx };
};

module.exports = {
  getPagination,
  paginatedResponse,
  sendSuccess,
  sendError,
  formatValidationErrors,
  sanitizeUser,
  generateToken,
  getCurrentAcademicYear,
  isValidUUID,
  buildUpdateQuery,
};
