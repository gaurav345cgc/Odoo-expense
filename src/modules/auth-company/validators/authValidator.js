const { body, validationResult } = require('express-validator');
const ApiResponse = require('../../../utils/apiResponse');

const signupValidationRules = () => {
  return [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('country').notEmpty().withMessage('Country is required'),
  ];
};

const loginValidationRules = () => {
  return [
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ];
};

// Middleware to check for validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(422).json(new ApiResponse(422, { errors: extractedErrors }, 'Validation failed'));
};

module.exports = {
  signupValidationRules,
  loginValidationRules,
  validate,
};
