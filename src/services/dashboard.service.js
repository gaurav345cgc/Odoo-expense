const Expense = require('../models/Expense');
const ExpenseLog = require('../models/ExpenseLog');
const mongoose = require('mongoose');

const dashboardService = {
  // Get pending expenses for managers with filters
  getPendingExpenses: async (companyId, filters = {}) => {
    try {
      console.log(`📋 Getting pending expenses for company ${companyId} with filters:`, filters);
      
      const {
        dateRange,
        category,
        employee,
        amountMin,
        amountMax,
        limit = 50,
        page = 1
      } = filters;

      // Build query
      const query = {
        companyId: new mongoose.Types.ObjectId(companyId),
        status: 'PENDING',
        'approvals.status': 'PENDING'
      };

      // Add date range filter
      if (dateRange && dateRange.start && dateRange.end) {
        query.date = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end)
        };
      }

      // Add category filter
      if (category) {
        query.category = category;
      }

      // Add employee filter
      if (employee) {
        query.employeeId = new mongoose.Types.ObjectId(employee);
      }

      // Add amount range filter
      if (amountMin || amountMax) {
        query.convertedAmount = {};
        if (amountMin) query.convertedAmount.$gte = parseFloat(amountMin);
        if (amountMax) query.convertedAmount.$lte = parseFloat(amountMax);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with aggregation for better performance
      const expenses = await Expense.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'expenselogs',
            localField: '_id',
            foreignField: 'expenseId',
            as: 'logs'
          }
        },
        {
          $addFields: {
            currentApprover: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$approvals',
                    cond: { $eq: ['$$this.status', 'PENDING'] }
                  }
                },
                0
              ]
            },
            daysPending: {
              $divide: [
                { $subtract: [new Date(), '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $match: {
            'currentApprover.approverRole': { $in: ['MANAGER', 'DIRECTOR', 'FINANCE', 'CFO'] }
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        },
        {
          $project: {
            _id: 1,
            amount: 1,
            convertedAmount: 1,
            currency: 1,
            category: 1,
            description: 1,
            date: 1,
            status: 1,
            currentApprovalStep: 1,
            totalApprovalSteps: 1,
            createdAt: 1,
            currentApprover: 1,
            daysPending: 1,
            employeeId: 1,
            conditionalRules: 1,
            rulesEvaluated: 1
          }
        }
      ]);

      // Get total count for pagination
      const totalCount = await Expense.countDocuments(query);

      console.log(`📊 Found ${expenses.length} pending expenses (${totalCount} total)`);
      
      return {
        expenses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        },
        filters: filters
      };
    } catch (error) {
      console.error('❌ Error getting pending expenses:', error);
      throw error;
    }
  },

  // Get expense history with comprehensive filters
  getExpenseHistory: async (companyId, filters = {}) => {
    try {
      console.log(`📚 Getting expense history for company ${companyId} with filters:`, filters);
      
      const {
        dateRange,
        category,
        employee,
        status,
        amountMin,
        amountMax,
        limit = 50,
        page = 1,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Build query
      const query = {
        companyId: new mongoose.Types.ObjectId(companyId)
      };

      // Add status filter (if not provided, get all non-pending)
      if (status) {
        query.status = status;
      } else {
        query.status = { $in: ['APPROVED', 'REJECTED'] };
      }

      // Add date range filter
      if (dateRange && dateRange.start && dateRange.end) {
        query.date = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end)
        };
      }

      // Add category filter
      if (category) {
        query.category = category;
      }

      // Add employee filter
      if (employee) {
        query.employeeId = new mongoose.Types.ObjectId(employee);
      }

      // Add amount range filter
      if (amountMin || amountMax) {
        query.convertedAmount = {};
        if (amountMin) query.convertedAmount.$gte = parseFloat(amountMin);
        if (amountMax) query.convertedAmount.$lte = parseFloat(amountMax);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with aggregation
      const expenses = await Expense.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'expenselogs',
            localField: '_id',
            foreignField: 'expenseId',
            as: 'logs'
          }
        },
        {
          $addFields: {
            finalApprover: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$logs',
                    cond: { $in: ['$$this.action', ['APPROVED', 'REJECTED']] }
                  }
                },
                -1
              ]
            },
            processingTime: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $sort: sort
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        },
        {
          $project: {
            _id: 1,
            amount: 1,
            convertedAmount: 1,
            currency: 1,
            category: 1,
            description: 1,
            date: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            finalApprover: 1,
            processingTime: 1,
            employeeId: 1,
            conditionalRules: 1,
            rulesEvaluated: 1
          }
        }
      ]);

      // Get total count for pagination
      const totalCount = await Expense.countDocuments(query);

      console.log(`📊 Found ${expenses.length} historical expenses (${totalCount} total)`);
      
      return {
        expenses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        },
        filters: filters
      };
    } catch (error) {
      console.error('❌ Error getting expense history:', error);
      throw error;
    }
  },

  // Get dashboard statistics with aggregation pipelines
  getDashboardStats: async (companyId, dateRange = null) => {
    try {
      console.log(`📊 Getting dashboard statistics for company ${companyId}`);
      
      // Build base match query
      const baseMatch = {
        companyId: new mongoose.Types.ObjectId(companyId)
      };

      // Add date range if provided
      if (dateRange && dateRange.start && dateRange.end) {
        baseMatch.date = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end)
        };
      }

      // Get counts per status
      const statusCounts = await Expense.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$convertedAmount' }
          }
        }
      ]);

      // Get total approved amount per employee
      const employeeStats = await Expense.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            status: 'APPROVED' 
          } 
        },
        {
          $group: {
            _id: '$employeeId',
            approvedCount: { $sum: 1 },
            totalApprovedAmount: { $sum: '$convertedAmount' },
            avgAmount: { $avg: '$convertedAmount' }
          }
        },
        {
          $sort: { totalApprovedAmount: -1 }
        },
        {
          $limit: 10
        }
      ]);

      // Get category breakdown
      const categoryStats = await Expense.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalAmount: { $sum: '$convertedAmount' },
            avgAmount: { $avg: '$convertedAmount' }
          }
        },
        {
          $sort: { totalAmount: -1 }
        }
      ]);

      // Get approval time statistics
      const approvalTimeStats = await Expense.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            status: { $in: ['APPROVED', 'REJECTED'] } 
          } 
        },
        {
          $addFields: {
            processingTime: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgProcessingTime: { $avg: '$processingTime' },
            minProcessingTime: { $min: '$processingTime' },
            maxProcessingTime: { $max: '$processingTime' }
          }
        }
      ]);

      // Get monthly trends
      const monthlyTrends = await Expense.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              status: '$status'
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$convertedAmount' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      // Format status counts
      const formattedStatusCounts = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0
      };

      statusCounts.forEach(stat => {
        formattedStatusCounts[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount
        };
      });

      console.log(`📊 Dashboard statistics calculated successfully`);
      
      return {
        statusCounts: formattedStatusCounts,
        employeeStats,
        categoryStats,
        approvalTimeStats: approvalTimeStats[0] || {
          avgProcessingTime: 0,
          minProcessingTime: 0,
          maxProcessingTime: 0
        },
        monthlyTrends,
        dateRange: dateRange
      };
    } catch (error) {
      console.error('❌ Error getting dashboard statistics:', error);
      throw error;
    }
  },

  // Export expenses to CSV format
  exportExpenses: async (companyId, filters = {}) => {
    try {
      console.log(`📤 Exporting expenses for company ${companyId} with filters:`, filters);
      
      const {
        dateRange,
        category,
        employee,
        status,
        amountMin,
        amountMax,
        format = 'csv'
      } = filters;

      // Build query (similar to getExpenseHistory)
      const query = {
        companyId: new mongoose.Types.ObjectId(companyId)
      };

      if (status) {
        query.status = status;
      }

      if (dateRange && dateRange.start && dateRange.end) {
        query.date = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end)
        };
      }

      if (category) {
        query.category = category;
      }

      if (employee) {
        query.employeeId = new mongoose.Types.ObjectId(employee);
      }

      if (amountMin || amountMax) {
        query.convertedAmount = {};
        if (amountMin) query.convertedAmount.$gte = parseFloat(amountMin);
        if (amountMax) query.convertedAmount.$lte = parseFloat(amountMax);
      }

      // Get expenses with all necessary data
      const expenses = await Expense.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'expenselogs',
            localField: '_id',
            foreignField: 'expenseId',
            as: 'logs'
          }
        },
        {
          $addFields: {
            finalApprover: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$logs',
                    cond: { $in: ['$$this.action', ['APPROVED', 'REJECTED']] }
                  }
                },
                -1
              ]
            },
            processingTime: {
              $divide: [
                { $subtract: ['$updatedAt', '$createdAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $project: {
            _id: 1,
            amount: 1,
            convertedAmount: 1,
            currency: 1,
            category: 1,
            description: 1,
            date: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            employeeId: 1,
            finalApprover: 1,
            processingTime: 1
          }
        }
      ]);

      if (format === 'csv') {
        // Generate CSV content
        const csvHeaders = [
          'Expense ID',
          'Amount',
          'Currency',
          'Category',
          'Description',
          'Date',
          'Status',
          'Created At',
          'Updated At',
          'Employee ID',
          'Final Approver',
          'Processing Time (Days)'
        ];

        const csvRows = expenses.map(expense => [
          expense._id.toString(),
          expense.convertedAmount,
          expense.currency,
          expense.category,
          expense.description,
          expense.date.toISOString().split('T')[0],
          expense.status,
          expense.createdAt.toISOString(),
          expense.updatedAt.toISOString(),
          expense.employeeId.toString(),
          expense.finalApprover?.performedByRole || 'N/A',
          expense.processingTime.toFixed(2)
        ]);

        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        console.log(`📤 Exported ${expenses.length} expenses to CSV format`);
        
        return {
          format: 'csv',
          content: csvContent,
          filename: `expenses_export_${new Date().toISOString().split('T')[0]}.csv`,
          count: expenses.length,
          filters: filters
        };
      }

      // Return JSON format
      return {
        format: 'json',
        data: expenses,
        count: expenses.length,
        filters: filters
      };
    } catch (error) {
      console.error('❌ Error exporting expenses:', error);
      throw error;
    }
  }
};

module.exports = dashboardService;