const Expense = require('../models/Expense');
const ExpenseLog = require('../models/ExpenseLog');
const config = require('../config/env');
const conditionalService = require('./conditional.service');

const approvalService = {
  // Initialize approval workflow for a new expense
  startApproval: async (expenseId, employeeId, companyId, options = {}) => {
    try {
      console.log(`🚀 Starting approval workflow for expense ${expenseId}`);
      
      const expense = await Expense.findOne({ _id: expenseId, employeeId, companyId });
      if (!expense) {
        throw new Error('Expense not found or access denied');
      }

      if (expense.status !== 'PENDING') {
        throw new Error('Expense is not in PENDING status');
      }

      // Determine approval rules based on expense amount and company settings
      const approvalRules = await approvalService.determineApprovalRules(expense, companyId, options);
      
      // Create approval flow
      const approvalFlow = await approvalService.createApprovalFlow(expense, approvalRules);
      
      // Update expense with approval flow
      expense.approvals = approvalFlow.approvals;
      expense.currentApprovalStep = 0;
      expense.totalApprovalSteps = approvalFlow.approvals.length;
      expense.approvalRules = approvalRules;
      expense.status = 'PENDING'; // Keep as PENDING until first approval
      
      await expense.save();

      // Log the approval start
      await ExpenseLog.create({
        expenseId: expense._id,
        action: 'SUBMITTED',
        performedBy: employeeId,
        performedByRole: 'EMPLOYEE',
        previousStatus: 'PENDING',
        newStatus: 'PENDING',
        details: {
          message: 'Expense submitted for approval',
          approvalFlow: approvalFlow.approvals.map(approval => ({
            step: approval.step,
            approverRole: approval.approverRole,
            status: approval.status
          }))
        }
      });

      // Notify first approver
      await approvalService.notifyNextApprover(expense);

      console.log(`✅ Approval workflow started for expense ${expenseId}`);
      return expense;
    } catch (error) {
      console.error('❌ Error starting approval workflow:', error);
      throw error;
    }
  },

  // Approve an expense at current step
  approveExpense: async (expenseId, approverId, approverRole, comments = '') => {
    try {
      console.log(`✅ Approving expense ${expenseId} by ${approverRole}`);
      
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      // Check if current step is for this approver
      const currentStep = expense.approvals[expense.currentApprovalStep];
      if (!currentStep) {
        throw new Error('No current approval step found');
      }

      if (currentStep.status !== 'PENDING') {
        throw new Error('Current approval step is not pending');
      }

      // Verify approver authorization
      if (currentStep.approverRole !== approverRole) {
        throw new Error(`Approval not authorized for role: ${approverRole}`);
      }

      // Update current approval step
      currentStep.status = 'APPROVED';
      currentStep.comments = comments;
      currentStep.actedAt = new Date();

      // Evaluate conditional rules before proceeding
      const ruleEvaluation = await conditionalService.evaluateRules(expense, 'APPROVED', approverRole, approverId);
      
      // Check if conditional rules triggered auto-approval
      if (ruleEvaluation.shouldAutoApprove) {
        expense.status = 'APPROVED';
        console.log(`🎉 Expense ${expenseId} auto-approved by conditional rules!`);
      } else if (ruleEvaluation.shouldAutoReject) {
        expense.status = 'REJECTED';
        console.log(`❌ Expense ${expenseId} auto-rejected by conditional rules!`);
      } else {
        // Check if this is the final approval step (normal flow)
        if (expense.currentApprovalStep === expense.totalApprovalSteps - 1) {
          // Final approval - mark expense as approved
          expense.status = 'APPROVED';
          console.log(`🎉 Expense ${expenseId} fully approved!`);
        } else {
          // Move to next approval step
          expense.currentApprovalStep += 1;
          console.log(`➡️ Moving to approval step ${expense.currentApprovalStep + 1}`);
        }
      }

      await expense.save();

      // Log the approval
      await ExpenseLog.create({
        expenseId: expense._id,
        action: 'APPROVED',
        performedBy: approverId,
        performedByRole: approverRole,
        previousStatus: 'PENDING',
        newStatus: expense.status,
        details: {
          message: `Approved by ${approverRole}`,
          comments: comments,
          approvalStep: expense.currentApprovalStep,
          isFinalApproval: expense.status === 'APPROVED'
        }
      });

      // Notify next approver if not final approval
      if (expense.status === 'PENDING') {
        await approvalService.notifyNextApprover(expense);
      } else {
        await approvalService.notifyExpenseFinalized(expense, 'APPROVED');
      }

      console.log(`✅ Expense ${expenseId} approved by ${approverRole}`);
      return expense;
    } catch (error) {
      console.error('❌ Error approving expense:', error);
      throw error;
    }
  },

  // Reject an expense
  rejectExpense: async (expenseId, approverId, approverRole, comments = '') => {
    try {
      console.log(`❌ Rejecting expense ${expenseId} by ${approverRole}`);
      
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      // Check if current step is for this approver
      const currentStep = expense.approvals[expense.currentApprovalStep];
      if (!currentStep) {
        throw new Error('No current approval step found');
      }

      if (currentStep.status !== 'PENDING') {
        throw new Error('Current approval step is not pending');
      }

      // Verify approver authorization
      if (currentStep.approverRole !== approverRole) {
        throw new Error(`Rejection not authorized for role: ${approverRole}`);
      }

      // Update current approval step
      currentStep.status = 'REJECTED';
      currentStep.comments = comments;
      currentStep.actedAt = new Date();

      // Mark expense as rejected
      expense.status = 'REJECTED';

      await expense.save();

      // Log the rejection
      await ExpenseLog.create({
        expenseId: expense._id,
        action: 'REJECTED',
        performedBy: approverId,
        performedByRole: approverRole,
        previousStatus: 'PENDING',
        newStatus: 'REJECTED',
        details: {
          message: `Rejected by ${approverRole}`,
          comments: comments,
          approvalStep: expense.currentApprovalStep
        }
      });

      // Notify employee of rejection
      await approvalService.notifyExpenseFinalized(expense, 'REJECTED');

      console.log(`❌ Expense ${expenseId} rejected by ${approverRole}`);
      return expense;
    } catch (error) {
      console.error('❌ Error rejecting expense:', error);
      throw error;
    }
  },

  // Get pending expenses for a specific approver
  getPendingExpenses: async (approverId, approverRole, companyId) => {
    try {
      console.log(`📋 Getting pending expenses for ${approverRole} ${approverId}`);
      
      const expenses = await Expense.find({
        companyId,
        status: 'PENDING',
        'approvals.status': 'PENDING',
        'approvals.approverRole': approverRole
      }).populate('employeeId', 'name email').sort({ createdAt: -1 });

      // Filter to only show expenses where current step matches the approver
      const filteredExpenses = expenses.filter(expense => {
        const currentStep = expense.approvals[expense.currentApprovalStep];
        return currentStep && currentStep.approverRole === approverRole && currentStep.status === 'PENDING';
      });

      console.log(`📊 Found ${filteredExpenses.length} pending expenses for ${approverRole}`);
      return filteredExpenses;
    } catch (error) {
      console.error('❌ Error getting pending expenses:', error);
      throw error;
    }
  },

  // Determine approval rules based on expense amount and company settings
  determineApprovalRules: async (expense, companyId, options = {}) => {
    try {
      // Check for special approval flags
      if (options.directorOnly) {
        return {
          type: 'DIRECTOR_ONLY',
          description: 'Director approval only - special authorization required'
        };
      }
      
      if (options.managerOnly) {
        return {
          type: 'MANAGER_ONLY',
          description: 'Manager approval only - expedited process'
        };
      }
      
      // For MVP, use simple rules based on amount
      // In production, this would fetch from company settings (Developer 1's responsibility)
      
      const amount = expense.convertedAmount || expense.amount;
      
      if (amount <= 100) {
        // Small amounts: Manager approval only
        return {
          type: 'SEQUENTIAL',
          description: 'Manager approval required for amounts up to $100'
        };
      } else if (amount <= 1000) {
        // Medium amounts: Manager + Finance approval
        return {
          type: 'SEQUENTIAL',
          description: 'Manager and Finance approval required for amounts up to $1000'
        };
      } else {
        // Large amounts: Manager + Finance + Director approval
        return {
          type: 'SEQUENTIAL',
          description: 'Manager, Finance, and Director approval required for amounts over $1000'
        };
      }
    } catch (error) {
      console.error('❌ Error determining approval rules:', error);
      throw error;
    }
  },

  // Create approval flow based on rules
  createApprovalFlow: async (expense, approvalRules) => {
    try {
      const amount = expense.convertedAmount || expense.amount;
      const approvals = [];

      // Handle special approval types
      if (approvalRules.type === 'DIRECTOR_ONLY') {
        // Director approval only
        approvals.push({
          step: 1,
          approverId: new (require('mongoose')).Types.ObjectId(config.MOCK_ADMIN_ID), // Using admin as director for MVP
          approverRole: 'DIRECTOR',
          status: 'PENDING'
        });
      } else if (approvalRules.type === 'MANAGER_ONLY') {
        // Manager approval only
        approvals.push({
          step: 1,
          approverId: new (require('mongoose')).Types.ObjectId(config.MOCK_MANAGER_ID),
          approverRole: 'MANAGER',
          status: 'PENDING'
        });
      } else {
        // Standard sequential approval based on amount
        if (amount <= 100) {
          // Manager approval only
          approvals.push({
            step: 1,
            approverId: new (require('mongoose')).Types.ObjectId(config.MOCK_MANAGER_ID),
            approverRole: 'MANAGER',
            status: 'PENDING'
          });
        } else if (amount <= 1000) {
          // Manager + Finance approval
          approvals.push({
            step: 1,
            approverId: new (require('mongoose')).Types.ObjectId(config.MOCK_MANAGER_ID),
            approverRole: 'MANAGER',
            status: 'PENDING'
          });
          approvals.push({
            step: 2,
            approverId: new (require('mongoose')).Types.ObjectId(config.MOCK_ADMIN_ID), // Using admin as finance for MVP
            approverRole: 'FINANCE',
            status: 'PENDING'
          });
        } else {
          // Manager + Finance + Director approval
          approvals.push({
            step: 1,
            approverId: new (require('mongoose')).Types.ObjectId(config.MOCK_MANAGER_ID),
            approverRole: 'MANAGER',
            status: 'PENDING'
          });
          approvals.push({
            step: 2,
            approverId: new (require('mongoose')).Types.ObjectId(config.MOCK_ADMIN_ID), // Using admin as finance for MVP
            approverRole: 'FINANCE',
            status: 'PENDING'
          });
          approvals.push({
            step: 3,
            approverId: new (require('mongoose')).Types.ObjectId(config.MOCK_ADMIN_ID), // Using admin as director for MVP
            approverRole: 'DIRECTOR',
            status: 'PENDING'
          });
        }
      }

      return { approvals };
    } catch (error) {
      console.error('❌ Error creating approval flow:', error);
      throw error;
    }
  },

  // Notify next approver (mock implementation)
  notifyNextApprover: async (expense) => {
    try {
      const currentStep = expense.approvals[expense.currentApprovalStep];
      if (!currentStep) return;

      console.log(`📧 [MOCK] Notifying ${currentStep.approverRole} about pending expense ${expense._id}`);
      console.log(`📧 [MOCK] Email: Dear ${currentStep.approverRole}, you have a pending expense approval. Amount: $${expense.convertedAmount}, Category: ${expense.category}`);
      
      // In production, this would send actual email/Slack notification
      // await emailService.sendApprovalNotification(currentStep.approverId, expense);
      // await slackService.sendApprovalNotification(currentStep.approverId, expense);
      
      return true;
    } catch (error) {
      console.error('❌ Error notifying next approver:', error);
      // Don't throw error for notification failures
    }
  },

  // Notify expense finalized (approved/rejected)
  notifyExpenseFinalized: async (expense, finalStatus) => {
    try {
      console.log(`📧 [MOCK] Notifying employee about expense ${expense._id} ${finalStatus}`);
      console.log(`📧 [MOCK] Email: Dear Employee, your expense has been ${finalStatus}. Amount: $${expense.convertedAmount}, Category: ${expense.category}`);
      
      // In production, this would send actual email notification to employee
      // await emailService.sendExpenseStatusNotification(expense.employeeId, expense, finalStatus);
      
      return true;
    } catch (error) {
      console.error('❌ Error notifying expense finalized:', error);
      // Don't throw error for notification failures
    }
  },

  // Apply conditional rules to an expense
  applyConditionalRules: async (expenseId, ruleIds = []) => {
    try {
      console.log(`🔧 Applying conditional rules to expense ${expenseId}`);
      
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      const updatedExpense = await conditionalService.applyConditionalRules(expense, ruleIds);
      await updatedExpense.save();

      console.log(`✅ Applied conditional rules to expense ${expenseId}`);
      return updatedExpense;
    } catch (error) {
      console.error('❌ Error applying conditional rules:', error);
      throw error;
    }
  },

  // Get rule evaluation summary for an expense
  getRuleEvaluationSummary: async (expenseId) => {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      return conditionalService.getRuleEvaluationSummary(expense);
    } catch (error) {
      console.error('❌ Error getting rule evaluation summary:', error);
      throw error;
    }
  },

  // Get approval statistics
  getApprovalStatistics: async (companyId, approverRole = null) => {
    try {
      const matchQuery = { companyId };
      if (approverRole) {
        matchQuery['approvals.approverRole'] = approverRole;
      }

      const statistics = await Expense.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$convertedAmount' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            status: '$_id',
            totalAmount: { $round: ['$totalAmount', 2] },
            count: 1
          }
        }
      ]);

      return statistics;
    } catch (error) {
      console.error('❌ Error getting approval statistics:', error);
      throw error;
    }
  },

  // Get approval history for an expense
  getApprovalHistory: async (expenseId, employeeId, companyId) => {
    try {
      const expense = await Expense.findOne({ _id: expenseId, employeeId, companyId });
      if (!expense) {
        throw new Error('Expense not found or access denied');
      }

      const logs = await ExpenseLog.find({ expenseId })
        .sort({ timestamp: 1 });

      return {
        expense: {
          id: expense._id,
          amount: expense.convertedAmount,
          currency: expense.currency,
          category: expense.category,
          status: expense.status,
          currentStep: expense.currentApprovalStep,
          totalSteps: expense.totalApprovalSteps
        },
        approvalFlow: expense.approvals,
        history: logs
      };
    } catch (error) {
      console.error('❌ Error getting approval history:', error);
      throw error;
    }
  }
};

module.exports = approvalService;