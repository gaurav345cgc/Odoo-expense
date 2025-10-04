const express = require('express');
const ocrController = require('../controllers/ocr.controller');
const { uploadMiddleware, autoCleanup } = require('../middlewares/upload.middleware');

const router = express.Router();

// OCR Information endpoint (before the :id route to avoid conflicts)
router.get('/ocr-info', ocrController.getOcrInfo);

// Sample receipts for testing
router.get('/ocr-samples', ocrController.getSampleReceipts);

// Test OCR with sample data
router.get('/ocr-test', ocrController.testOcr);

// Process receipt image (upload + OCR)
router.post('/ocr-upload', uploadMiddleware, autoCleanup, ocrController.processReceipt);

// Auto-submit expense from OCR data
router.post('/auto-submit', ocrController.autoSubmitExpense);

module.exports = router;