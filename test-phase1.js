const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const tests = [
  {
    name: 'Health Check',
    url: '/health',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'API Status',
    url: '/api/status',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Database Connection Test',
    url: '/api/db/test',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Expense Model Test',
    url: '/api/expenses/test',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'ExpenseLog Model Test',
    url: '/api/logs/test',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: '404 Route Test',
    url: '/api/nonexistent',
    method: 'GET',
    expectedStatus: 404
  }
];

async function runTest(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📍 URL: ${test.method} ${BASE_URL}${test.url}`);
    
    const response = await axios({
      method: test.method,
      url: `${BASE_URL}${test.url}`,
      timeout: 5000
    });
    
    if (response.status === test.expectedStatus) {
      console.log(`✅ PASS - Status: ${response.status}`);
      console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
    } else {
      console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${response.status}`);
    }
    
  } catch (error) {
    if (error.response) {
      if (error.response.status === test.expectedStatus) {
        console.log(`✅ PASS - Expected error status: ${error.response.status}`);
        console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
      } else {
        console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${error.response.status}`);
        console.log(`📊 Response:`, JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.log(`❌ ERROR - ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Phase 1 Testing for Expense Management System');
  console.log('=' .repeat(60));
  
  // Wait a moment for server to start
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await runTest(test);
      passed++;
    } catch (error) {
      console.log(`❌ Test failed: ${test.name} - ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Phase 1 is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the server logs.');
  }
}

// Run the tests
runAllTests().catch(console.error);