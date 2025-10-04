const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const ocrService = require('../services/ocr.service');

// Ensure upload directory exists
const uploadDir = config.UPLOAD_PATH;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `receipt_${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const supportedTypes = ocrService.getSupportedFileTypes();
  
  if (supportedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${supportedTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: ocrService.getMaxFileSize(), // 5MB default
    files: 1 // Only allow one file at a time
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('receipt');

// Wrapper middleware to handle errors
const uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File too large',
          error: `File size exceeds ${ocrService.getMaxFileSize() / (1024 * 1024)}MB limit`
        });
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          message: 'Too many files',
          error: 'Only one file is allowed per request'
        });
      } else {
        return res.status(400).json({
          message: 'File upload error',
          error: err.message
        });
      }
    } else if (err) {
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded',
        error: 'Please upload a receipt image file'
      });
    }
    
    // Add file info to request
    req.fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    };
    
    next();
  });
};

// Middleware to clean up uploaded files
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning up file ${filePath}:`, error.message);
  }
};

// Middleware to automatically clean up files after response
const autoCleanup = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Clean up file after sending response
    if (req.fileInfo && req.fileInfo.path) {
      setTimeout(() => {
        cleanupFile(req.fileInfo.path);
      }, 1000); // Clean up after 1 second
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  uploadMiddleware,
  autoCleanup,
  cleanupFile
};