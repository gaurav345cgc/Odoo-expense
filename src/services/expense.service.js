const Expense = require('../models/Expense');
const ExpenseLog = require('../models/ExpenseLog');
const currencyService = require('./currency.service');
const config = require('../config/env');

class ExpenseService {
  /**
   * Create a new expense
   * @param {Object} expenseData - Expense data
   * @param {string} employeeId - Employee ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Created expense
   */
  async createExpense(expenseData, employeeId, companyId) {
    try {
      console.log(`💰 Creating expense for employee ${employeeId} in company ${companyId}`);

      // Get company's base currency
      const baseCurrency = await currencyService.getCompanyBaseCurrency(companyId);
      
      // Convert currency if needed
      let convertedAmount = expenseData.amount;
      let conversionRate = 1;
      
      if (expenseData.currency !== baseCurrency) {
        const conversion = await currencyService.convertCurrency(
          expenseData.amount,
          expenseData.currency,
          baseCurrency
        );
        convertedAmount = conversion.convertedAmount;
        conversionRate = conversion.conversionRate;
      }

      // Create expense object
      const expense = new Expense({
        employeeId,
        companyId,
        amount: expenseData.amount,
        currency: expenseData.currency.toUpperCase(),
        convertedAmount,
        conversionRate,
        category: expenseData.category,
        description: expenseData.description,
        date: new Date(expenseData.date),
        receiptUrl: expenseData.receiptUrl || null,
        status: 'PENDING',
        approvals: [],
        currentApprovalStep: 0,
        totalApprovalSteps: 0,
        approvalRules: {
          type: 'SEQUENTIAL'
        }
      });

      // Save expense
      const savedExpense = await expense.save();
      console.log(`✅ Expense created with ID: ${savedExpense._id}`);

      // Create audit log
      await this.createExpenseLog(savedExpense._id, employeeId, 'EMPLOYEE', 'CREATED', {
        amount: savedExpense.amount,
        currency: savedExpense.currency,
        category: savedExpense.category
      });

      return savedExpense;

    } catch (error) {
      console.error('❌ Error creating expense:', error.message);
      throw error;
    }
  }

  /**
   * Get expense by ID
   * @param {string} expenseId - Expense ID
   * @param {string} employeeId - Employee ID (for authorization)
   * @returns {Promise<Object>} Expense object
   */
  async getExpenseById(expenseId, employeeId) {
    try {
      const expense = await Expense.findOne({
        _id: expenseId,
        employeeId
      });

      if (!expense) {
        throw new Error('Expense not found or access denied');
      }

      return expense;

    } catch (error) {
      console.error('❌ Error getting expense:', error.message);
      throw error;
    }
  }

  /**
   * Get expenses for an employee
   * @param {string} employeeId - Employee ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated expenses
   */
  async getEmployeeExpenses(employeeId, filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        category,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Build query
      const query = { employeeId };

      if (status) {
        query.status = status;
      }

      if (category) {
        query.category = category;
      }

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [expenses, total] = await Promise.all([
        Expense.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Expense.countDocuments(query)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        expenses,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      };

    } catch (error) {
      console.error('❌ Error getting employee expenses:', error.message);
      throw error;
    }
  }

  /**
   * Update expense (only if status is PENDING)
   * @param {string} expenseId - Expense ID
   * @param {Object} updateData - Update data
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Object>} Updated expense
   */
  async updateExpense(expenseId, updateData, employeeId) {
    try {
      console.log(`📝 Updating expense ${expenseId} for employee ${employeeId}`);

      // Find expense
      const expense = await Expense.findOne({
        _id: expenseId,
        employeeId,
        status: 'PENDING'
      });

      if (!expense) {
        throw new Error('Expense not found, access denied, or already processed');
      }

      // Get company's base currency for conversion if amount/currency changed
      if (updateData.amount || updateData.currency) {
        const baseCurrency = await currencyService.getCompanyBaseCurrency(expense.companyId);
        const currency = updateData.currency || expense.currency;
        const amount = updateData.amount || expense.amount;

        if (currency !== baseCurrency) {
          const conversion = await currencyService.convertCurrency(
            amount,
            currency,
            baseCurrency
          );
          updateData.convertedAmount = conversion.convertedAmount;
          updateData.conversionRate = conversion.conversionRate;
        } else {
          updateData.convertedAmount = amount;
          updateData.conversionRate = 1;
        }
      }

      // Update expense
      const updatedExpense = await Expense.findByIdAndUpdate(
        expenseId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      console.log(`✅ Expense updated: ${expenseId}`);

      // Create audit log
      await this.createExpenseLog(expenseId, employeeId, 'EMPLOYEE', 'UPDATED', {
        updatedFields: Object.keys(updateData)
      });

      return updatedExpense;

    } catch (error) {
      console.error('❌ Error updating expense:', error.message);
      throw error;
    }
  }

  /**
   * Delete expense (only if status is PENDING)
   * @param {string} expenseId - Expense ID
   * @param {string} employeeId - Employee ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteExpense(expenseId, employeeId) {
    try {
      console.log(`🗑️ Deleting expense ${expenseId} for employee ${employeeId}`);

      const expense = await Expense.findOne({
        _id: expenseId,
        employeeId,
        status: 'PENDING'
      });

      if (!expense) {
        throw new Error('Expense not found, access denied, or already processed');
      }

      await Expense.findByIdAndDelete(expenseId);

      // Create audit log
      await this.createExpenseLog(expenseId, employeeId, 'EMPLOYEE', 'CANCELLED', {
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category
      });

      console.log(`✅ Expense deleted: ${expenseId}`);
      return true;

    } catch (error) {
      console.error('❌ Error deleting expense:', error.message);
      throw error;
    }
  }

  /**
   * Get expense statistics for an employee
   * @param {string} employeeId - Employee ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Expense statistics
   */
  async getExpenseStatistics(employeeId, filters = {}) {
    try {
      const { startDate, endDate, category } = filters;

      // Build query
      const query = { employeeId };
      
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      if (category) {
        query.category = category;
      }

      // Get statistics
      const [
        totalExpenses,
        totalAmount,
        statusCounts,
        categoryCounts,
        monthlyData
      ] = await Promise.all([
        Expense.countDocuments(query),
        Expense.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$convertedAmount' } } }
        ]),
        Expense.aggregate([
          { $match: query },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        Expense.aggregate([
          { $match: query },
          { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$convertedAmount' } } }
        ]),
        Expense.aggregate([
          { $match: query },
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' }
              },
              count: { $sum: 1 },
              total: { $sum: '$convertedAmount' }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 }
        ])
      ]);

      return {
        totalExpenses,
        totalAmount: totalAmount[0]?.total || 0,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        categoryBreakdown: categoryCounts.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            total: item.total
          };
          return acc;
        }, {}),
        monthlyTrend: monthlyData
      };

    } catch (error) {
      console.error('❌ Error getting expense statistics:', error.message);
      throw error;
    }
  }

  /**
   * Create expense log entry
   * @param {string} expenseId - Expense ID
   * @param {string} performedBy - User ID who performed action
   * @param {string} performedByRole - User role
   * @param {string} action - Action performed
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Created log entry
   */
  async createExpenseLog(expenseId, performedBy, performedByRole, action, metadata = {}) {
    try {
      const log = new ExpenseLog({
        expenseId,
        performedBy,
        performedByRole,
        action,
        metadata,
        timestamp: new Date()
      });

      return await log.save();

    } catch (error) {
      console.error('❌ Error creating expense log:', error.message);
      throw error;
    }
  }

  /**
   * Get expense logs
   * @param {string} expenseId - Expense ID
   * @param {number} limit - Number of logs to return
   * @returns {Promise<Array>} Expense logs
   */
  async getExpenseLogs(expenseId, limit = 50) {
    try {
      return await ExpenseLog.find({ expenseId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

    } catch (error) {
      console.error('❌ Error getting expense logs:', error.message);
      throw error;
    }
  }

  /**
   * Validate expense data
   * @param {Object} expenseData - Expense data to validate
   * @returns {Object} Validation result
   */
  validateExpenseData(expenseData) {
    const errors = [];

    // Required fields
    if (!expenseData.amount || expenseData.amount <= 0) {
      errors.push('Amount is required and must be greater than 0');
    }

    if (!expenseData.currency || !currencyService.isValidCurrency(expenseData.currency)) {
      errors.push('Valid currency is required');
    }

    if (!expenseData.category) {
      errors.push('Category is required');
    }

    if (!expenseData.description || expenseData.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!expenseData.date) {
      errors.push('Date is required');
    }

    // Date validation
    if (expenseData.date && new Date(expenseData.date) > new Date()) {
      errors.push('Date cannot be in the future');
    }

    // Description length
    if (expenseData.description && expenseData.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ExpenseService();