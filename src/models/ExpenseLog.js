const mongoose = require('mongoose');

// ExpenseLog schema for audit trail
const expenseLogSchema = new mongoose.Schema({
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Expense',
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATED',
      'UPDATED',
      'SUBMITTED',
      'APPROVED',
      'REJECTED',
      'CANCELLED',
      'COMMENT_ADDED',
      'STATUS_CHANGED',
      'APPROVAL_STEP_CHANGED',
      'RULE_EVALUATED',
      'AUTO_APPROVED',
      'ESCALATED'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Will be connected to Developer 1's User model
  },
  performedByRole: {
    type: String,
    required: true,
    enum: ['EMPLOYEE', 'MANAGER', 'ADMIN', 'FINANCE', 'DIRECTOR', 'CFO']
  },
  previousStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
  },
  newStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
  },
  previousApprovalStep: {
    type: Number,
    min: 0
  },
  newApprovalStep: {
    type: Number,
    min: 0
  },
  comments: {
    type: String,
    maxlength: 1000
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    maxlength: 45
  },
  userAgent: {
    type: String,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
expenseLogSchema.index({ expenseId: 1, timestamp: -1 });
expenseLogSchema.index({ performedBy: 1, timestamp: -1 });
expenseLogSchema.index({ action: 1, timestamp: -1 });
expenseLogSchema.index({ timestamp: -1 });

// Virtual for formatted timestamp
expenseLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Static method to get logs for a specific expense
expenseLogSchema.statics.getExpenseLogs = function(expenseId, limit = 50) {
  return this.find({ expenseId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('performedBy', 'name email role');
};

// Static method to get logs by user
expenseLogSchema.statics.getUserLogs = function(userId, limit = 100) {
  return this.find({ performedBy: userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('expenseId', 'amount description status');
};

// Static method to get logs by action type
expenseLogSchema.statics.getLogsByAction = function(action, limit = 100) {
  return this.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('expenseId', 'amount description status')
    .populate('performedBy', 'name email role');
};

// Static method to create a log entry
expenseLogSchema.statics.createLog = function(logData) {
  return this.create({
    ...logData,
    timestamp: new Date()
  });
};

// Instance method to get formatted log entry
expenseLogSchema.methods.getFormattedLog = function() {
  return {
    id: this._id,
    action: this.action,
    performedBy: this.performedBy,
    performedByRole: this.performedByRole,
    previousStatus: this.previousStatus,
    newStatus: this.newStatus,
    comments: this.comments,
    timestamp: this.formattedTimestamp,
    metadata: this.metadata
  };
};

module.exports = mongoose.model('ExpenseLog', expenseLogSchema);