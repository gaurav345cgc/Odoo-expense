const ApiResponse = require('../utils/apiResponse');

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error(`Role: ${req.user.role} is not authorized to access this resource`);
      error.statusCode = 403; // Forbidden
      return next(error);
    }
    next();
  };
};

module.exports = authorizeRoles;
