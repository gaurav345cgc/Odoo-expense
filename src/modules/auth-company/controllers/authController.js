const authService = require('../services/authService');
const ApiResponse = require('../../../utils/apiResponse');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, country } = req.body;
    
    // Call the service to handle all the business logic
    const result = await authService.signupUser({ name, email, password, country });
    
    res.status(201).json(new ApiResponse(201, result, 'User registered successfully'));
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Call the service to handle the login logic
    const result = await authService.loginUser({ email, password });

    res.status(200).json(new ApiResponse(200, result, 'User logged in successfully'));
  } catch (error) {
    next(error);
  }
};
