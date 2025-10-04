const express = require('express');
const { getMyCompany, updateMyCompany } = require('../controllers/companyController');
const authMiddleware = require('../../../middlewares/authMiddleware');
const authorizeRoles = require('../../../middlewares/roleMiddleware');

const router = express.Router();

// Both routes first check for a valid token (authMiddleware)
// and then check if the user's role is 'Admin' (authorizeRoles)

// @route   GET /api/companies/me
// @desc    Get the company details for the logged-in admin
// @access  Private (Admin only)
router.get('/me', authMiddleware, authorizeRoles('Admin'), getMyCompany);

// @route   PATCH /api/companies/me
// @desc    Update the company details for the logged-in admin
// @access  Private (Admin only)
router.patch('/me', authMiddleware, authorizeRoles('Admin'), updateMyCompany);

module.exports = router;
