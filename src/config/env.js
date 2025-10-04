require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI ,
  
  // JWT Configuration (for future integration with Developer 1)
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  
  // External APIs
  EXCHANGE_RATE_API_URL: process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest',
  REST_COUNTRIES_API_URL: process.env.REST_COUNTRIES_API_URL || 'https://restcountries.com/v3.1/all?fields=name,currencies',
  
  // OCR Configuration
  OCR_SERVICE_URL: process.env.OCR_SERVICE_URL || 'https://vision.googleapis.com/v1/images:annotate',
  OCR_API_KEY: process.env.OCR_API_KEY || 'AIzaSyDe7JEzuxOXy5qsMLckliibQIleO43NTyE',
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  
  // Mock Data for Development (Developer 2)
  MOCK_COMPANY_ID: '507f1f77bcf86cd799439011',
  MOCK_EMPLOYEE_ID: '507f1f77bcf86cd799439012',
  MOCK_MANAGER_ID: '507f1f77bcf86cd799439013',
  MOCK_ADMIN_ID: '507f1f77bcf86cd799439014'
};

module.exports = config;