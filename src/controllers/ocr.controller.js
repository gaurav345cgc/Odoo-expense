const ocrService = require('../services/ocr.service');
const expenseService = require('../services/expense.service');
const fs = require('fs');

const ocrController = {
  // Process receipt image and extract expense data
  processReceipt: async (req, res, next) => {
    try {
      console.log(`📸 Processing receipt: ${req.fileInfo.originalName}`);
      
      // Read the uploaded file
      const imageBuffer = fs.readFileSync(req.fileInfo.path);
      
      // Extract text using OCR
      const ocrResult = await ocrService.extractTextFromImage(imageBuffer, req.fileInfo.originalName);
      
      if (!ocrResult.success) {
        return res.status(400).json({
          message: 'OCR processing failed',
          error: ocrResult.error || 'Failed to extract text from image',
          extractedData: ocrResult.data,
          confidence: ocrResult.confidence
        });
      }
      
      // Validate extracted data
      const validation = ocrService.validateExtractedData(ocrResult.data);
      
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Invalid extracted data',
          errors: validation.errors,
          extractedData: ocrResult.data,
          confidence: ocrResult.confidence
        });
      }
      
      // Prepare response with extracted data
      const response = {
        message: 'Receipt processed successfully',
        extractedData: {
          ...ocrResult.data,
          receiptUrl: `/uploads/${req.fileInfo.filename}`,
          ocrConfidence: ocrResult.confidence
        },
        ocrMetadata: {
          originalFilename: req.fileInfo.originalName,
          processedAt: new Date().toISOString(),
          fileSize: req.fileInfo.size,
          fileType: req.fileInfo.mimetype,
          rawText: ocrResult.rawText,
          confidence: ocrResult.confidence
        },
        suggestions: {
          reviewRequired: ocrResult.confidence < 0.8,
          recommendedActions: ocrResult.confidence < 0.8 ? [
            'Please review the extracted amount',
            'Verify the merchant name',
            'Check the date accuracy'
          ] : ['Data looks good, ready to submit']
        }
      };
      
      console.log(`✅ OCR processing completed for ${req.fileInfo.originalName}`);
      res.status(200).json(response);
      
    } catch (error) {
      console.error('❌ Error processing receipt:', error);
      next(error);
    }
  },

  // Auto-submit expense from OCR data
  autoSubmitExpense: async (req, res, next) => {
    try {
      console.log(`🚀 Auto-submitting expense from OCR data`);
      
      const { extractedData, ocrMetadata } = req.body;
      const employeeId = req.user.employeeId;
      const companyId = req.user.companyId;
      
      // Validate required fields
      if (!extractedData) {
        return res.status(400).json({
          message: 'Missing extracted data',
          error: 'Please provide extractedData in request body'
        });
      }
      
      // Validate extracted data
      const validation = ocrService.validateExtractedData(extractedData);
      if (!validation.isValid) {
        return res.status(400).json({
          message: 'Invalid extracted data',
          errors: validation.errors
        });
      }
      
      // Prepare expense data
      const expenseData = {
        amount: extractedData.amount,
        currency: extractedData.currency,
        category: extractedData.category,
        description: extractedData.description,
        date: extractedData.date,
        receiptUrl: extractedData.receiptUrl
      };
      
      // Create expense
      const newExpense = await expenseService.createExpense(expenseData, employeeId, companyId);
      
      // Add OCR metadata to the expense
      if (ocrMetadata) {
        newExpense.ocrData = {
          ...ocrMetadata,
          autoSubmitted: true,
          submittedAt: new Date().toISOString()
        };
        await newExpense.save();
      }
      
      console.log(`✅ Auto-submitted expense with ID: ${newExpense._id}`);
      
      res.status(201).json({
        message: 'Expense auto-submitted successfully',
        expense: newExpense,
        ocrMetadata: ocrMetadata
      });
      
    } catch (error) {
      console.error('❌ Error auto-submitting expense:', error);
      next(error);
    }
  },

  // Get OCR processing status and supported formats
  getOcrInfo: (req, res, next) => {
    try {
      const info = {
        message: 'OCR Service Information',
        supportedFileTypes: ocrService.getSupportedFileTypes(),
        maxFileSize: `${ocrService.getMaxFileSize() / (1024 * 1024)}MB`,
        features: [
          'Automatic text extraction from receipts',
          'Amount and currency detection',
          'Date extraction',
          'Merchant name recognition',
          'Category classification',
          'Confidence scoring',
          'Auto-submit functionality'
        ],
        endpoints: {
          processReceipt: 'POST /api/expenses/ocr-upload',
          autoSubmit: 'POST /api/expenses/auto-submit',
          info: 'GET /api/expenses/ocr-info'
        }
      };
      
      res.status(200).json(info);
    } catch (error) {
      next(error);
    }
  },

  // Test OCR with sample data
  testOcr: async (req, res, next) => {
    try {
      const { filename } = req.query;
      
      if (!filename) {
        return res.status(400).json({
          message: 'Missing filename parameter',
          error: 'Please provide a filename query parameter (e.g., ?filename=receipt_001.jpg)'
        });
      }
      
      // Test OCR with mock data
      const ocrResult = await ocrService.extractTextFromImage(null, filename);
      
      res.status(200).json({
        message: 'OCR test completed',
        testFilename: filename,
        result: ocrResult
      });
      
    } catch (error) {
      console.error('❌ Error testing OCR:', error);
      next(error);
    }
  },

  // Get sample receipt data for testing
  getSampleReceipts: (req, res, next) => {
    try {
      const sampleReceipts = [
        {
          filename: 'receipt_001.jpg',
          description: 'Coffee shop receipt',
          expectedData: {
            amount: 45.50,
            currency: 'USD',
            merchantName: 'Starbucks Coffee',
            category: 'MEALS'
          }
        },
        {
          filename: 'receipt_002.jpg',
          description: 'Office supplies receipt',
          expectedData: {
            amount: 89.99,
            currency: 'USD',
            merchantName: 'Office Depot',
            category: 'OFFICE_SUPPLIES'
          }
        },
        {
          filename: 'receipt_003.jpg',
          description: 'Transport receipt',
          expectedData: {
            amount: 125.00,
            currency: 'USD',
            merchantName: 'Uber',
            category: 'TRANSPORT'
          }
        },
        {
          filename: 'receipt_004.jpg',
          description: 'Hotel receipt',
          expectedData: {
            amount: 250.00,
            currency: 'USD',
            merchantName: 'Hilton Hotel',
            category: 'ACCOMMODATION'
          }
        },
        {
          filename: 'receipt_005.jpg',
          description: 'Restaurant receipt (EUR)',
          expectedData: {
            amount: 75.50,
            currency: 'EUR',
            merchantName: 'Restaurant Le Bistro',
            category: 'MEALS'
          }
        }
      ];
      
      res.status(200).json({
        message: 'Sample receipt data for testing',
        sampleReceipts,
        usage: 'Use these filenames in the test endpoint: GET /api/expenses/ocr-test?filename=receipt_001.jpg'
      });
      
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ocrController;