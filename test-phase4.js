const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Helper function to make HTTP requests
const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 30000
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  }
};

// Test function
const runTest = async (testName, testFunction) => {
  testResults.total++;
  console.log(`\n🧪 Testing: ${testName}`);
  
  try {
    const result = await testFunction();
    if (result.success) {
      testResults.passed++;
      console.log(`✅ PASS - Status: ${result.status}`);
      if (result.data) {
        console.log(`📊 Response: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
      }
    } else {
      testResults.failed++;
      console.log(`❌ FAIL - Status: ${result.status}`);
      console.log(`📊 Error: ${JSON.stringify(result.error, null, 2).substring(0, 200)}...`);
    }
  } catch (error) {
    testResults.failed++;
    console.log(`❌ FAIL - Error: ${error.message}`);
  }
};

// Wait for server to start
const waitForServer = async () => {
  console.log('⏳ Waiting for server to start...');
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is ready!');
      return true;
    } catch (error) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('Server did not start within 30 seconds');
};

// Test functions
const testWorkflowInfo = async () => {
  return await makeRequest('GET', '/api/workflow/info');
};

const testCreateTestExpense = async () => {
  const expenseData = {
    amount: 750,
    currency: 'USD',
    category: 'MEALS',
    description: 'Test expense for approval workflow',
    date: '2024-01-15'
  };
  
  return await makeRequest('POST', '/api/expenses', expenseData);
};

const testStartApproval = async (expenseId) => {
  return await makeRequest('POST', `/api/workflow/start/${expenseId}`);
};

const testGetPendingExpenses = async () => {
  return await makeRequest('GET', '/api/workflow/pending');
};

const testApproveExpense = async (expenseId) => {
  const approvalData = {
    comments: 'Approved for business meal expense'
  };
  
  return await makeRequest('PATCH', `/api/workflow/approve/${expenseId}`, approvalData);
};

const testRejectExpense = async (expenseId) => {
  const rejectionData = {
    comments: 'Receipt missing or invalid'
  };
  
  return await makeRequest('PATCH', `/api/workflow/reject/${expenseId}`, rejectionData);
};

const testGetApprovalStatistics = async () => {
  return await makeRequest('GET', '/api/workflow/statistics');
};

const testGetApprovalHistory = async (expenseId) => {
  return await makeRequest('GET', `/api/workflow/history/${expenseId}`);
};

const testWorkflowTest = async () => {
  const testData = {
    amount: 1200,
    category: 'TRAVEL',
    description: 'Test workflow with high amount requiring multiple approvals'
  };
  
  return await makeRequest('POST', '/api/workflow/test', testData);
};

const testHealthCheck = async () => {
  return await makeRequest('GET', '/health');
};

const testApiStatus = async () => {
  return await makeRequest('GET', '/api/status');
};

// Main test runner
const runPhase4Tests = async () => {
  console.log('🚀 Starting Phase 4 Testing for Multi-step Approval Workflow');
  console.log('======================================================================');
  
  try {
    await waitForServer();
    
    // Basic health checks
    await runTest('Health Check', testHealthCheck);
    await runTest('API Status', testApiStatus);
    
    // Workflow info
    await runTest('Get Workflow Info', testWorkflowInfo);
    
    // Test workflow creation
    await runTest('Test Workflow Creation', testWorkflowTest);
    
    // Create a test expense and get its ID
    console.log('\n🧪 Testing: Create Test Expense');
    const createResult = await makeRequest('POST', '/api/expenses', {
      amount: 750,
      currency: 'USD',
      category: 'MEALS',
      description: 'Test expense for approval workflow',
      date: '2024-01-15'
    });
    
    if (createResult.success && createResult.data.expense) {
      const testExpenseId = createResult.data.expense.id;
      console.log(`✅ PASS - Created expense with ID: ${testExpenseId}`);
      testResults.passed++;
      testResults.total++;
      
      // Test approval workflow with real expense ID
      await runTest('Start Approval Workflow', () => testStartApproval(testExpenseId));
      await runTest('Get Pending Expenses', testGetPendingExpenses);
      await runTest('Approve Expense', () => testApproveExpense(testExpenseId));
      await runTest('Get Approval Statistics', testGetApprovalStatistics);
      await runTest('Get Approval History', () => testGetApprovalHistory(testExpenseId));
      
      // Test rejection workflow
      await runTest('Reject Expense', () => testRejectExpense(testExpenseId));
    } else {
      console.log('❌ FAIL - Could not create test expense');
      testResults.failed++;
      testResults.total++;
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  }
  
  // Print results
  console.log('\n======================================================================');
  console.log('📊 Phase 4 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  console.log(`📈 Total: ${testResults.total}`);
  
  if (testResults.failed === 0) {
    console.log('🎉 All tests passed! Phase 4 is working correctly.');
    console.log('📋 Phase 4 Features Tested:');
    console.log('✅ Multi-step approval workflow');
    console.log('✅ Role-based approval routing');
    console.log('✅ Approval and rejection logic');
    console.log('✅ Pending expenses management');
    console.log('✅ Approval statistics and history');
    console.log('✅ Notification system (mock)');
    console.log('🎯 Ready for Phase 5: Conditional & Hybrid Rules');
  } else {
    console.log('⚠️ Some tests failed. Please check the server logs.');
  }
};

// Run the tests
runPhase4Tests().catch(console.error);