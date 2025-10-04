const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const ExpenseLog = require('../models/ExpenseLog');
const config = require('../config/env');

// Mock data for testing (Developer 2)
const mockData = {
  companyId: new mongoose.Types.ObjectId(config.MOCK_COMPANY_ID),
  employeeId: new mongoose.Types.ObjectId(config.MOCK_EMPLOYEE_ID),
  managerId: new mongoose.Types.ObjectId(config.MOCK_MANAGER_ID),
  adminId: new mongoose.Types.ObjectId(config.MOCK_ADMIN_ID)
};

const sampleExpenses = [
  {
    employeeId: mockData.employeeId,
    companyId: mockData.companyId,
    amount: 150.00,
    currency: 'USD',
    convertedAmount: 150.00,
    conversionRate: 1.0,
    category: 'MEALS',
    description: 'Client lunch meeting at downtown restaurant',
    date: new Date('2024-01-15'),
    receiptUrl: '/uploads/receipt_001.jpg',
    status: 'PENDING',
    approvals: [
      {
        step: 1,
        approverId: mockData.managerId,
        approverRole: 'MANAGER',
        status: 'PENDING',
        comments: '',
        actedAt: null
      }
    ],
    currentApprovalStep: 0,
    totalApprovalSteps: 1,
    approvalRules: {
      type: 'SEQUENTIAL'
    }
  },
  {
    employeeId: mockData.employeeId,
    companyId: mockData.companyId,
    amount: 2500.00,
    currency: 'EUR',
    convertedAmount: 2750.00,
    conversionRate: 1.1,
    category: 'TRAVEL',
    description: 'Business trip to Paris - Flight and accommodation',
    date: new Date('2024-01-20'),
    receiptUrl: '/uploads/receipt_002.jpg',
    status: 'APPROVED',
    approvals: [
      {
        step: 1,
        approverId: mockData.managerId,
        approverRole: 'MANAGER',
        status: 'APPROVED',
        comments: 'Approved for business development meeting',
        actedAt: new Date('2024-01-21')
      }
    ],
    currentApprovalStep: 1,
    totalApprovalSteps: 1,
    approvalRules: {
      type: 'SEQUENTIAL'
    },
    finalApprovedBy: mockData.managerId,
    finalActionAt: new Date('2024-01-21')
  },
  {
    employeeId: mockData.employeeId,
    companyId: mockData.companyId,
    amount: 75.50,
    currency: 'GBP',
    convertedAmount: 90.60,
    conversionRate: 1.2,
    category: 'TRANSPORT',
    description: 'Taxi fare to client office',
    date: new Date('2024-01-25'),
    receiptUrl: '/uploads/receipt_003.jpg',
    status: 'REJECTED',
    approvals: [
      {
        step: 1,
        approverId: mockData.managerId,
        approverRole: 'MANAGER',
        status: 'REJECTED',
        comments: 'Please use company car or public transport for future trips',
        actedAt: new Date('2024-01-26')
      }
    ],
    currentApprovalStep: 1,
    totalApprovalSteps: 1,
    approvalRules: {
      type: 'SEQUENTIAL'
    },
    finalRejectedBy: mockData.managerId,
    finalActionAt: new Date('2024-01-26'),
    finalComments: 'Please use company car or public transport for future trips'
  },
  {
    employeeId: mockData.employeeId,
    companyId: mockData.companyId,
    amount: 500.00,
    currency: 'USD',
    convertedAmount: 500.00,
    conversionRate: 1.0,
    category: 'TRAINING',
    description: 'Professional certification course',
    date: new Date('2024-02-01'),
    receiptUrl: '/uploads/receipt_004.jpg',
    status: 'PENDING',
    approvals: [
      {
        step: 1,
        approverId: mockData.managerId,
        approverRole: 'MANAGER',
        status: 'APPROVED',
        comments: 'Good investment for skill development',
        actedAt: new Date('2024-02-02')
      },
      {
        step: 2,
        approverId: mockData.adminId,
        approverRole: 'ADMIN',
        status: 'PENDING',
        comments: '',
        actedAt: null
      }
    ],
    currentApprovalStep: 1,
    totalApprovalSteps: 2,
    approvalRules: {
      type: 'SEQUENTIAL'
    }
  },
  {
    employeeId: mockData.employeeId,
    companyId: mockData.companyId,
    amount: 1200.00,
    currency: 'USD',
    convertedAmount: 1200.00,
    conversionRate: 1.0,
    category: 'OFFICE_SUPPLIES',
    description: 'Laptop accessories and software licenses',
    date: new Date('2024-02-05'),
    receiptUrl: '/uploads/receipt_005.jpg',
    status: 'PENDING',
    approvals: [
      {
        step: 1,
        approverId: mockData.managerId,
        approverRole: 'MANAGER',
        status: 'PENDING',
        comments: '',
        actedAt: null
      }
    ],
    currentApprovalStep: 0,
    totalApprovalSteps: 1,
    approvalRules: {
      type: 'PERCENTAGE',
      percentageThreshold: 60
    }
  }
];

const sampleLogs = [
  {
    expenseId: null, // Will be set after expenses are created
    action: 'CREATED',
    performedBy: mockData.employeeId,
    performedByRole: 'EMPLOYEE',
    newStatus: 'PENDING',
    comments: 'Expense created and submitted for approval',
    metadata: {
      amount: 150.00,
      currency: 'USD',
      category: 'MEALS'
    }
  },
  {
    expenseId: null, // Will be set after expenses are created
    action: 'APPROVED',
    performedBy: mockData.managerId,
    performedByRole: 'MANAGER',
    previousStatus: 'PENDING',
    newStatus: 'APPROVED',
    comments: 'Approved for business development meeting',
    metadata: {
      approvalStep: 1,
      approverRole: 'MANAGER'
    }
  }
];

const seedExpenses = async () => {
  try {
    console.log('🌱 Starting expense seeding...');
    
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await Expense.deleteMany({});
    await ExpenseLog.deleteMany({});
    console.log('🗑️  Cleared existing expense data');
    
    // Create sample expenses
    const createdExpenses = await Expense.insertMany(sampleExpenses);
    console.log(`✅ Created ${createdExpenses.length} sample expenses`);
    
    // Create sample logs for the first two expenses
    const logsToCreate = [];
    
    // Log for first expense (pending)
    logsToCreate.push({
      ...sampleLogs[0],
      expenseId: createdExpenses[0]._id
    });
    
    // Log for second expense (approved)
    logsToCreate.push({
      ...sampleLogs[1],
      expenseId: createdExpenses[1]._id
    });
    
    // Create additional logs for approved expense
    logsToCreate.push({
      expenseId: createdExpenses[1]._id,
      action: 'CREATED',
      performedBy: mockData.employeeId,
      performedByRole: 'EMPLOYEE',
      newStatus: 'PENDING',
      comments: 'Travel expense submitted for approval',
      metadata: {
        amount: 2500.00,
        currency: 'EUR',
        category: 'TRAVEL'
      }
    });
    
    await ExpenseLog.insertMany(logsToCreate);
    console.log(`✅ Created ${logsToCreate.length} sample logs`);
    
    console.log('🎉 Expense seeding completed successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log(`- Total Expenses: ${createdExpenses.length}`);
    console.log(`- Pending: ${createdExpenses.filter(e => e.status === 'PENDING').length}`);
    console.log(`- Approved: ${createdExpenses.filter(e => e.status === 'APPROVED').length}`);
    console.log(`- Rejected: ${createdExpenses.filter(e => e.status === 'REJECTED').length}`);
    console.log(`- Total Logs: ${logsToCreate.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding expenses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedExpenses();
}

module.exports = { seedExpenses, sampleExpenses, sampleLogs };