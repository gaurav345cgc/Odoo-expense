// --- Existing code (do not change) ---
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import configurations
const config = require('./config/env');
const connectDB = require('./config/db');

// Import models (for testing connection)
const Expense = require('./models/Expense');
const ExpenseLog = require('./models/ExpenseLog');

// Import routes
const expenseRoutes = require('./routes/expense.routes');
const ocrRoutes = require('./routes/ocr.routes');
const approvalRoutes = require('./routes/approval.routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors())

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files middleware
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: '1.0.0'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    message: 'Expense Management System API',
    version: '1.0.0',
    developer: 'Developer 2',
    phase: 'Phase 7 - Developer 1 Integration Complete',
    features: [
      'Expense CRUD Operations',
      'Multi-step Approval Workflow',
      'OCR Receipt Processing',
      'Currency Conversion',
      'Audit Trail Logging',
      'Conditional Approval Rules',
      'Percentage-based Auto-approval',
      'Specific Approver Rules',
      'Hybrid Rule Engine',
      'Rule Evaluation Traceability',
      'Manager Dashboard APIs',
      'Pending Expenses with Filters',
      'Expense History Analytics',
      'Dashboard Statistics',
      'CSV Export Functionality',
      'Developer 1 Authentication System',
      'User Management Integration',
      'Company Management Integration',
      'JWT Authentication',
      'Role-based Access Control'
    ],
    endpoints: {
      health: '/health',
      status: '/api/status',
      expenses: '/api/expenses (Phase 2 - Active)',
      ocr: '/api/expenses/ocr-* (Phase 3 - Active)',
      workflow: '/api/workflow (Phase 4 - Active)',
      conditional: '/api/test/*-rules* (Phase 5 - Active)',
      dashboard: '/api/manager/* (Phase 6 - Active)',
      auth: '/api/auth/* (Developer 1 - Active)',
      users: '/api/users/* (Developer 1 - Active)',
      companies: '/api/companies/* (Developer 1 - Active)'
    }
  });
});

// Mock authentication middleware (for Phase 1 testing)
app.use((req, res, next) => {
  // Mock user data for testing (will be replaced by Developer 1's auth)
  req.user = {
    _id: config.MOCK_EMPLOYEE_ID,
    employeeId: config.MOCK_EMPLOYEE_ID, // Add employeeId for Phase 2
    name: 'John Doe',
    email: 'john.doe@company.com',
    role: 'EMPLOYEE',
    companyId: config.MOCK_COMPANY_ID
  };
  next();
});

// API Routes (OCR routes first to avoid conflicts with :id pattern)
app.use('/api/expenses', ocrRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/workflow', approvalRoutes);
app.use('/api/manager', require('./routes/dashboard.routes'));

// Developer 1 Integration Routes
app.use('/api/auth', require('./modules/auth-company/routes/authRoutes'));
app.use('/api/users', require('./modules/auth-company/routes/userRoutes'));
app.use('/api/companies', require('./modules/auth-company/routes/companyRoutes'));

// Test endpoints without authentication middleware for Phase 4 testing
app.post('/api/test/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, approverRole } = req.body;
    
    // Mock approver data for testing
    const mockApprover = {
      _id: config.MOCK_MANAGER_ID,
      employeeId: config.MOCK_MANAGER_ID,
      name: 'Test Manager',
      email: 'manager@test.com',
      role: approverRole || 'MANAGER',
      companyId: config.MOCK_COMPANY_ID
    };
    
    // Temporarily override req.user for this request
    req.user = mockApprover;
    
    const approvalService = require('./services/approval.service');
    const expense = await approvalService.approveExpense(id, mockApprover.employeeId, mockApprover.role, comments || 'Test approval');
    
    res.status(200).json({
      message: 'Test approval successful',
      expense: {
        id: expense._id,
        amount: expense.convertedAmount,
        currency: expense.currency,
        category: expense.category,
        status: expense.status,
        currentApprovalStep: expense.currentApprovalStep,
        totalApprovalSteps: expense.totalApprovalSteps
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test approval failed',
      error: error.message
    });
  }
});

app.post('/api/test/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, approverRole } = req.body;
    
    // Mock approver data for testing
    const mockApprover = {
      _id: config.MOCK_MANAGER_ID,
      employeeId: config.MOCK_MANAGER_ID,
      name: 'Test Manager',
      email: 'manager@test.com',
      role: approverRole || 'MANAGER',
      companyId: config.MOCK_COMPANY_ID
    };
    
    // Temporarily override req.user for this request
    req.user = mockApprover;
    
    const approvalService = require('./services/approval.service');
    const expense = await approvalService.rejectExpense(id, mockApprover.employeeId, mockApprover.role, comments || 'Test rejection');
    
    res.status(200).json({
      message: 'Test rejection successful',
      expense: {
        id: expense._id,
        amount: expense.convertedAmount,
        currency: expense.currency,
        category: expense.category,
        status: expense.status
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test rejection failed',
      error: error.message
    });
  }
});

app.get('/api/test/pending', async (req, res) => {
  try {
    const { approverRole } = req.query;
    
    // Mock approver data for testing
    const mockApprover = {
      _id: config.MOCK_MANAGER_ID,
      employeeId: config.MOCK_MANAGER_ID,
      name: 'Test Manager',
      email: 'manager@test.com',
      role: approverRole || 'MANAGER',
      companyId: config.MOCK_COMPANY_ID
    };
    
    // Temporarily override req.user for this request
    req.user = mockApprover;
    
    const approvalService = require('./services/approval.service');
    const pendingExpenses = await approvalService.getPendingExpenses(mockApprover.employeeId, mockApprover.role, mockApprover.companyId);
    
    res.status(200).json({
      message: 'Test pending expenses retrieved',
      approver: {
        id: mockApprover.employeeId,
        role: mockApprover.role
      },
      pendingExpenses: pendingExpenses.map(expense => ({
        id: expense._id,
        amount: expense.convertedAmount,
        currency: expense.currency,
        category: expense.category,
        description: expense.description,
        currentApprovalStep: expense.currentApprovalStep,
        totalApprovalSteps: expense.totalApprovalSteps
      })),
      count: pendingExpenses.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test pending expenses failed',
      error: error.message
    });
  }
});

// Test endpoint for conditional approval workflows
app.post('/api/test/start-conditional/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { directorOnly, managerOnly } = req.body;
    const employeeId = config.MOCK_EMPLOYEE_ID;
    const companyId = config.MOCK_COMPANY_ID;

    console.log(`🚀 Starting conditional approval for expense ${id}`);

    const options = {};
    if (directorOnly) options.directorOnly = true;
    if (managerOnly) options.managerOnly = true;

    const approvalService = require('./services/approval.service');
    const expense = await approvalService.startApproval(id, employeeId, companyId, options);

    res.status(200).json({
      message: 'Conditional approval workflow started successfully',
      options: options,
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
    res.status(500).json({
      message: 'Test conditional approval failed',
      error: error.message
    });
  }
});

// Test endpoint for creating expense with conditional approval
app.post('/api/test/expense-conditional', async (req, res) => {
  try {
    const { amount, currency, category, description, date, directorOnly, managerOnly } = req.body;
    const employeeId = config.MOCK_EMPLOYEE_ID;
    const companyId = config.MOCK_COMPANY_ID;

    console.log(`💰 Creating conditional expense with amount: $${amount}`);

    // Create expense
    const expenseService = require('./services/expense.service');
    const newExpense = await expenseService.createExpense({
      amount: amount || 500,
      currency: currency || 'USD',
      category: category || 'MEALS',
      description: description || 'Test conditional expense',
      date: date || new Date()
    }, employeeId, companyId);

    // Start conditional approval workflow
    const options = {};
    if (directorOnly) options.directorOnly = true;
    if (managerOnly) options.managerOnly = true;

    const approvalService = require('./services/approval.service');
    const approvedExpense = await approvalService.startApproval(newExpense._id, employeeId, companyId, options);

    res.status(201).json({
      message: 'Conditional expense created and approval started',
      options: options,
      expense: {
        id: approvedExpense._id,
        amount: approvedExpense.convertedAmount,
        currency: approvedExpense.currency,
        category: approvedExpense.category,
        status: approvedExpense.status,
        currentApprovalStep: approvedExpense.currentApprovalStep,
        totalApprovalSteps: approvedExpense.totalApprovalSteps,
        approvalRules: approvedExpense.approvalRules,
        approvals: approvedExpense.approvals
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test conditional expense creation failed',
      error: error.message
    });
  }
});

// Phase 5: Conditional Rules Test Endpoints

// Apply conditional rules to an expense
app.post('/api/test/apply-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ruleIds } = req.body;

    console.log(`🔧 Applying conditional rules to expense ${id}`);

    const approvalService = require('./services/approval.service');
    const expense = await approvalService.applyConditionalRules(id, ruleIds);

    res.status(200).json({
      message: 'Conditional rules applied successfully',
      expense: {
        id: expense._id,
        amount: expense.convertedAmount,
        currency: expense.currency,
        category: expense.category,
        conditionalRules: expense.conditionalRules,
        rulesEvaluated: expense.rulesEvaluated
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test apply rules failed',
      error: error.message
    });
  }
});

// Get rule evaluation summary
app.get('/api/test/rules-summary/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📊 Getting rule evaluation summary for expense ${id}`);

    const approvalService = require('./services/approval.service');
    const summary = await approvalService.getRuleEvaluationSummary(id);

    res.status(200).json({
      message: 'Rule evaluation summary retrieved',
      expenseId: id,
      summary
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test rules summary failed',
      error: error.message
    });
  }
});

// Create expense with conditional rules
app.post('/api/test/expense-with-rules', async (req, res) => {
  try {
    const { amount, currency, category, description, date, ruleIds } = req.body;
    const employeeId = config.MOCK_EMPLOYEE_ID;
    const companyId = config.MOCK_COMPANY_ID;

    console.log(`💰 Creating expense with conditional rules: $${amount}`);

    // Create expense
    const expenseService = require('./services/expense.service');
    const newExpense = await expenseService.createExpense({
      amount: amount || 500,
      currency: currency || 'USD',
      category: category || 'MEALS',
      description: description || 'Test expense with conditional rules',
      date: date || new Date()
    }, employeeId, companyId);

    // Apply conditional rules
    const approvalService = require('./services/approval.service');
    const expenseWithRules = await approvalService.applyConditionalRules(newExpense._id, ruleIds);

    // Start approval workflow
    const approvedExpense = await approvalService.startApproval(expenseWithRules._id, employeeId, companyId);

    res.status(201).json({
      message: 'Expense with conditional rules created and approval started',
      expense: {
        id: approvedExpense._id,
        amount: approvedExpense.convertedAmount,
        currency: approvedExpense.currency,
        category: approvedExpense.category,
        status: approvedExpense.status,
        currentApprovalStep: approvedExpense.currentApprovalStep,
        totalApprovalSteps: approvedExpense.totalApprovalSteps,
        conditionalRules: approvedExpense.conditionalRules,
        rulesEvaluated: approvedExpense.rulesEvaluated
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test expense with rules creation failed',
      error: error.message
    });
  }
});

// Test conditional rule evaluation
app.post('/api/test/evaluate-rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, approverRole } = req.body;

    console.log(`🔍 Testing rule evaluation for expense ${id}`);

    const conditionalService = require('./services/conditional.service');
    const Expense = require('./models/Expense');
    
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const evaluation = await conditionalService.evaluateRules(
      expense, 
      action || 'APPROVED', 
      approverRole || 'MANAGER', 
      config.MOCK_MANAGER_ID
    );

    // Save the evaluation results to the database
    await expense.save();

    res.status(200).json({
      message: 'Rule evaluation completed and saved',
      expenseId: id,
      action: action || 'APPROVED',
      approverRole: approverRole || 'MANAGER',
      evaluation,
      rulesEvaluatedCount: expense.rulesEvaluated.length
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test rule evaluation failed',
      error: error.message
    });
  }
});

// Get available mock rules
app.get('/api/test/mock-rules', async (req, res) => {
  try {
    const conditionalService = require('./services/conditional.service');
    const mockRules = conditionalService.loadMockRules();

    res.status(200).json({
      message: 'Mock rules retrieved successfully',
      rules: mockRules
    });
  } catch (error) {
    res.status(500).json({
      message: 'Test mock rules failed',
      error: error.message
    });
  }
});

// Basic expense routes (placeholder for Phase 2 - keeping for backward compatibility)
app.get('/api/expenses/test', async (req, res) => {
  try {
    const expenses = await Expense.find({})
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.status(200).json({
      message: 'Expense model test successful',
      count: expenses.length,
      expenses: expenses.map(expense => ({
        id: expense._id,
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        status: expense.status,
        createdAt: expense.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error testing expense model',
      error: error.message
    });
  }
});

// Basic log routes (placeholder for Phase 2)
app.get('/api/logs/test', async (req, res) => {
  try {
    const logs = await ExpenseLog.find({})
      .sort({ timestamp: -1 })
      .limit(5);
    
    res.status(200).json({
      message: 'ExpenseLog model test successful',
      count: logs.length,
      logs: logs.map(log => ({
        id: log._id,
        action: log.action,
        performedByRole: log.performedByRole,
        timestamp: log.timestamp
      }))
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error testing expense log model',
      error: error.message
    });
  }
});

// Database connection test endpoint
app.get('/api/db/test', async (req, res) => {
  try {
    // Test database connection
    const expenseCount = await Expense.countDocuments();
    const logCount = await ExpenseLog.countDocuments();
    
    res.status(200).json({
      message: 'Database connection successful',
      collections: {
        expenses: expenseCount,
        expenseLogs: logCount
      },
      mockData: {
        companyId: config.MOCK_COMPANY_ID,
        employeeId: config.MOCK_EMPLOYEE_ID,
        managerId: config.MOCK_MANAGER_ID,
        adminId: config.MOCK_ADMIN_ID
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Phase 7: Integration Test Endpoints - COMMENTED OUT (files deleted)
// Uncomment when integration files are recreated

// Phase 6: Manager Dashboard Test Endpoints

// Test pending expenses endpoint
app.get('/api/test/manager/pending', async (req, res) => {
  try {
    const dashboardController = require('./controllers/dashboard.controller');
    req.query = { ...req.query, companyId: config.MOCK_COMPANY_ID };
    await dashboardController.getPendingExpenses(req, res);
  } catch (error) {
    res.status(500).json({
      message: 'Test pending expenses failed',
      error: error.message
    });
  }
});

// Test expense history endpoint
app.get('/api/test/manager/history', async (req, res) => {
  try {
    const dashboardController = require('./controllers/dashboard.controller');
    req.query = { ...req.query, companyId: config.MOCK_COMPANY_ID };
    await dashboardController.getExpenseHistory(req, res);
  } catch (error) {
    res.status(500).json({
      message: 'Test expense history failed',
      error: error.message
    });
  }
});

// Test dashboard statistics endpoint
app.get('/api/test/manager/stats', async (req, res) => {
  try {
    const dashboardController = require('./controllers/dashboard.controller');
    req.query = { ...req.query, companyId: config.MOCK_COMPANY_ID };
    await dashboardController.getDashboardStats(req, res);
  } catch (error) {
    res.status(500).json({
      message: 'Test dashboard stats failed',
      error: error.message
    });
  }
});

// Test export endpoint
app.get('/api/test/manager/export', async (req, res) => {
  try {
    const dashboardController = require('./controllers/dashboard.controller');
    req.query = { ...req.query, companyId: config.MOCK_COMPANY_ID };
    await dashboardController.exportExpenses(req, res);
  } catch (error) {
    res.status(500).json({
      message: 'Test export failed',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    availableRoutes: [
      'GET /health',
      'GET /api/status',
      'GET /api/expenses/test',
      'GET /api/logs/test',
      'GET /api/db/test',
      'GET /api/test/manager/pending',
      'GET /api/test/manager/history',
      'GET /api/test/manager/stats',
      'GET /api/test/manager/export',
      'GET /api/manager/pending',
      'GET /api/manager/history',
      'GET /api/manager/stats',
      'GET /api/manager/export',
      'POST /api/auth/login',
      'POST /api/auth/signup',
      'GET /api/auth/me',
      'GET /api/users',
      'POST /api/users',
      'PATCH /api/users/:id/role',
      'PATCH /api/users/:id/manager',
      'GET /api/companies/me',
      'PATCH /api/companies/me'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    message: error.message || 'Internal server error',
    ...(config.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start listening
    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log('🚀 Expense Management System Server Started');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API status: http://localhost:${PORT}/api/status`);
      console.log(`🧪 Test endpoints:`);
      console.log(`   - Expenses: http://localhost:${PORT}/api/expenses/test`);
      console.log(`   - Logs: http://localhost:${PORT}/api/logs/test`);
      console.log(`   - Database: http://localhost:${PORT}/api/db/test`);
      console.log('\n📋 Phase 7 Complete: Developer 1 Integration');
      console.log('🎯 Full System Ready - Auth + Expense Management');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
