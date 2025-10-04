const config = require('../config/env');

const conditionalService = {
  // Evaluate conditional rules for an expense
  evaluateRules: async (expense, action, approverRole, approverId) => {
    try {
      console.log(`🔍 Evaluating conditional rules for expense ${expense._id}`);
      
      if (!expense.conditionalRules || expense.conditionalRules.length === 0) {
        console.log('📋 No conditional rules to evaluate');
        return { 
          shouldAutoApprove: false, 
          shouldAutoReject: false,
          rulesEvaluated: [],
          finalDecision: null
        };
      }

      const rulesEvaluated = [];
      let shouldAutoApprove = false;
      let shouldAutoReject = false;
      let finalDecision = null;

      // Evaluate each rule
      for (const rule of expense.conditionalRules) {
        const evaluation = await conditionalService.evaluateSingleRule(expense, rule, action, approverRole, approverId);
        rulesEvaluated.push(evaluation);

        // Check if this rule triggers auto-approval
        if (evaluation.triggered && evaluation.action === 'APPROVE') {
          shouldAutoApprove = true;
          finalDecision = 'APPROVED';
          console.log(`✅ Rule triggered auto-approval: ${rule.type}`);
        }

        // Check if this rule triggers auto-rejection
        if (evaluation.triggered && evaluation.action === 'REJECT') {
          shouldAutoReject = true;
          finalDecision = 'REJECTED';
          console.log(`❌ Rule triggered auto-rejection: ${rule.type}`);
        }
      }

      // Update expense with evaluated rules
      if (!expense.rulesEvaluated) {
        expense.rulesEvaluated = [];
      }
      expense.rulesEvaluated.push(...rulesEvaluated);

      console.log(`📊 Rules evaluation complete. Auto-approve: ${shouldAutoApprove}, Auto-reject: ${shouldAutoReject}`);
      
      return {
        shouldAutoApprove,
        shouldAutoReject,
        rulesEvaluated,
        finalDecision
      };
    } catch (error) {
      console.error('❌ Error evaluating conditional rules:', error);
      throw error;
    }
  },

  // Evaluate a single rule
  evaluateSingleRule: async (expense, rule, action, approverRole, approverId) => {
    try {
      const evaluation = {
        ruleId: rule.id || `rule_${Date.now()}`,
        ruleType: rule.type,
        ruleDescription: rule.description || `${rule.type} rule`,
        triggered: false,
        action: null,
        details: {},
        evaluatedAt: new Date(),
        evaluatedBy: approverId,
        evaluatedByRole: approverRole
      };

      switch (rule.type) {
        case 'PERCENTAGE':
          evaluation.triggered = await conditionalService.evaluatePercentageRule(expense, rule, action, approverRole);
          evaluation.action = evaluation.triggered ? 'APPROVE' : null;
          evaluation.details = {
            threshold: rule.threshold,
            currentPercentage: conditionalService.calculateApprovalPercentage(expense),
            requiredApprovals: rule.requiredApprovals || 1
          };
          break;

        case 'SPECIFIC':
          evaluation.triggered = await conditionalService.evaluateSpecificRule(expense, rule, action, approverRole);
          evaluation.action = evaluation.triggered ? 'APPROVE' : null;
          evaluation.details = {
            requiredRole: rule.approverRole,
            requiredApproverId: rule.approverId,
            currentApproverRole: approverRole,
            currentApproverId: approverId
          };
          break;

        case 'HYBRID':
          evaluation.triggered = await conditionalService.evaluateHybridRule(expense, rule, action, approverRole);
          evaluation.action = evaluation.triggered ? 'APPROVE' : null;
          evaluation.details = {
            hybridRule: rule.rule,
            conditions: rule.conditions,
            currentStatus: conditionalService.getCurrentApprovalStatus(expense)
          };
          break;

        case 'AMOUNT_THRESHOLD':
          evaluation.triggered = await conditionalService.evaluateAmountThresholdRule(expense, rule, action, approverRole);
          evaluation.action = evaluation.triggered ? 'APPROVE' : null;
          evaluation.details = {
            threshold: rule.threshold,
            currentAmount: expense.convertedAmount || expense.amount,
            currency: expense.currency
          };
          break;

        case 'CATEGORY_SPECIFIC':
          evaluation.triggered = await conditionalService.evaluateCategorySpecificRule(expense, rule, action, approverRole);
          evaluation.action = evaluation.triggered ? 'APPROVE' : null;
          evaluation.details = {
            requiredCategory: rule.category,
            currentCategory: expense.category,
            requiredRole: rule.approverRole
          };
          break;

        default:
          console.log(`⚠️ Unknown rule type: ${rule.type}`);
          evaluation.details = { error: 'Unknown rule type' };
      }

      return evaluation;
    } catch (error) {
      console.error('❌ Error evaluating single rule:', error);
      return {
        ruleId: rule.id || 'unknown',
        ruleType: rule.type,
        ruleDescription: 'Error evaluating rule',
        triggered: false,
        action: null,
        details: { error: error.message },
        evaluatedAt: new Date(),
        evaluatedBy: approverId,
        evaluatedByRole: approverRole
      };
    }
  },

  // Evaluate percentage-based rule
  evaluatePercentageRule: async (expense, rule, action, approverRole) => {
    try {
      if (action !== 'APPROVED') return false;

      const currentPercentage = conditionalService.calculateApprovalPercentage(expense);
      const threshold = rule.threshold || 60;
      
      console.log(`📊 Percentage rule: ${currentPercentage}% >= ${threshold}%`);
      return currentPercentage >= threshold;
    } catch (error) {
      console.error('❌ Error evaluating percentage rule:', error);
      return false;
    }
  },

  // Evaluate specific approver rule
  evaluateSpecificRule: async (expense, rule, action, approverRole) => {
    try {
      if (action !== 'APPROVED') return false;

      // Check if current approver matches the required role
      if (rule.approverRole && approverRole === rule.approverRole) {
        console.log(`✅ Specific rule: ${approverRole} matches required role ${rule.approverRole}`);
        return true;
      }

      // Check if current approver matches the required approver ID
      if (rule.approverId && rule.approverId.toString() === approverRole.toString()) {
        console.log(`✅ Specific rule: Approver ID matches required ID`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error evaluating specific rule:', error);
      return false;
    }
  },

  // Evaluate hybrid rule (e.g., "60% OR CFO")
  evaluateHybridRule: async (expense, rule, action, approverRole) => {
    try {
      if (action !== 'APPROVED') return false;

      const conditions = rule.conditions || [];
      let anyConditionMet = false;

      for (const condition of conditions) {
        let conditionMet = false;

        if (condition.type === 'PERCENTAGE') {
          const currentPercentage = conditionalService.calculateApprovalPercentage(expense);
          conditionMet = currentPercentage >= condition.threshold;
          console.log(`📊 Hybrid percentage: ${currentPercentage}% >= ${condition.threshold}%`);
        } else if (condition.type === 'SPECIFIC') {
          conditionMet = approverRole === condition.approverRole;
          console.log(`👤 Hybrid specific: ${approverRole} === ${condition.approverRole}`);
        }

        if (conditionMet) {
          anyConditionMet = true;
          break;
        }
      }

      console.log(`🔄 Hybrid rule result: ${anyConditionMet}`);
      return anyConditionMet;
    } catch (error) {
      console.error('❌ Error evaluating hybrid rule:', error);
      return false;
    }
  },

  // Evaluate amount threshold rule
  evaluateAmountThresholdRule: async (expense, rule, action, approverRole) => {
    try {
      if (action !== 'APPROVED') return false;

      const currentAmount = expense.convertedAmount || expense.amount;
      const threshold = rule.threshold || 1000;
      
      console.log(`💰 Amount threshold: ${currentAmount} >= ${threshold}`);
      return currentAmount >= threshold;
    } catch (error) {
      console.error('❌ Error evaluating amount threshold rule:', error);
      return false;
    }
  },

  // Evaluate category-specific rule
  evaluateCategorySpecificRule: async (expense, rule, action, approverRole) => {
    try {
      if (action !== 'APPROVED') return false;

      const categoryMatch = expense.category === rule.category;
      const roleMatch = approverRole === rule.approverRole;
      
      console.log(`🏷️ Category rule: ${expense.category} === ${rule.category} && ${approverRole} === ${rule.approverRole}`);
      return categoryMatch && roleMatch;
    } catch (error) {
      console.error('❌ Error evaluating category-specific rule:', error);
      return false;
    }
  },

  // Calculate current approval percentage
  calculateApprovalPercentage: (expense) => {
    try {
      if (!expense.approvals || expense.approvals.length === 0) return 0;

      const totalSteps = expense.totalApprovalSteps || expense.approvals.length;
      const approvedSteps = expense.approvals.filter(approval => approval.status === 'APPROVED').length;
      
      const percentage = (approvedSteps / totalSteps) * 100;
      console.log(`📊 Approval percentage: ${approvedSteps}/${totalSteps} = ${percentage.toFixed(1)}%`);
      return Math.round(percentage);
    } catch (error) {
      console.error('❌ Error calculating approval percentage:', error);
      return 0;
    }
  },

  // Get current approval status
  getCurrentApprovalStatus: (expense) => {
    try {
      return {
        currentStep: expense.currentApprovalStep,
        totalSteps: expense.totalApprovalSteps,
        approvedSteps: expense.approvals.filter(a => a.status === 'APPROVED').length,
        rejectedSteps: expense.approvals.filter(a => a.status === 'REJECTED').length,
        pendingSteps: expense.approvals.filter(a => a.status === 'PENDING').length,
        percentage: conditionalService.calculateApprovalPercentage(expense)
      };
    } catch (error) {
      console.error('❌ Error getting approval status:', error);
      return {};
    }
  },

  // Load mock rules for testing
  loadMockRules: () => {
    return [
      {
        id: 'rule_percentage_60',
        type: 'PERCENTAGE',
        description: 'Auto-approve when 60% of approvals are received',
        threshold: 60,
        requiredApprovals: 1
      },
      {
        id: 'rule_specific_cfo',
        type: 'SPECIFIC',
        description: 'Auto-approve when CFO approves',
        approverRole: 'CFO'
      },
      {
        id: 'rule_hybrid_60_or_cfo',
        type: 'HYBRID',
        description: 'Auto-approve when 60% OR CFO approves',
        rule: '60% OR CFO',
        conditions: [
          { type: 'PERCENTAGE', threshold: 60 },
          { type: 'SPECIFIC', approverRole: 'CFO' }
        ]
      },
      {
        id: 'rule_amount_1000',
        type: 'AMOUNT_THRESHOLD',
        description: 'Auto-approve when amount >= $1000',
        threshold: 1000
      },
      {
        id: 'rule_category_office_supplies',
        type: 'CATEGORY_SPECIFIC',
        description: 'Auto-approve when OFFICE_SUPPLIES category and DIRECTOR approves',
        category: 'OFFICE_SUPPLIES',
        approverRole: 'DIRECTOR'
      }
    ];
  },

  // Apply conditional rules to an expense
  applyConditionalRules: async (expense, ruleIds = []) => {
    try {
      console.log(`🔧 Applying conditional rules to expense ${expense._id}`);
      
      const mockRules = conditionalService.loadMockRules();
      const selectedRules = ruleIds.length > 0 
        ? mockRules.filter(rule => ruleIds.includes(rule.id))
        : mockRules; // Apply all rules if none specified

      expense.conditionalRules = selectedRules;
      expense.rulesEvaluated = []; // Initialize rules evaluated array
      
      console.log(`✅ Applied ${selectedRules.length} conditional rules`);
      return expense;
    } catch (error) {
      console.error('❌ Error applying conditional rules:', error);
      throw error;
    }
  },

  // Get rule evaluation summary
  getRuleEvaluationSummary: (expense) => {
    try {
      if (!expense.rulesEvaluated || expense.rulesEvaluated.length === 0) {
        return { message: 'No rules evaluated yet' };
      }

      const summary = {
        totalRules: expense.rulesEvaluated.length,
        triggeredRules: expense.rulesEvaluated.filter(rule => rule.triggered).length,
        autoApproved: expense.rulesEvaluated.some(rule => rule.triggered && rule.action === 'APPROVE'),
        autoRejected: expense.rulesEvaluated.some(rule => rule.triggered && rule.action === 'REJECT'),
        lastEvaluation: expense.rulesEvaluated[expense.rulesEvaluated.length - 1]?.evaluatedAt,
        rules: expense.rulesEvaluated.map(rule => ({
          ruleId: rule.ruleId,
          ruleType: rule.ruleType,
          triggered: rule.triggered,
          action: rule.action,
          evaluatedAt: rule.evaluatedAt
        }))
      };

      return summary;
    } catch (error) {
      console.error('❌ Error getting rule evaluation summary:', error);
      return { error: error.message };
    }
  }
};

module.exports = conditionalService;