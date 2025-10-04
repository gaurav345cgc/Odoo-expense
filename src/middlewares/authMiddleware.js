const jwt = require('jsonwebtoken');
const User = require('../modules/auth-company/models/User');
const ApiResponse = require('../utils/apiResponse');

const authMiddleware = async (req, res, next) => {
  let token;
  
  // Check for the token in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];
      
      // Verify the token using our secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find the user by the ID from the token's payload
      // and attach it to the request object for future use
      req.user = await User.findById(decoded.user.id).select('-password');
      
      if (!req.user) {
         return res.status(401).json(new ApiResponse(401, null, 'Not authorized, user not found'));
      }

      next(); // Proceed to the protected route
    } catch (error) {
      return res.status(401).json(new ApiResponse(401, null, 'Not authorized, token failed'));
    }
  }

  if (!token) {
    return res.status(401).json(new ApiResponse(401, null, 'Not authorized, no token'));
  }
};

module.exports = authMiddleware;
