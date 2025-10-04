const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Test Google Vision API with uploaded image
const testGoogleVisionWithUploadedImage = async () => {
  console.log('🚀 Testing Google Vision API with uploaded image');
  console.log('======================================================================');
  
  try {
    // Check if the uploaded image exists
    const imagePath = path.join(__dirname, 'uploads', 'bill.png');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Image not found at:', imagePath);
      console.log('📁 Available files in uploads directory:');
      const uploadsDir = path.join(__dirname, 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
          console.log(`   - ${file}`);
        });
      }
      return;
    }
    
    console.log(`📸 Found image: ${imagePath}`);
    console.log(`📊 File size: ${(fs.statSync(imagePath).size / 1024).toFixed(2)} KB`);
    
    // Test OCR upload with the image
    const formData = new FormData();
    formData.append('receipt', fs.createReadStream(imagePath), 'bill.png');
    
    console.log('🔍 Sending image to OCR service...');
    
    const response = await axios.post(`${BASE_URL}/api/expenses/ocr-upload`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000 // 60 seconds timeout for Google Vision API
    });
    
    console.log('✅ OCR processing completed!');
    console.log('📊 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Test auto-submit if OCR was successful
    if (response.data.extractedData) {
      console.log('\n🚀 Testing auto-submit with extracted data...');
      
      const autoSubmitData = {
        extractedData: response.data.extractedData,
        ocrMetadata: response.data.ocrMetadata
      };
      
      const autoSubmitResponse = await axios.post(
        `${BASE_URL}/api/expenses/auto-submit`,
        autoSubmitData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      console.log('✅ Auto-submit completed!');
      console.log('📊 Auto-submit Response:');
      console.log(JSON.stringify(autoSubmitResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing Google Vision API:', error.message);
    if (error.response) {
      console.error('📊 Error Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

// Test OCR info endpoint
const testOcrInfo = async () => {
  try {
    console.log('\n🔍 Testing OCR Info endpoint...');
    const response = await axios.get(`${BASE_URL}/api/expenses/ocr-info`);
    console.log('✅ OCR Info:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error getting OCR info:', error.message);
  }
};

// Test with mock data
const testMockOcr = async () => {
  try {
    console.log('\n🧪 Testing with mock data...');
    const response = await axios.get(`${BASE_URL}/api/expenses/ocr-test?filename=receipt_001.jpg`);
    console.log('✅ Mock OCR Test:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error testing mock OCR:', error.message);
  }
};

// Main test runner
const runGoogleVisionTests = async () => {
  console.log('🎯 Google Vision API Integration Test');
  console.log('======================================================================');
  
  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server is ready!');
      break;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('❌ Server did not start within 30 seconds');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Run tests
  await testOcrInfo();
  await testMockOcr();
  await testGoogleVisionWithUploadedImage();
  
  console.log('\n======================================================================');
  console.log('🎉 Google Vision API testing completed!');
  console.log('📋 Next steps:');
  console.log('1. Check the extracted data accuracy');
  console.log('2. Verify currency conversion if applicable');
  console.log('3. Test with different receipt types');
  console.log('4. Monitor Google Vision API usage and costs');
};

// Run the tests
runGoogleVisionTests().catch(console.error);