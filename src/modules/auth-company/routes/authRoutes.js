 
const express = require('express');
const { signup, login } = require('../controllers/authController');
const { signupValidationRules, loginValidationRules, validate } = require('../validators/authValidator');

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user and company
// @access  Public
router.post('/signup', signup);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', login);

// The validation rules and the 'validate' middleware are added here
router.post('/signup', signupValidationRules(), validate, signup);

router.post('/login', loginValidationRules(), validate, login);

module.exports = router;