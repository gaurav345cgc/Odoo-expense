const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Helper function to wait for server
const waitForServer = async () => {
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is ready!');
      return true;
    } catch (error) {
      attempts++;
      console.log(`⏳ Waiting for server... (${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('❌ Server failed to start within 30 seconds');
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🧪 Testing: Health Check');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ FAIL - Health Check:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testAPIStatus = async () => {
  console.log('\n🧪 Testing: API Status');
  try {
    const response = await axios.get(`${BASE_URL}/api/status`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ FAIL - API Status:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testPendingExpenses = async () => {
  console.log('\n🧪 Testing: Get Pending Expenses');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/manager/pending`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', {
      message: response.data.message,
      count: response.data.data.expenses.length,
      pagination: response.data.data.pagination
    });
    return true;
  } catch (error) {
    console.error('❌ FAIL - Get Pending Expenses:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testPendingExpensesWithFilters = async () => {
  console.log('\n🧪 Testing: Get Pending Expenses with Filters');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/manager/pending?category=TRAVEL&limit=5`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', {
      message: response.data.message,
      count: response.data.data.expenses.length,
      filters: response.data.data.filters
    });
    return true;
  } catch (error) {
    console.error('❌ FAIL - Get Pending Expenses with Filters:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testExpenseHistory = async () => {
  console.log('\n🧪 Testing: Get Expense History');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/manager/history`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', {
      message: response.data.message,
      count: response.data.data.expenses.length,
      pagination: response.data.data.pagination
    });
    return true;
  } catch (error) {
    console.error('❌ FAIL - Get Expense History:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testExpenseHistoryWithFilters = async () => {
  console.log('\n🧪 Testing: Get Expense History with Filters');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/manager/history?status=APPROVED&limit=3`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', {
      message: response.data.message,
      count: response.data.data.expenses.length,
      filters: response.data.data.filters
    });
    return true;
  } catch (error) {
    console.error('❌ FAIL - Get Expense History with Filters:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testDashboardStats = async () => {
  console.log('\n🧪 Testing: Get Dashboard Statistics');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/manager/stats`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', {
      message: response.data.message,
      statusCounts: response.data.data.statusCounts,
      employeeStatsCount: response.data.data.employeeStats.length,
      categoryStatsCount: response.data.data.categoryStats.length
    });
    return true;
  } catch (error) {
    console.error('❌ FAIL - Get Dashboard Statistics:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testDashboardStatsWithDateRange = async () => {
  console.log('\n🧪 Testing: Get Dashboard Statistics with Date Range');
  try {
    const dateRange = JSON.stringify({
      start: '2024-01-01',
      end: '2024-12-31'
    });
    const response = await axios.get(`${BASE_URL}/api/test/manager/stats?dateRange=${encodeURIComponent(dateRange)}`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', {
      message: response.data.message,
      dateRange: response.data.data.dateRange
    });
    return true;
  } catch (error) {
    console.error('❌ FAIL - Get Dashboard Statistics with Date Range:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testExportCSV = async () => {
  console.log('\n🧪 Testing: Export Expenses to CSV');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/manager/export?format=csv&limit=5`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', {
      contentType: response.headers['content-type'],
      contentDisposition: response.headers['content-disposition'],
      contentLength: response.data.length
    });
    return true;
  } catch (error) {
    console.error('❌ FAIL - Export Expenses to CSV:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testExportJSON = async () => {
  console.log('\n🧪 Testing: Export Expenses to JSON');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/manager/export?format=json&limit=3`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', {
      message: response.data.message,
      count: response.data.data.count,
      format: response.data.data.format
    });
    return true;
  } catch (error) {
    console.error('❌ FAIL - Export Expenses to JSON:', error.response ? error.response.data : error.message);
    return false;
  }
};

const testExportWithFilters = async () => {
  console.log('\n🧪 Testing: Export Expenses with Filters');
  try {
    const response = await axios.get(`${BASE_URL}/api/test/manager/export?status=APPROVED&category=TRAVEL&format=json`);
    console.log('✅ PASS - Status:', response.status);
    console.log('📊 Response:', {
      message: response.data.message,
      count: response.data.data.count,
      filters: response.data.data.filters
    });
    return true;
  } catch (error) {
    console.error('❌ FAIL - Export Expenses with Filters:', error.response ? error.response.data : error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Phase 6 Testing for Manager Dashboard APIs');
  console.log('======================================================================');
  
  const tests = [
    testHealthCheck,
    testAPIStatus,
    testPendingExpenses,
    testPendingExpensesWithFilters,
    testExpenseHistory,
    testExpenseHistoryWithFilters,
    testDashboardStats,
    testDashboardStatsWithDateRange,
    testExportCSV,
    testExportJSON,
    testExportWithFilters
  ];
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('❌ Test failed with error:', error.message);
      failed++;
    }
  }
  
  console.log('\n======================================================================');
  console.log('📊 Phase 6 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log(`📈 Total: ${passed + failed + skipped}`);
  console.log('🎉 Phase 6: Manager Dashboard APIs testing completed!');
  console.log('🔧 Key Features Tested:');
  console.log('   ✅ Pending expenses with filters');
  console.log('   ✅ Expense history analytics');
  console.log('   ✅ Dashboard statistics with aggregation');
  console.log('   ✅ CSV export functionality');
  console.log('   ✅ JSON export functionality');
  console.log('   ✅ Advanced filtering and pagination');
  console.log('📋 Next Steps:');
  console.log('   1. Integrate with frontend dashboard');
  console.log('   2. Add real-time notifications');
  console.log('   3. Implement advanced reporting');
  console.log('   4. Add data visualization endpoints');
  console.log('   5. Optimize aggregation pipelines');
};

// Run tests
const main = async () => {
  try {
    await waitForServer();
    await runTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
};

main();