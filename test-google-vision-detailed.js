const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Test Google Vision API directly
const testGoogleVisionDirectly = async () => {
  console.log('🔍 Testing Google Vision API directly...');
  
  try {
    // Read the image file
    const imagePath = path.join(__dirname, 'uploads', 'bill.png');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log(`📸 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`📊 Base64 size: ${(base64Image.length / 1024).toFixed(2)} KB`);
    
    // Prepare request payload for Google Vision API
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };
    
    // Get API key from environment
    const apiKey = 'AIzaSyCKHQXQWcAS_9lG9m59Avmu0N_yBSDw7fY';
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    console.log('🚀 Making direct request to Google Vision API...');
    console.log(`🔗 URL: ${visionUrl}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
    
    const response = await axios.post(visionUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });
    
    console.log('✅ Google Vision API response received!');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.responses && response.data.responses.length > 0) {
      const visionResponse = response.data.responses[0];
      
      if (visionResponse.textAnnotations && visionResponse.textAnnotations.length > 0) {
        const extractedText = visionResponse.textAnnotations[0].description;
        console.log('\n📝 Extracted Text:');
        console.log('=' * 50);
        console.log(extractedText);
        console.log('=' * 50);
      } else {
        console.log('⚠️ No text detected in the image');
      }
    }
    
  } catch (error) {
    console.error('❌ Google Vision API Error:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.message);
    
    if (error.response?.data) {
      console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Common error explanations
    if (error.response?.status === 403) {
      console.log('\n🔍 403 Error Analysis:');
      console.log('This usually means:');
      console.log('1. API key is invalid or expired');
      console.log('2. API key doesn\'t have Vision API permissions');
      console.log('3. Billing is not enabled for the Google Cloud project');
      console.log('4. API quotas have been exceeded');
      console.log('5. The API key is restricted to certain IPs/domains');
    } else if (error.response?.status === 400) {
      console.log('\n🔍 400 Error Analysis:');
      console.log('This usually means:');
      console.log('1. Invalid request format');
      console.log('2. Image format not supported');
      console.log('3. Image too large or too small');
    }
  }
};

// Test with a simple image
const testWithSimpleImage = async () => {
  console.log('\n🧪 Testing with a simple test image...');
  
  try {
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const base64Image = testImageBuffer.toString('base64');
    
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };
    
    const apiKey = 'AIzaSyCKHQXQWcAS_9lG9m59Avmu0N_yBSDw7fY';
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const response = await axios.post(visionUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });
    
    console.log('✅ Simple image test successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Simple image test failed:', error.message);
    if (error.response?.data) {
      console.error('Error Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

// Main test runner
const runDetailedTests = async () => {
  console.log('🎯 Google Vision API Detailed Testing');
  console.log('======================================================================');
  
  await testGoogleVisionDirectly();
  await testWithSimpleImage();
  
  console.log('\n======================================================================');
  console.log('📋 Troubleshooting Guide:');
  console.log('1. Check if the API key is valid and active');
  console.log('2. Ensure Vision API is enabled in Google Cloud Console');
  console.log('3. Verify billing is set up for the project');
  console.log('4. Check API quotas and limits');
  console.log('5. Test with a different image format');
  console.log('6. Try with a smaller image size');
};

// Run the tests
runDetailedTests().catch(console.error);