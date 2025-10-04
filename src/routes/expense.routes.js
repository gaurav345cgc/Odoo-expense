const express = require('express');
const expensesController = require('../controllers/expenses.controller');
const {
  validateCreateExpense,
  validateUpdateExpense,
  validateGetExpensesQuery,
  validateStatisticsQuery,
  validateObjectId
} = require('../middlewares/validation.middleware');

const router = express.Router();

/**
 * @route   POST /api/expenses
 * @desc    Create a new expense
 * @access  Private (Employee)
 * @body    { amount, currency, category, description, date, receiptUrl? }
 */
router.post('/', validateCreateExpense, expensesController.createExpense);

/**
 * @route   GET /api/expenses/my
 * @desc    Get employee's expenses with pagination and filtering
 * @access  Private (Employee)
 * @query   { page?, limit?, status?, category?, startDate?, endDate?, sortBy?, sortOrder? }
 */
router.get('/my', validateGetExpensesQuery, expensesController.getMyExpenses);

/**
 * @route   GET /api/expenses/statistics
 * @desc    Get expense statistics for employee
 * @access  Private (Employee)
 * @query   { startDate?, endDate?, category? }
 */
router.get('/statistics', validateStatisticsQuery, expensesController.getExpenseStatistics);

/**
 * @route   GET /api/expenses/currencies
 * @desc    Get supported currencies
 * @access  Public
 */
router.get('/currencies', expensesController.getSupportedCurrencies);

/**
 * @route   GET /api/expenses/categories
 * @desc    Get expense categories
 * @access  Public
 */
router.get('/categories', expensesController.getExpenseCategories);

/**
 * @route   GET /api/expenses/test-conversion
 * @desc    Test currency conversion (for development)
 * @access  Public
 * @query   { amount?, from?, to? }
 */
router.get('/test-conversion', expensesController.testCurrencyConversion);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Private (Employee - own expenses only)
 * @params  { id }
 */
router.get('/:id', validateObjectId, expensesController.getExpenseById);

/**
 * @route   PATCH /api/expenses/:id
 * @desc    Update expense (only if status is PENDING)
 * @access  Private (Employee - own expenses only)
 * @params  { id }
 * @body    { amount?, currency?, category?, description?, date?, receiptUrl? }
 */
router.patch('/:id', validateObjectId, validateUpdateExpense, expensesController.updateExpense);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense (only if status is PENDING)
 * @access  Private (Employee - own expenses only)
 * @params  { id }
 */
router.delete('/:id', validateObjectId, expensesController.deleteExpense);

/**
 * @route   GET /api/expenses/:id/logs
 * @desc    Get expense logs/audit trail
 * @access  Private (Employee - own expenses only)
 * @params  { id }
 * @query   { limit? }
 */
router.get('/:id/logs', validateObjectId, expensesController.getExpenseLogs);

module.exports = router;