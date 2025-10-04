const expenseService = require('../services/expense.service');
const currencyService = require('../services/currency.service');

class ExpensesController {
  /**
   * Create a new expense
   * POST /api/expenses
   */
  async createExpense(req, res) {
    try {
      const { employeeId, companyId } = req.user; // From mock auth middleware
      const expenseData = req.body;

      // Validate expense data
      const validation = expenseService.validateExpenseData(expenseData);
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Create expense
      const expense = await expenseService.createExpense(expenseData, employeeId, companyId);

      res.status(201).json({
        message: 'Expense created successfully',
        expense: {
          id: expense._id,
          amount: expense.amount,
          currency: expense.currency,
          convertedAmount: expense.convertedAmount,
          conversionRate: expense.conversionRate,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          receiptUrl: expense.receiptUrl,
          status: expense.status,
          createdAt: expense.createdAt
        }
      });

    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({
        message: 'Failed to create expense',
        error: error.message
      });
    }
  }

  /**
   * Get expense by ID
   * GET /api/expenses/:id
   */
  async getExpenseById(req, res) {
    try {
      const { employeeId } = req.user;
      const { id } = req.params;

      const expense = await expenseService.getExpenseById(id, employeeId);

      res.status(200).json({
        message: 'Expense retrieved successfully',
        expense: {
          id: expense._id,
          amount: expense.amount,
          currency: expense.currency,
          convertedAmount: expense.convertedAmount,
          conversionRate: expense.conversionRate,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          receiptUrl: expense.receiptUrl,
          status: expense.status,
          approvals: expense.approvals,
          currentApprovalStep: expense.currentApprovalStep,
          totalApprovalSteps: expense.totalApprovalSteps,
          approvalRules: expense.approvalRules,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt
        }
      });

    } catch (error) {
      console.error('Error getting expense:', error);
      
      if (error.message === 'Expense not found or access denied') {
        return res.status(404).json({
          message: 'Expense not found or access denied'
        });
      }

      res.status(500).json({
        message: 'Failed to get expense',
        error: error.message
      });
    }
  }

  /**
   * Get employee's expenses with pagination and filtering
   * GET /api/expenses/my
   */
  async getMyExpenses(req, res) {
    try {
      const { employeeId } = req.user;
      const filters = req.query;

      const result = await expenseService.getEmployeeExpenses(employeeId, filters);

      res.status(200).json({
        message: 'Expenses retrieved successfully',
        data: result.expenses.map(expense => ({
          id: expense._id,
          amount: expense.amount,
          currency: expense.currency,
          convertedAmount: expense.convertedAmount,
          conversionRate: expense.conversionRate,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          receiptUrl: expense.receiptUrl,
          status: expense.status,
          currentApprovalStep: expense.currentApprovalStep,
          totalApprovalSteps: expense.totalApprovalSteps,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt
        })),
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting expenses:', error);
      res.status(500).json({
        message: 'Failed to get expenses',
        error: error.message
      });
    }
  }

  /**
   * Update expense
   * PATCH /api/expenses/:id
   */
  async updateExpense(req, res) {
    try {
      const { employeeId } = req.user;
      const { id } = req.params;
      const updateData = req.body;

      // Validate that at least one field is provided
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          message: 'At least one field must be provided for update'
        });
      }

      const expense = await expenseService.updateExpense(id, updateData, employeeId);

      res.status(200).json({
        message: 'Expense updated successfully',
        expense: {
          id: expense._id,
          amount: expense.amount,
          currency: expense.currency,
          convertedAmount: expense.convertedAmount,
          conversionRate: expense.conversionRate,
          category: expense.category,
          description: expense.description,
          date: expense.date,
          receiptUrl: expense.receiptUrl,
          status: expense.status,
          updatedAt: expense.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating expense:', error);
      
      if (error.message === 'Expense not found, access denied, or already processed') {
        return res.status(404).json({
          message: 'Expense not found, access denied, or already processed'
        });
      }

      res.status(500).json({
        message: 'Failed to update expense',
        error: error.message
      });
    }
  }

  /**
   * Delete expense
   * DELETE /api/expenses/:id
   */
  async deleteExpense(req, res) {
    try {
      const { employeeId } = req.user;
      const { id } = req.params;

      await expenseService.deleteExpense(id, employeeId);

      res.status(200).json({
        message: 'Expense deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting expense:', error);
      
      if (error.message === 'Expense not found, access denied, or already processed') {
        return res.status(404).json({
          message: 'Expense not found, access denied, or already processed'
        });
      }

      res.status(500).json({
        message: 'Failed to delete expense',
        error: error.message
      });
    }
  }

  /**
   * Get expense statistics
   * GET /api/expenses/statistics
   */
  async getExpenseStatistics(req, res) {
    try {
      const { employeeId } = req.user;
      const filters = req.query;

      const statistics = await expenseService.getExpenseStatistics(employeeId, filters);

      res.status(200).json({
        message: 'Expense statistics retrieved successfully',
        statistics
      });

    } catch (error) {
      console.error('Error getting expense statistics:', error);
      res.status(500).json({
        message: 'Failed to get expense statistics',
        error: error.message
      });
    }
  }

  /**
   * Get expense logs
   * GET /api/expenses/:id/logs
   */
  async getExpenseLogs(req, res) {
    try {
      const { employeeId } = req.user;
      const { id } = req.params;
      const { limit = 50 } = req.query;

      // First verify the expense belongs to the employee
      await expenseService.getExpenseById(id, employeeId);

      const logs = await expenseService.getExpenseLogs(id, parseInt(limit));

      res.status(200).json({
        message: 'Expense logs retrieved successfully',
        logs: logs.map(log => ({
          id: log._id,
          action: log.action,
          performedBy: log.performedBy,
          performedByRole: log.performedByRole,
          previousStatus: log.previousStatus,
          newStatus: log.newStatus,
          comments: log.comments,
          metadata: log.metadata,
          timestamp: log.timestamp
        }))
      });

    } catch (error) {
      console.error('Error getting expense logs:', error);
      
      if (error.message === 'Expense not found or access denied') {
        return res.status(404).json({
          message: 'Expense not found or access denied'
        });
      }

      res.status(500).json({
        message: 'Failed to get expense logs',
        error: error.message
      });
    }
  }

  /**
   * Get supported currencies
   * GET /api/expenses/currencies
   */
  async getSupportedCurrencies(req, res) {
    try {
      const currencies = currencyService.getSupportedCurrencies();

      res.status(200).json({
        message: 'Supported currencies retrieved successfully',
        currencies
      });

    } catch (error) {
      console.error('Error getting supported currencies:', error);
      res.status(500).json({
        message: 'Failed to get supported currencies',
        error: error.message
      });
    }
  }

  /**
   * Get expense categories
   * GET /api/expenses/categories
   */
  async getExpenseCategories(req, res) {
    try {
      const categories = [
        { value: 'TRAVEL', label: 'Travel' },
        { value: 'MEALS', label: 'Meals' },
        { value: 'ACCOMMODATION', label: 'Accommodation' },
        { value: 'TRANSPORT', label: 'Transport' },
        { value: 'ENTERTAINMENT', label: 'Entertainment' },
        { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
        { value: 'TRAINING', label: 'Training' },
        { value: 'CLIENT_MEETING', label: 'Client Meeting' },
        { value: 'OTHER', label: 'Other' }
      ];

      res.status(200).json({
        message: 'Expense categories retrieved successfully',
        categories
      });

    } catch (error) {
      console.error('Error getting expense categories:', error);
      res.status(500).json({
        message: 'Failed to get expense categories',
        error: error.message
      });
    }
  }

  /**
   * Test currency conversion
   * GET /api/expenses/test-conversion
   */
  async testCurrencyConversion(req, res) {
    try {
      const { amount = 100, from = 'USD', to = 'EUR' } = req.query;

      const conversion = await currencyService.convertCurrency(
        parseFloat(amount),
        from.toUpperCase(),
        to.toUpperCase()
      );

      res.status(200).json({
        message: 'Currency conversion test successful',
        conversion
      });

    } catch (error) {
      console.error('Error testing currency conversion:', error);
      res.status(500).json({
        message: 'Failed to test currency conversion',
        error: error.message
      });
    }
  }
}

module.exports = new ExpensesController();