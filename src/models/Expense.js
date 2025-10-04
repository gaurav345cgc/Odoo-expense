const mongoose = require('mongoose');

// ApprovalFlow subdocument schema for multi-step approvals
const approvalFlowSchema = new mongoose.Schema({
  step: {
    type: Number,
    required: true,
    min: 1
  },
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Will be connected to Developer 1's User model
  },
  approverRole: {
    type: String,
    required: true,
    enum: ['MANAGER', 'ADMIN', 'FINANCE', 'DIRECTOR', 'CFO']
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  comments: {
    type: String,
    maxlength: 500
  },
  actedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// OCR Data subdocument schema
const ocrDataSchema = new mongoose.Schema({
  extractedAmount: {
    type: Number,
    min: 0
  },
  extractedDate: {
    type: Date
  },
  merchantName: {
    type: String,
    maxlength: 200
  },
  extractedCategory: {
    type: String,
    maxlength: 100
  },
  extractedDescription: {
    type: String,
    maxlength: 500
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  rawText: {
    type: String
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
});

// Main Expense Schema
const expenseSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Will be connected to Developer 1's User model
    index: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Company', // Will be connected to Developer 1's Company model
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    required: true,
    length: 3,
    uppercase: true
  },
  convertedAmount: {
    type: Number,
    required: true,
    min: 0.01
  },
  conversionRate: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: [
      'TRAVEL',
      'MEALS',
      'ACCOMMODATION',
      'TRANSPORT',
      'ENTERTAINMENT',
      'OFFICE_SUPPLIES',
      'TRAINING',
      'CLIENT_MEETING',
      'OTHER'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  date: {
    type: Date,
    required: true
  },
  receiptUrl: {
    type: String,
    maxlength: 500
  },
  ocrData: {
    type: ocrDataSchema,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  approvals: [approvalFlowSchema],
  currentApprovalStep: {
    type: Number,
    default: 0,
    min: 0
  },
  totalApprovalSteps: {
    type: Number,
    default: 0,
    min: 0
  },
  approvalRules: {
    type: {
      type: String,
      enum: ['SEQUENTIAL', 'PERCENTAGE', 'SPECIFIC', 'HYBRID'],
      default: 'SEQUENTIAL'
    },
    percentageThreshold: {
      type: Number,
      min: 0,
      max: 100
    },
    specificApproverRole: {
      type: String,
      enum: ['MANAGER', 'ADMIN', 'FINANCE', 'DIRECTOR', 'CFO']
    },
    hybridRule: {
      type: String,
      maxlength: 200
    }
  },
  // Conditional rules for Phase 5
  conditionalRules: [{
    id: { type: String, required: true },
    type: { type: String, enum: ['PERCENTAGE', 'SPECIFIC', 'HYBRID', 'AMOUNT_THRESHOLD', 'CATEGORY_SPECIFIC'], required: true },
    description: { type: String },
    threshold: { type: Number }, // For PERCENTAGE and AMOUNT_THRESHOLD rules
    approverRole: { type: String, enum: ['MANAGER', 'ADMIN', 'FINANCE', 'DIRECTOR', 'CFO'] }, // For SPECIFIC rules
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // For SPECIFIC rules
    category: { type: String }, // For CATEGORY_SPECIFIC rules
    rule: { type: String }, // For HYBRID rules (e.g., "60% OR CFO")
    conditions: [{ // For HYBRID rules
      type: { type: String, enum: ['PERCENTAGE', 'SPECIFIC'] },
      threshold: { type: Number },
      approverRole: { type: String }
    }],
    requiredApprovals: { type: Number, default: 1 }
  }],
  // Rules evaluation history for traceability
  rulesEvaluated: [{
    ruleId: { type: String, required: true },
    ruleType: { type: String, required: true },
    ruleDescription: { type: String },
    triggered: { type: Boolean, default: false },
    action: { type: String, enum: ['APPROVE', 'REJECT', null], default: null },
    details: { type: mongoose.Schema.Types.Mixed },
    evaluatedAt: { type: Date, default: Date.now },
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    evaluatedByRole: { type: String, enum: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'FINANCE', 'DIRECTOR', 'CFO'] }
  }],
  finalApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalRejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalActionAt: {
    type: Date
  },
  finalComments: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better query performance
expenseSchema.index({ employeeId: 1, createdAt: -1 });
expenseSchema.index({ companyId: 1, status: 1 });
expenseSchema.index({ status: 1, createdAt: -1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

// Virtual for approval progress
expenseSchema.virtual('approvalProgress').get(function() {
  if (this.totalApprovalSteps === 0) return 0;
  return (this.currentApprovalStep / this.totalApprovalSteps) * 100;
});

// Virtual for is fully approved
expenseSchema.virtual('isFullyApproved').get(function() {
  return this.status === 'APPROVED';
});

// Virtual for is pending approval
expenseSchema.virtual('isPendingApproval').get(function() {
  return this.status === 'PENDING';
});

// Pre-save middleware to update timestamps
expenseSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'APPROVED' || this.status === 'REJECTED')) {
    this.finalActionAt = new Date();
  }
  next();
});

// Instance method to get current approver
expenseSchema.methods.getCurrentApprover = function() {
  if (this.currentApprovalStep >= this.approvals.length) {
    return null;
  }
  return this.approvals[this.currentApprovalStep];
};

// Instance method to move to next approval step
expenseSchema.methods.moveToNextStep = function() {
  this.currentApprovalStep += 1;
  return this.save();
};

// Static method to find expenses by status
expenseSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Static method to find expenses by employee
expenseSchema.statics.findByEmployee = function(employeeId) {
  return this.find({ employeeId });
};

// Static method to find pending approvals for a specific approver
expenseSchema.statics.findPendingForApprover = function(approverId) {
  return this.find({
    status: 'PENDING',
    'approvals.approverId': approverId,
    'approvals.status': 'PENDING'
  });
};

module.exports = mongoose.model('Expense', expenseSchema);