const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { validateQuery } = require('../middlewares/validation.middleware');

const router = express.Router();

// GET /manager/pending - Get pending expenses with filters
router.get('/pending', dashboardController.getPendingExpenses);

// GET /manager/history - Get expense history with filters
router.get('/history', dashboardController.getExpenseHistory);

// GET /manager/stats - Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// GET /manager/export - Export expenses to CSV
router.get('/export', dashboardController.exportExpenses);

module.exports = router;