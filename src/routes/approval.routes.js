const express = require('express');
const approvalController = require('../controllers/approval.controller');
const { validateObjectId } = require('../middlewares/validation.middleware');

const router = express.Router();

// Workflow information endpoint
router.get('/info', approvalController.getWorkflowInfo);

// Test workflow endpoint
router.post('/test', approvalController.testWorkflow);

// Start approval workflow for an expense
router.post('/start/:id', validateObjectId, approvalController.startApproval);

// Approve an expense
router.patch('/approve/:id', validateObjectId, approvalController.approveExpense);

// Reject an expense
router.patch('/reject/:id', validateObjectId, approvalController.rejectExpense);

// Get pending expenses for approver
router.get('/pending', approvalController.getPendingExpenses);

// Get approval statistics
router.get('/statistics', approvalController.getApprovalStatistics);

// Get approval history for an expense
router.get('/history/:id', validateObjectId, approvalController.getApprovalHistory);

module.exports = router;