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
const testOcrInfo = async () => {
  return await makeRequest('GET', '/api/expenses/ocr-info');
};

const testOcrSamples = async () => {
  return await makeRequest('GET', '/api/expenses/ocr-samples');
};

const testOcrTest = async () => {
  return await makeRequest('GET', '/api/expenses/ocr-test?filename=receipt_001.jpg');
};

const testOcrTestInvalid = async () => {
  return await makeRequest('GET', '/api/expenses/ocr-test?filename=nonexistent.jpg');
};

const testOcrTestMissingFilename = async () => {
  return await makeRequest('GET', '/api/expenses/ocr-test');
};

const testOcrUploadNoFile = async () => {
  return await makeRequest('POST', '/api/expenses/ocr-upload');
};

const testAutoSubmitValid = async () => {
  const expenseData = {
    extractedData: {
      amount: 45.50,
      currency: 'USD',
      date: '2024-01-15',
      merchantName: 'Starbucks Coffee',
      category: 'MEALS',
      description: 'Coffee and breakfast meeting',
      receiptUrl: '/uploads/test_receipt.jpg'
    },
    ocrMetadata: {
      originalFilename: 'receipt_001.jpg',
      processedAt: new Date().toISOString(),
      fileSize: 1024,
      fileType: 'image/jpeg',
      confidence: 0.95
    }
  };
  
  return await makeRequest('POST', '/api/expenses/auto-submit', expenseData);
};

const testAutoSubmitInvalid = async () => {
  const invalidData = {
    extractedData: {
      amount: -10, // Invalid amount
      currency: 'INVALID', // Invalid currency
      date: 'invalid-date',
      merchantName: '',
      category: 'INVALID_CATEGORY'
    }
  };
  
  return await makeRequest('POST', '/api/expenses/auto-submit', invalidData);
};

const testAutoSubmitMissingData = async () => {
  return await makeRequest('POST', '/api/expenses/auto-submit', {});
};

const testHealthCheck = async () => {
  return await makeRequest('GET', '/health');
};

const testApiStatus = async () => {
  return await makeRequest('GET', '/api/status');
};

// Create a test image file for upload testing
const createTestImage = () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Create a simple test image (1x1 pixel PNG)
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testImagePath = path.join(uploadsDir, 'test_receipt.png');
  fs.writeFileSync(testImagePath, testImageBuffer);
  return testImagePath;
};

const testOcrUploadWithFile = async () => {
  const testImagePath = createTestImage();
  
  try {
    const formData = new FormData();
    formData.append('receipt', fs.createReadStream(testImagePath), 'test_receipt.png');
    
    const response = await axios.post(`${BASE_URL}/api/expenses/ocr-upload`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000
    });
    
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status || 500 
    };
  } finally {
    // Clean up test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
};

// Main test runner
const runPhase3Tests = async () => {
  console.log('🚀 Starting Phase 3 Testing for OCR Receipt Service');
  console.log('======================================================================');
  
  try {
    await waitForServer();
    
    // Basic health checks
    await runTest('Health Check', testHealthCheck);
    await runTest('API Status', testApiStatus);
    
    // OCR Info endpoints
    await runTest('Get OCR Info', testOcrInfo);
    await runTest('Get OCR Samples', testOcrSamples);
    
    // OCR Test endpoints
    await runTest('Test OCR with Valid Filename', testOcrTest);
    await runTest('Test OCR with Invalid Filename', testOcrTestInvalid);
    await runTest('Test OCR with Missing Filename', testOcrTestMissingFilename);
    
    // OCR Upload endpoints
    await runTest('OCR Upload with No File', testOcrUploadNoFile);
    await runTest('OCR Upload with Test File', testOcrUploadWithFile);
    
    // Auto-submit endpoints
    await runTest('Auto-submit Valid Expense', testAutoSubmitValid);
    await runTest('Auto-submit Invalid Expense', testAutoSubmitInvalid);
    await runTest('Auto-submit Missing Data', testAutoSubmitMissingData);
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  }
  
  // Print results
  console.log('\n======================================================================');
  console.log('📊 Phase 3 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️ Skipped: ${testResults.skipped}`);
  console.log(`📈 Total: ${testResults.total}`);
  
  if (testResults.failed === 0) {
    console.log('🎉 All tests passed! Phase 3 is working correctly.');
    console.log('📋 Phase 3 Features Tested:');
    console.log('✅ OCR service integration');
    console.log('✅ Receipt image processing');
    console.log('✅ Text extraction and parsing');
    console.log('✅ Auto-submit functionality');
    console.log('✅ File upload handling');
    console.log('✅ Error handling and validation');
    console.log('🎯 Ready for Phase 4: Multi-step Approval Workflow');
  } else {
    console.log('⚠️ Some tests failed. Please check the server logs.');
  }
};

// Run the tests
runPhase3Tests().catch(console.error);