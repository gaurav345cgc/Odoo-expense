const authMiddleware = require('./authMiddleware');
const authorizeRoles = require('./roleMiddleware');
const errorHandler = require('./errorHandler');

// Export all middlewares from a single point
module.exports = {
  authMiddleware,
  authorizeRoles,
  errorHandler,
};