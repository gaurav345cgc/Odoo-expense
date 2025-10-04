/**
 * Complete System Test Suite
 * Tests every endpoint in the Expense Management System
 * Including Developer 1 (Auth/Users/Company) and Developer 2 (Expenses/OCR/Workflow/Dashboard)
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

let testData = {
  userId: null,
  token: null,
  companyId: null,
  managerId: null,
  employeeId: null,
  expenseId: null,
  expenseId2: null,
  expenseId3: null
};

// Helper function to log test results
function logTest(category, testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`${colors.green}✓${colors.reset} [${category}] ${testName}`);
  } else {
    testResults.failed++;
    console.log(`${colors.red}✗${colors.reset} [${category}] ${testName}`);
    if (details) console.log(`  ${colors.red}${details}${colors.reset}`);
  }
  testResults.details.push({ category, testName, passed, details });
}

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test Categories
async function testSystemHealth() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  SYSTEM HEALTH & STATUS TESTS${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Health Check
  const health = await apiRequest('GET', '/health');
  logTest('System', 'Health check endpoint', health.success && health.data.status === 'OK', 
    !health.success ? JSON.stringify(health.error) : '');

  // Test 2: API Status
  const status = await apiRequest('GET', '/api/status');
  logTest('System', 'API status endpoint', status.success && status.data.phase.includes('Phase 7'),
    !status.success ? JSON.stringify(status.error) : '');

  // Test 3: Database Test
  const dbTest = await apiRequest('GET', '/api/db/test');
  logTest('System', 'Database connection test', dbTest.success,
    !dbTest.success ? JSON.stringify(dbTest.error) : '');
}

async function testAuthentication() {
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}  AUTHENTICATION TESTS (Developer 1)${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const timestamp = Date.now();
  const testEmail = `admin${timestamp}@testcompany.com`;

  // Test 1: User Signup
  const signup = await apiRequest('POST', '/api/auth/signup', {
    name: 'Test Admin',
    email: testEmail,
    password: 'testpass123',
    country: 'USA'
  });
  logTest('Auth', 'User signup', signup.success && signup.status === 201,
    !signup.success ? JSON.stringify(signup.error) : '');
  
  if (signup.success) {
    testData.token = signup.data.data.token;
    testData.userId = signup.data.data.user._id;
    testData.companyId = signup.data.data.company._id;
  }

  // Test 2: User Login
  const login = await apiRequest('POST', '/api/auth/login', {
    email: testEmail,
    password: 'testpass123'
  });
  logTest('Auth', 'User login', login.success && login.status === 200,
    !login.success ? JSON.stringify(login.error) : '');

  // Test 3: Login with invalid credentials
  const invalidLogin = await apiRequest('POST', '/api/auth/login', {
    email: testEmail,
    password: 'wrongpassword'
  });
  logTest('Auth', 'Login with invalid credentials (should fail)', !invalidLogin.success && invalidLogin.status === 401,
    invalidLogin.success ? 'Should have failed but succeeded' : '');

  // Test 4: Duplicate signup
  const duplicateSignup = await apiRequest('POST', '/api/auth/signup', {
    name: 'Test Admin',
    email: testEmail,
    password: 'testpass123',
    country: 'USA'
  });
  logTest('Auth', 'Duplicate signup (should fail)', !duplicateSignup.success && duplicateSignup.status === 409,
    duplicateSignup.success ? 'Should have failed but succeeded' : '');
}

async function testUserManagement() {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  USER MANAGEMENT TESTS (Developer 1)${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const timestamp = Date.now();

  // Test 1: Create Manager
  const createManager = await apiRequest('POST', '/api/users', {
    name: 'Test Manager',
    email: `manager${timestamp}@testcompany.com`,
    password: 'manager123',
    role: 'Manager'
  });
  logTest('Users', 'Create manager user', createManager.success && createManager.status === 201,
    !createManager.success ? JSON.stringify(createManager.error) : '');
  
  if (createManager.success) {
    testData.managerId = createManager.data.data._id;
  }

  // Test 2: Create Employee
  const createEmployee = await apiRequest('POST', '/api/users', {
    name: 'Test Employee',
    email: `employee${timestamp}@testcompany.com`,
    password: 'employee123',
    role: 'Employee',
    managerId: testData.managerId
  });
  logTest('Users', 'Create employee user', createEmployee.success && createEmployee.status === 201,
    !createEmployee.success ? JSON.stringify(createEmployee.error) : '');
  
  if (createEmployee.success) {
    testData.employeeId = createEmployee.data.data._id;
  }

  // Test 3: Get All Users
  const getAllUsers = await apiRequest('GET', '/api/users');
  logTest('Users', 'Get all users', getAllUsers.success && Array.isArray(getAllUsers.data.data),
    !getAllUsers.success ? JSON.stringify(getAllUsers.error) : '');

  // Test 4: Update User Role
  if (testData.employeeId) {
    const updateRole = await apiRequest('PATCH', `/api/users/${testData.employeeId}/role`, {
      role: 'Manager'
    });
    logTest('Users', 'Update user role', updateRole.success && updateRole.status === 200,
      !updateRole.success ? JSON.stringify(updateRole.error) : '');
  }

  // Test 5: Assign Manager
  if (testData.employeeId && testData.managerId) {
    const assignManager = await apiRequest('PATCH', `/api/users/${testData.employeeId}/manager`, {
      managerId: testData.managerId
    });
    logTest('Users', 'Assign user manager', assignManager.success && assignManager.status === 200,
      !assignManager.success ? JSON.stringify(assignManager.error) : '');
  }
}

async function testCompanyManagement() {
  console.log(`\n${colors.bright}${colors.yellow}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}  COMPANY MANAGEMENT TESTS (Developer 1)${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Get Company Details
  const getCompany = await apiRequest('GET', '/api/companies/me');
  logTest('Company', 'Get company details', getCompany.success && getCompany.data.data._id === testData.companyId,
    !getCompany.success ? JSON.stringify(getCompany.error) : '');

  // Test 2: Update Company
  const updateCompany = await apiRequest('PATCH', '/api/companies/me', {
    name: 'Updated Test Company',
    baseCurrency: 'EUR'
  });
  logTest('Company', 'Update company details', updateCompany.success && updateCompany.status === 200,
    !updateCompany.success ? JSON.stringify(updateCompany.error) : '');
}

async function testExpenseUtilities() {
  console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green}  EXPENSE UTILITIES TESTS (Developer 2)${colors.reset}`);
  console.log(`${colors.green}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Get Supported Currencies
  const currencies = await apiRequest('GET', '/api/expenses/currencies');
  logTest('Utilities', 'Get supported currencies', currencies.success && Array.isArray(currencies.data.currencies),
    !currencies.success ? JSON.stringify(currencies.error) : '');

  // Test 2: Get Expense Categories
  const categories = await apiRequest('GET', '/api/expenses/categories');
  logTest('Utilities', 'Get expense categories', categories.success && Array.isArray(categories.data.categories),
    !categories.success ? JSON.stringify(categories.error) : '');

  // Test 3: Test Currency Conversion
  const conversion = await apiRequest('GET', '/api/expenses/test-conversion', {
    amount: 100,
    from: 'USD',
    to: 'EUR'
  });
  logTest('Utilities', 'Test currency conversion', conversion.success && conversion.data.conversion,
    !conversion.success ? JSON.stringify(conversion.error) : '');
}

async function testExpenseManagement() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  EXPENSE MANAGEMENT TESTS (Developer 2)${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Create Expense
  const createExpense = await apiRequest('POST', '/api/expenses', {
    amount: 150.50,
    currency: 'USD',
    category: 'TRAVEL',
    description: 'Business trip for client meeting',
    date: new Date().toISOString()
  });
  logTest('Expenses', 'Create expense', createExpense.success && createExpense.status === 201,
    !createExpense.success ? JSON.stringify(createExpense.error) : '');
  
  if (createExpense.success) {
    testData.expenseId = createExpense.data.expense.id;
  }

  // Test 2: Create Another Expense
  const createExpense2 = await apiRequest('POST', '/api/expenses', {
    amount: 75.25,
    currency: 'EUR',
    category: 'MEALS',
    description: 'Team lunch',
    date: new Date().toISOString()
  });
  logTest('Expenses', 'Create second expense', createExpense2.success && createExpense2.status === 201,
    !createExpense2.success ? JSON.stringify(createExpense2.error) : '');
  
  if (createExpense2.success) {
    testData.expenseId2 = createExpense2.data.expense.id;
  }

  // Test 3: Create Large Expense (for workflow testing)
  const createExpense3 = await apiRequest('POST', '/api/expenses', {
    amount: 5000,
    currency: 'USD',
    category: 'ACCOMMODATION',
    description: 'Conference accommodation for team',
    date: new Date().toISOString()
  });
  logTest('Expenses', 'Create large expense', createExpense3.success && createExpense3.status === 201,
    !createExpense3.success ? JSON.stringify(createExpense3.error) : '');
  
  if (createExpense3.success) {
    testData.expenseId3 = createExpense3.data.expense.id;
  }

  // Test 4: Get Expense by ID
  if (testData.expenseId) {
    const getExpense = await apiRequest('GET', `/api/expenses/${testData.expenseId}`);
    logTest('Expenses', 'Get expense by ID', getExpense.success && getExpense.data.expense.id === testData.expenseId,
      !getExpense.success ? JSON.stringify(getExpense.error) : '');
  }

  // Test 5: Get My Expenses
  const myExpenses = await apiRequest('GET', '/api/expenses/my', {
    page: 1,
    limit: 10
  });
  logTest('Expenses', 'Get my expenses with pagination', myExpenses.success && Array.isArray(myExpenses.data.expenses),
    !myExpenses.success ? JSON.stringify(myExpenses.error) : '');

  // Test 6: Get My Expenses with Filters
  const filteredExpenses = await apiRequest('GET', '/api/expenses/my', {
    page: 1,
    limit: 10,
    category: 'TRAVEL',
    status: 'PENDING'
  });
  logTest('Expenses', 'Get my expenses with filters', filteredExpenses.success,
    !filteredExpenses.success ? JSON.stringify(filteredExpenses.error) : '');

  // Test 7: Update Expense
  if (testData.expenseId) {
    const updateExpense = await apiRequest('PATCH', `/api/expenses/${testData.expenseId}`, {
      amount: 175.00,
      description: 'Updated business trip description'
    });
    logTest('Expenses', 'Update expense', updateExpense.success && updateExpense.status === 200,
      !updateExpense.success ? JSON.stringify(updateExpense.error) : '');
  }

  // Test 8: Get Expense Statistics
  const statistics = await apiRequest('GET', '/api/expenses/statistics');
  logTest('Expenses', 'Get expense statistics', statistics.success && statistics.data.statistics,
    !statistics.success ? JSON.stringify(statistics.error) : '');

  // Test 9: Get Expense Logs
  if (testData.expenseId) {
    const logs = await apiRequest('GET', `/api/expenses/${testData.expenseId}/logs`, { limit: 10 });
    logTest('Expenses', 'Get expense audit logs', logs.success && Array.isArray(logs.data.logs),
      !logs.success ? JSON.stringify(logs.error) : '');
  }

  // Test 10: Invalid Expense Creation (missing fields)
  const invalidExpense = await apiRequest('POST', '/api/expenses', {
    amount: 100
    // Missing required fields
  });
  logTest('Expenses', 'Create invalid expense (should fail)', !invalidExpense.success && invalidExpense.status === 400,
    invalidExpense.success ? 'Should have failed but succeeded' : '');
}

async function testOCRProcessing() {
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}  OCR PROCESSING TESTS (Developer 2)${colors.reset}`);
  console.log(`${colors.magenta}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Get OCR Info
  const ocrInfo = await apiRequest('GET', '/api/expenses/ocr-info');
  logTest('OCR', 'Get OCR information', ocrInfo.success && ocrInfo.data.service,
    !ocrInfo.success ? JSON.stringify(ocrInfo.error) : '');

  // Test 2: Get Sample Receipts
  const samples = await apiRequest('GET', '/api/expenses/ocr-samples');
  logTest('OCR', 'Get sample receipts', samples.success,
    !samples.success ? JSON.stringify(samples.error) : '');

  // Test 3: Test OCR
  const ocrTest = await apiRequest('GET', '/api/expenses/ocr-test');
  logTest('OCR', 'Test OCR functionality', ocrTest.success,
    !ocrTest.success ? JSON.stringify(ocrTest.error) : '');

  // Test 4: Auto-submit Expense from OCR Data
  const autoSubmit = await apiRequest('POST', '/api/expenses/auto-submit', {
    ocrData: {
      merchant: 'Test Restaurant',
      amount: 45.50,
      currency: 'USD',
      date: new Date().toISOString()
    },
    category: 'MEALS',
    description: 'Business lunch extracted from receipt'
  });
  logTest('OCR', 'Auto-submit expense from OCR', autoSubmit.success,
    !autoSubmit.success ? JSON.stringify(autoSubmit.error) : '');
}

async function testApprovalWorkflow() {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  APPROVAL WORKFLOW TESTS (Developer 2)${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Get Workflow Info
  const workflowInfo = await apiRequest('GET', '/api/workflow/info');
  logTest('Workflow', 'Get workflow information', workflowInfo.success && workflowInfo.data.workflow,
    !workflowInfo.success ? JSON.stringify(workflowInfo.error) : '');

  // Test 2: Test Workflow
  const testWorkflow = await apiRequest('POST', '/api/workflow/test', {
    amount: 1000,
    currency: 'USD',
    category: 'TRAVEL',
    directorOnly: false,
    managerOnly: false
  });
  logTest('Workflow', 'Test workflow configuration', testWorkflow.success,
    !testWorkflow.success ? JSON.stringify(testWorkflow.error) : '');

  // Test 3: Start Approval Workflow
  if (testData.expenseId3) {
    const startApproval = await apiRequest('POST', `/api/workflow/start/${testData.expenseId3}`);
    logTest('Workflow', 'Start approval workflow', startApproval.success && startApproval.data.expense,
      !startApproval.success ? JSON.stringify(startApproval.error) : '');
  }

  // Test 4: Get Pending Expenses
  const pendingExpenses = await apiRequest('GET', '/api/workflow/pending', {
    approverRole: 'MANAGER',
    limit: 10
  });
  logTest('Workflow', 'Get pending expenses for approver', pendingExpenses.success,
    !pendingExpenses.success ? JSON.stringify(pendingExpenses.error) : '');

  // Test 5: Approve Expense
  if (testData.expenseId3) {
    const approveExpense = await apiRequest('PATCH', `/api/workflow/approve/${testData.expenseId3}`, {
      comments: 'Approved by Manager - Test',
      approverRole: 'MANAGER'
    });
    logTest('Workflow', 'Approve expense', approveExpense.success,
      !approveExpense.success ? JSON.stringify(approveExpense.error) : '');
  }

  // Test 6: Get Approval Statistics
  const approvalStats = await apiRequest('GET', '/api/workflow/statistics');
  logTest('Workflow', 'Get approval statistics', approvalStats.success && approvalStats.data.statistics,
    !approvalStats.success ? JSON.stringify(approvalStats.error) : '');

  // Test 7: Get Approval History
  if (testData.expenseId3) {
    const approvalHistory = await apiRequest('GET', `/api/workflow/history/${testData.expenseId3}`);
    logTest('Workflow', 'Get approval history', approvalHistory.success,
      !approvalHistory.success ? JSON.stringify(approvalHistory.error) : '');
  }

  // Test 8: Reject Expense (using second expense)
  if (testData.expenseId2) {
    // First start approval
    await apiRequest('POST', `/api/workflow/start/${testData.expenseId2}`);
    
    // Then reject
    const rejectExpense = await apiRequest('PATCH', `/api/workflow/reject/${testData.expenseId2}`, {
      comments: 'Not approved - Test rejection',
      approverRole: 'MANAGER'
    });
    logTest('Workflow', 'Reject expense', rejectExpense.success,
      !rejectExpense.success ? JSON.stringify(rejectExpense.error) : '');
  }
}

async function testManagerDashboard() {
  console.log(`\n${colors.bright}${colors.yellow}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}  MANAGER DASHBOARD TESTS (Developer 2)${colors.reset}`);
  console.log(`${colors.yellow}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Get Pending Expenses
  const pendingExpenses = await apiRequest('GET', '/api/manager/pending', {
    approverRole: 'MANAGER',
    page: 1,
    limit: 10
  });
  logTest('Dashboard', 'Get pending expenses', pendingExpenses.success,
    !pendingExpenses.success ? JSON.stringify(pendingExpenses.error) : '');

  // Test 2: Get Pending Expenses with Filters
  const filteredPending = await apiRequest('GET', '/api/manager/pending', {
    approverRole: 'MANAGER',
    category: 'TRAVEL',
    page: 1,
    limit: 10
  });
  logTest('Dashboard', 'Get pending expenses with filters', filteredPending.success,
    !filteredPending.success ? JSON.stringify(filteredPending.error) : '');

  // Test 3: Get Expense History
  const history = await apiRequest('GET', '/api/manager/history', {
    page: 1,
    limit: 10
  });
  logTest('Dashboard', 'Get expense history', history.success,
    !history.success ? JSON.stringify(history.error) : '');

  // Test 4: Get Expense History with Filters
  const filteredHistory = await apiRequest('GET', '/api/manager/history', {
    status: 'APPROVED',
    category: 'TRAVEL',
    page: 1,
    limit: 10
  });
  logTest('Dashboard', 'Get expense history with filters', filteredHistory.success,
    !filteredHistory.success ? JSON.stringify(filteredHistory.error) : '');

  // Test 5: Get Dashboard Statistics
  const dashboardStats = await apiRequest('GET', '/api/manager/stats');
  logTest('Dashboard', 'Get dashboard statistics', dashboardStats.success && dashboardStats.data.statistics,
    !dashboardStats.success ? JSON.stringify(dashboardStats.error) : '');

  // Test 6: Get Dashboard Statistics with Date Range
  const statsWithDate = await apiRequest('GET', '/api/manager/stats', {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  });
  logTest('Dashboard', 'Get dashboard statistics with date range', statsWithDate.success,
    !statsWithDate.success ? JSON.stringify(statsWithDate.error) : '');

  // Test 7: Export Expenses (CSV)
  const exportCSV = await apiRequest('GET', '/api/manager/export', {
    format: 'csv'
  });
  logTest('Dashboard', 'Export expenses to CSV', exportCSV.success,
    !exportCSV.success ? JSON.stringify(exportCSV.error) : '');

  // Test 8: Export Expenses (JSON)
  const exportJSON = await apiRequest('GET', '/api/manager/export', {
    format: 'json'
  });
  logTest('Dashboard', 'Export expenses to JSON', exportJSON.success,
    !exportJSON.success ? JSON.stringify(exportJSON.error) : '');

  // Test 9: Export with Filters
  const exportFiltered = await apiRequest('GET', '/api/manager/export', {
    format: 'csv',
    status: 'APPROVED',
    category: 'TRAVEL'
  });
  logTest('Dashboard', 'Export expenses with filters', exportFiltered.success,
    !exportFiltered.success ? JSON.stringify(exportFiltered.error) : '');
}

async function testConditionalRules() {
  console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green}  CONDITIONAL RULES TESTS (Developer 2 - Phase 5)${colors.reset}`);
  console.log(`${colors.green}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Create Expense with Director Only
  const directorOnlyExpense = await apiRequest('POST', '/api/test/expense-conditional', {
    amount: 10000,
    currency: 'USD',
    category: 'TRAVEL',
    description: 'High-value expense requiring director approval',
    directorOnly: true
  });
  logTest('Rules', 'Create expense with director-only rule', directorOnlyExpense.success,
    !directorOnlyExpense.success ? JSON.stringify(directorOnlyExpense.error) : '');

  let ruleExpenseId = null;
  if (directorOnlyExpense.success && directorOnlyExpense.data.expense) {
    ruleExpenseId = directorOnlyExpense.data.expense.id;
  }

  // Test 2: Create Expense with Manager Only
  const managerOnlyExpense = await apiRequest('POST', '/api/test/expense-conditional', {
    amount: 500,
    currency: 'USD',
    category: 'MEALS',
    description: 'Manager approval only expense',
    managerOnly: true
  });
  logTest('Rules', 'Create expense with manager-only rule', managerOnlyExpense.success,
    !managerOnlyExpense.success ? JSON.stringify(managerOnlyExpense.error) : '');

  // Test 3: Apply Conditional Rules
  if (testData.expenseId) {
    const applyRules = await apiRequest('POST', `/api/test/apply-rules/${testData.expenseId}`, {
      rules: [
        {
          id: 'rule_percentage_60',
          type: 'PERCENTAGE',
          description: 'Auto-approve when 60% of approvals received',
          threshold: 60
        }
      ]
    });
    logTest('Rules', 'Apply conditional rules to expense', applyRules.success,
      !applyRules.success ? JSON.stringify(applyRules.error) : '');
  }

  // Test 4: Get Rules Summary
  if (testData.expenseId) {
    const rulesSummary = await apiRequest('GET', `/api/test/rules-summary/${testData.expenseId}`);
    logTest('Rules', 'Get rules evaluation summary', rulesSummary.success,
      !rulesSummary.success ? JSON.stringify(rulesSummary.error) : '');
  }

  // Test 5: Get Pending with Role
  const pendingForRole = await apiRequest('GET', '/api/test/pending', {
    approverRole: 'DIRECTOR'
  });
  logTest('Rules', 'Get pending expenses for director role', pendingForRole.success,
    !pendingForRole.success ? JSON.stringify(pendingForRole.error) : '');
}

async function testEdgeCases() {
  console.log(`\n${colors.bright}${colors.red}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.red}  EDGE CASES & ERROR HANDLING TESTS${colors.reset}`);
  console.log(`${colors.red}═══════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Invalid Expense ID
  const invalidId = await apiRequest('GET', '/api/expenses/invalidid123');
  logTest('Edge Cases', 'Get expense with invalid ID (should fail)', !invalidId.success,
    invalidId.success ? 'Should have failed but succeeded' : '');

  // Test 2: Delete Expense
  if (testData.expenseId) {
    const deleteExpense = await apiRequest('DELETE', `/api/expenses/${testData.expenseId}`);
    logTest('Edge Cases', 'Delete expense', deleteExpense.success,
      !deleteExpense.success ? JSON.stringify(deleteExpense.error) : '');
  }

  // Test 3: Get Deleted Expense
  if (testData.expenseId) {
    const getDeleted = await apiRequest('GET', `/api/expenses/${testData.expenseId}`);
    logTest('Edge Cases', 'Get deleted expense (should fail)', !getDeleted.success && getDeleted.status === 404,
      getDeleted.success ? 'Should have failed but succeeded' : '');
  }

  // Test 4: Update Non-existent Expense
  const updateNonExistent = await apiRequest('PATCH', '/api/expenses/507f1f77bcf86cd799439099', {
    amount: 100
  });
  logTest('Edge Cases', 'Update non-existent expense (should fail)', !updateNonExistent.success,
    updateNonExistent.success ? 'Should have failed but succeeded' : '');

  // Test 5: Invalid Category
  const invalidCategory = await apiRequest('POST', '/api/expenses', {
    amount: 100,
    currency: 'USD',
    category: 'INVALID_CATEGORY',
    description: 'Test',
    date: new Date().toISOString()
  });
  logTest('Edge Cases', 'Create expense with invalid category (should fail)', !invalidCategory.success,
    invalidCategory.success ? 'Should have failed but succeeded' : '');

  // Test 6: Invalid Currency
  const invalidCurrency = await apiRequest('POST', '/api/expenses', {
    amount: 100,
    currency: 'XYZ',
    category: 'TRAVEL',
    description: 'Test',
    date: new Date().toISOString()
  });
  logTest('Edge Cases', 'Create expense with invalid currency (should fail)', !invalidCurrency.success,
    invalidCurrency.success ? 'Should have failed but succeeded' : '');

  // Test 7: Negative Amount
  const negativeAmount = await apiRequest('POST', '/api/expenses', {
    amount: -100,
    currency: 'USD',
    category: 'TRAVEL',
    description: 'Test',
    date: new Date().toISOString()
  });
  logTest('Edge Cases', 'Create expense with negative amount (should fail)', !negativeAmount.success,
    negativeAmount.success ? 'Should have failed but succeeded' : '');

  // Test 8: Future Date
  const futureDate = await apiRequest('POST', '/api/expenses', {
    amount: 100,
    currency: 'USD',
    category: 'TRAVEL',
    description: 'Test',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  logTest('Edge Cases', 'Create expense with future date (should fail)', !futureDate.success,
    futureDate.success ? 'Should have failed but succeeded' : '');

  // Test 9: 404 Route
  const notFound = await apiRequest('GET', '/api/nonexistent');
  logTest('Edge Cases', 'Access non-existent route (should return 404)', !notFound.success && notFound.status === 404,
    notFound.success ? 'Should have returned 404' : '');
}

function printSummary() {
  console.log(`\n${colors.bright}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Pass Rate: ${passRate}%\n`);

  if (testResults.failed > 0) {
    console.log(`${colors.red}Failed Tests:${colors.reset}`);
    testResults.details
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  ${colors.red}✗${colors.reset} [${t.category}] ${t.testName}`);
        if (t.details) console.log(`    ${colors.red}${t.details}${colors.reset}`);
      });
    console.log('');
  }

  // Test Data Summary
  console.log(`${colors.bright}Test Data Created:${colors.reset}`);
  console.log(`  User ID: ${testData.userId || 'N/A'}`);
  console.log(`  Company ID: ${testData.companyId || 'N/A'}`);
  console.log(`  Manager ID: ${testData.managerId || 'N/A'}`);
  console.log(`  Employee ID: ${testData.employeeId || 'N/A'}`);
  console.log(`  Expense IDs: ${[testData.expenseId, testData.expenseId2, testData.expenseId3].filter(Boolean).join(', ') || 'N/A'}`);

  console.log(`\n${colors.bright}═══════════════════════════════════════════════════════${colors.reset}\n`);
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log(`╔═══════════════════════════════════════════════════════╗`);
  console.log(`║                                                       ║`);
  console.log(`║     COMPLETE SYSTEM TEST SUITE                        ║`);
  console.log(`║     Expense Management System                         ║`);
  console.log(`║     Testing All Endpoints                             ║`);
  console.log(`║                                                       ║`);
  console.log(`╚═══════════════════════════════════════════════════════╝`);
  console.log(`${colors.reset}\n`);

  console.log(`${colors.yellow}Testing against: ${BASE_URL}${colors.reset}\n`);

  try {
    // Run all test suites in order
    await testSystemHealth();
    await testAuthentication();
    await testUserManagement();
    await testCompanyManagement();
    await testExpenseUtilities();
    await testExpenseManagement();
    await testOCRProcessing();
    await testApprovalWorkflow();
    await testManagerDashboard();
    await testConditionalRules();
    await testEdgeCases();

    // Print summary
    printSummary();

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
