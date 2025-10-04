const express = require('express');
const {
  createUser,
  getAllUsers,
  updateUserRole,
  assignUserManager,
} = require('../controllers/userController');
// const authMiddleware = require('../../../middlewares/authMiddleware');
// const authorizeRoles = require('../../../middlewares/roleMiddleware');

const router = express.Router();

// Authentication middleware removed for prototype
// router.use(authMiddleware, authorizeRoles('Admin'));

// @route   POST /api/users
// @desc    Admin creates a new Employee or Manager
router.post('/', createUser);

// @route   GET /api/users
// @desc    Admin gets a list of all users in their company
router.get('/', getAllUsers);

// @route   PATCH /api/users/:id/role
// @desc    Admin updates a user's role
router.patch('/:id/role', updateUserRole);

// @route   PATCH /api/users/:id/manager
// @desc    Admin assigns a manager to a user
router.patch('/:id/manager', assignUserManager);

module.exports = router;
