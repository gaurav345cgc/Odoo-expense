const dashboardService = require('../services/dashboard.service');
const config = require('../config/env');

const dashboardController = {
  // Get pending expenses for managers
  getPendingExpenses: async (req, res) => {
    try {
      const companyId = req.query.companyId || config.MOCK_COMPANY_ID;
      
      // Parse query parameters
      const filters = {
        dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange) : null,
        category: req.query.category || null,
        employee: req.query.employee || null,
        amountMin: req.query.amountMin ? parseFloat(req.query.amountMin) : null,
        amountMax: req.query.amountMax ? parseFloat(req.query.amountMax) : null,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
        page: req.query.page ? parseInt(req.query.page) : 1
      };

      console.log(`📋 Getting pending expenses for company ${companyId}`);

      const result = await dashboardService.getPendingExpenses(companyId, filters);

      res.status(200).json({
        message: 'Pending expenses retrieved successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in getPendingExpenses controller:', error);
      res.status(500).json({
        message: 'Failed to retrieve pending expenses',
        error: error.message
      });
    }
  },

  // Get expense history
  getExpenseHistory: async (req, res) => {
    try {
      const companyId = req.query.companyId || config.MOCK_COMPANY_ID;
      
      // Parse query parameters
      const filters = {
        dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange) : null,
        category: req.query.category || null,
        employee: req.query.employee || null,
        status: req.query.status || null,
        amountMin: req.query.amountMin ? parseFloat(req.query.amountMin) : null,
        amountMax: req.query.amountMax ? parseFloat(req.query.amountMax) : null,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
        page: req.query.page ? parseInt(req.query.page) : 1,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      console.log(`📚 Getting expense history for company ${companyId}`);

      const result = await dashboardService.getExpenseHistory(companyId, filters);

      res.status(200).json({
        message: 'Expense history retrieved successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in getExpenseHistory controller:', error);
      res.status(500).json({
        message: 'Failed to retrieve expense history',
        error: error.message
      });
    }
  },

  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      const companyId = req.query.companyId || config.MOCK_COMPANY_ID;
      const dateRange = req.query.dateRange ? JSON.parse(req.query.dateRange) : null;

      console.log(`📊 Getting dashboard statistics for company ${companyId}`);

      const result = await dashboardService.getDashboardStats(companyId, dateRange);

      res.status(200).json({
        message: 'Dashboard statistics retrieved successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error in getDashboardStats controller:', error);
      res.status(500).json({
        message: 'Failed to retrieve dashboard statistics',
        error: error.message
      });
    }
  },

  // Export expenses
  exportExpenses: async (req, res) => {
    try {
      const companyId = req.query.companyId || config.MOCK_COMPANY_ID;
      
      // Parse query parameters
      const filters = {
        dateRange: req.query.dateRange ? JSON.parse(req.query.dateRange) : null,
        category: req.query.category || null,
        employee: req.query.employee || null,
        status: req.query.status || null,
        amountMin: req.query.amountMin ? parseFloat(req.query.amountMin) : null,
        amountMax: req.query.amountMax ? parseFloat(req.query.amountMax) : null,
        format: req.query.format || 'csv'
      };

      console.log(`📤 Exporting expenses for company ${companyId}`);

      const result = await dashboardService.exportExpenses(companyId, filters);

      if (result.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
        res.status(200).send(result.content);
      } else {
        res.status(200).json({
          message: 'Expenses exported successfully',
          data: result,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error in exportExpenses controller:', error);
      res.status(500).json({
        message: 'Failed to export expenses',
        error: error.message
      });
    }
  }
};

module.exports = dashboardController;