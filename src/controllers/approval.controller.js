const approvalService = require('../services/approval.service');
const expenseService = require('../services/expense.service');

const approvalController = {
  // Start approval workflow for an expense
  startApproval: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employeeId = req.user.employeeId;
      const companyId = req.user.companyId;

      console.log(`🚀 Starting approval for expense ${id}`);

      const expense = await approvalService.startApproval(id, employeeId, companyId);

      res.status(200).json({
        message: 'Approval workflow started successfully',
        expense: {
          id: expense._id,
          amount: expense.convertedAmount,
          currency: expense.currency,
          category: expense.category,
          status: expense.status,
          currentApprovalStep: expense.currentApprovalStep,
          totalApprovalSteps: expense.totalApprovalSteps,
          approvalRules: expense.approvalRules
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Approve an expense
  approveExpense: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const approverId = req.user.employeeId; // In real app, this would be the actual approver ID
      const approverRole = req.user.role; // In real app, this would be the actual approver role

      console.log(`✅ Approving expense ${id} by ${approverRole}`);

      const expense = await approvalService.approveExpense(id, approverId, approverRole, comments);

      res.status(200).json({
        message: 'Expense approved successfully',
        expense: {
          id: expense._id,
          amount: expense.convertedAmount,
          currency: expense.currency,
          category: expense.category,
          status: expense.status,
          currentApprovalStep: expense.currentApprovalStep,
          totalApprovalSteps: expense.totalApprovalSteps,
          isFinalApproval: expense.status === 'APPROVED'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Reject an expense
  rejectExpense: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const approverId = req.user.employeeId; // In real app, this would be the actual approver ID
      const approverRole = req.user.role; // In real app, this would be the actual approver role

      console.log(`❌ Rejecting expense ${id} by ${approverRole}`);

      const expense = await approvalService.rejectExpense(id, approverId, approverRole, comments);

      res.status(200).json({
        message: 'Expense rejected successfully',
        expense: {
          id: expense._id,
          amount: expense.convertedAmount,
          currency: expense.currency,
          category: expense.category,
          status: expense.status,
          rejectionComments: comments
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get pending expenses for approver
  getPendingExpenses: async (req, res, next) => {
    try {
      const approverId = req.user.employeeId;
      const approverRole = req.user.role;
      const companyId = req.user.companyId;

      console.log(`📋 Getting pending expenses for ${approverRole}`);

      const pendingExpenses = await approvalService.getPendingExpenses(approverId, approverRole, companyId);

      res.status(200).json({
        message: 'Pending expenses retrieved successfully',
        approver: {
          id: approverId,
          role: approverRole
        },
        pendingExpenses: pendingExpenses.map(expense => ({
          id: expense._id,
          amount: expense.convertedAmount,
          currency: expense.currency,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          employee: {
            id: expense.employeeId._id,
            name: expense.employeeId.name,
            email: expense.employeeId.email
          },
          currentApprovalStep: expense.currentApprovalStep,
          totalApprovalSteps: expense.totalApprovalSteps,
          approvalRules: expense.approvalRules,
          createdAt: expense.createdAt
        })),
        count: pendingExpenses.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Get approval statistics
  getApprovalStatistics: async (req, res, next) => {
    try {
      const companyId = req.user.companyId;
      const approverRole = req.query.role || null;

      console.log(`📊 Getting approval statistics for role: ${approverRole || 'all'}`);

      const statistics = await approvalService.getApprovalStatistics(companyId, approverRole);

      res.status(200).json({
        message: 'Approval statistics retrieved successfully',
        statistics,
        filters: {
          companyId,
          approverRole: approverRole || 'all'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get approval history for an expense
  getApprovalHistory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const employeeId = req.user.employeeId;
      const companyId = req.user.companyId;

      console.log(`📜 Getting approval history for expense ${id}`);

      const history = await approvalService.getApprovalHistory(id, employeeId, companyId);

      res.status(200).json({
        message: 'Approval history retrieved successfully',
        ...history
      });
    } catch (error) {
      next(error);
    }
  },

  // Get workflow information
  getWorkflowInfo: (req, res, next) => {
    try {
      const info = {
        message: 'Approval Workflow Information',
        features: [
          'Multi-step approval workflow',
          'Role-based approval routing',
          'Automatic notification system',
          'Approval history tracking',
          'Flexible approval rules',
          'Real-time status updates'
        ],
        approvalRoles: [
          'MANAGER',
          'FINANCE',
          'DIRECTOR',
          'CFO',
          'ADMIN'
        ],
        workflowTypes: [
          'SEQUENTIAL - Step by step approval',
          'PERCENTAGE - Based on amount thresholds',
          'SPECIFIC - Specific approver required',
          'HYBRID - Combination of rules'
        ],
        endpoints: {
          startApproval: 'POST /api/workflow/start/:expenseId',
          approve: 'PATCH /api/workflow/approve/:expenseId',
          reject: 'PATCH /api/workflow/reject/:expenseId',
          pending: 'GET /api/workflow/pending',
          statistics: 'GET /api/workflow/statistics',
          history: 'GET /api/workflow/history/:expenseId'
        },
        approvalRules: {
          'Amount ≤ $100': 'Manager approval only',
          'Amount ≤ $1000': 'Manager + Finance approval',
          'Amount > $1000': 'Manager + Finance + Director approval'
        }
      };

      res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  },

  // Test approval workflow with sample data
  testWorkflow: async (req, res, next) => {
    try {
      const { amount, category, description } = req.body;
      const employeeId = req.user.employeeId;
      const companyId = req.user.companyId;

      console.log(`🧪 Testing approval workflow with amount: $${amount}`);

      // Create a test expense
      const testExpense = await expenseService.createExpense({
        amount: amount || 500,
        currency: 'USD',
        category: category || 'MEALS',
        description: description || 'Test expense for approval workflow',
        date: new Date()
      }, employeeId, companyId);

      // Start approval workflow
      const approvedExpense = await approvalService.startApproval(testExpense._id, employeeId, companyId);

      res.status(201).json({
        message: 'Test approval workflow created successfully',
        testExpense: {
          id: approvedExpense._id,
          amount: approvedExpense.convertedAmount,
          currency: approvedExpense.currency,
          category: approvedExpense.category,
          status: approvedExpense.status,
          currentApprovalStep: approvedExpense.currentApprovalStep,
          totalApprovalSteps: approvedExpense.totalApprovalSteps,
          approvalRules: approvedExpense.approvalRules,
          approvals: approvedExpense.approvals
        },
        nextSteps: [
          'Use the expense ID to test approval/rejection',
          'Check pending expenses for approvers',
          'View approval history and statistics'
        ]
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = approvalController;