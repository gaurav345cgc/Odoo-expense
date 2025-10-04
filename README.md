# Expense Management System (ExeSMan) - Developer 2

## 🎯 Project Overview

This is the **Expense Flow & Workflow Engine** component of the Expense Management System, built as a hackathon-ready MVP. Developer 2 is responsible for the core expense lifecycle system, OCR service, currency conversion, and approval workflow logic.

## 🏗️ Architecture

- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Models**: Mongoose ODM
- **External APIs**: ExchangeRate API, OCR services
- **File Structure**: Modular, scalable architecture

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # Database connection
│   │   └── env.js             # Environment configuration
│   ├── models/
│   │   ├── Expense.js         # Main expense model with approval flow
│   │   └── ExpenseLog.js      # Audit trail logging
│   ├── routes/                # API routes (Phase 2+)
│   ├── controllers/           # Route handlers (Phase 2+)
│   ├── services/              # Business logic (Phase 2+)
│   ├── middlewares/           # Custom middleware (Phase 2+)
│   ├── utils/                 # Utility functions (Phase 2+)
│   ├── tests/                 # Test files (Phase 2+)
│   ├── seed/
│   │   └── expenses.seed.js   # Sample data seeder
│   └── app.js                 # Main application entry point
├── uploads/                   # File upload directory
├── package.json
├── env.example               # Environment variables template
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- npm or yarn

### Installation

1. **Clone and setup**:
   ```bash
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB Atlas connection string
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

4. **Seed sample data** (optional):
   ```bash
   npm run seed
   ```

### Test Endpoints

Once the server is running, test these endpoints:

- **Health Check**: `GET http://localhost:3000/health`
- **API Status**: `GET http://localhost:3000/api/status`
- **Expense Model Test**: `GET http://localhost:3000/api/expenses/test`
- **Log Model Test**: `GET http://localhost:3000/api/logs/test`
- **Database Test**: `GET http://localhost:3000/api/db/test`

## 📊 Phase 1 Complete: Base Setup & Expense Schema Design

### ✅ Completed Features

1. **Project Structure**: Complete folder structure with all necessary directories
2. **Database Configuration**: MongoDB connection with environment variables
3. **Expense Model**: Comprehensive schema with:
   - Multi-step approval workflow
   - OCR data integration
   - Currency conversion support
   - Status tracking and audit trail
4. **ApprovalFlow Schema**: Subdocument for multi-step approvals
5. **ExpenseLog Schema**: Complete audit trail system
6. **Sample Data Seeder**: Mock data for testing
7. **Basic Server Setup**: Express app with middleware and test endpoints

### 🗄️ Database Schema

#### Expense Model
```javascript
{
  employeeId: ObjectId,           // Reference to User
  companyId: ObjectId,            // Reference to Company
  amount: Number,                 // Original amount
  currency: String,               // Original currency (3 chars)
  convertedAmount: Number,        // Amount in company currency
  conversionRate: Number,         // Exchange rate used
  category: String,               // Expense category
  description: String,            // Expense description
  date: Date,                     // Expense date
  receiptUrl: String,             // Receipt file path
  ocrData: Object,                // OCR extracted data
  status: String,                 // PENDING/APPROVED/REJECTED/CANCELLED
  approvals: [ApprovalFlow],      // Multi-step approval array
  currentApprovalStep: Number,    // Current step in approval
  totalApprovalSteps: Number,     // Total steps required
  approvalRules: Object,          // Conditional approval rules
  finalApprovedBy: ObjectId,      // Final approver
  finalRejectedBy: ObjectId,      // Final rejector
  finalActionAt: Date,            // Final action timestamp
  finalComments: String           // Final comments
}
```

#### ApprovalFlow Subdocument
```javascript
{
  step: Number,                   // Approval step number
  approverId: ObjectId,           // Approver user ID
  approverRole: String,           // Approver role
  status: String,                 // PENDING/APPROVED/REJECTED
  comments: String,               // Approval comments
  actedAt: Date                   // Action timestamp
}
```

#### ExpenseLog Model
```javascript
{
  expenseId: ObjectId,            // Reference to Expense
  action: String,                 // Action type
  performedBy: ObjectId,          // User who performed action
  performedByRole: String,        // User role
  previousStatus: String,         // Previous status
  newStatus: String,              // New status
  comments: String,               // Action comments
  metadata: Object,               // Additional data
  timestamp: Date                 // Action timestamp
}
```

## 🎯 Next Phases

### Phase 2: Expense CRUD + Currency Integration
- Implement expense creation, reading, updating
- Integrate ExchangeRate API for currency conversion
- Add file upload for receipts
- Create expense management endpoints

### Phase 3: OCR Receipt Service
- Integrate OCR API (Tesseract.js or Google Vision)
- Auto-extract expense data from receipts
- Create OCR upload endpoints

### Phase 4: Approval Workflow Logic
- Implement multi-step approval routing
- Create approval/rejection endpoints
- Add notification system

### Phase 5: Conditional & Hybrid Rule Engine
- Implement percentage-based approvals
- Add specific approver rules
- Create hybrid approval logic

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start with nodemon
npm start           # Start production server

# Testing
npm test            # Run tests
npm run seed        # Seed sample data

# Database
npm run seed        # Populate with sample data
```

## 🌐 Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://...

# Server
PORT=3000
NODE_ENV=development

# External APIs
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest
REST_COUNTRIES_API_URL=https://restcountries.com/v3.1/all?fields=name,currencies

# OCR
OCR_SERVICE_URL=https://api.ocr.space/parse/image
OCR_API_KEY=your_api_key

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## 🤝 Integration with Developer 1

This system is designed to integrate seamlessly with Developer 1's work:

- **Authentication**: Ready for JWT middleware integration
- **User Management**: Models reference User and Company collections
- **Role System**: Supports all defined roles (EMPLOYEE, MANAGER, ADMIN, etc.)
- **Company Setup**: Auto-creates company with currency on first signup

## 📝 Mock Data

The system includes comprehensive mock data for testing:
- 5 sample expenses with different statuses
- Multi-step approval flows
- Audit trail logs
- Various currencies and categories

## 🎉 Hackathon Ready

This Phase 1 implementation provides:
- ✅ Complete database schema
- ✅ Sample data for demo
- ✅ Test endpoints for validation
- ✅ Modular, scalable architecture
- ✅ Ready for Phase 2 development

**Ready to proceed to Phase 2: Expense CRUD + Currency Integration!**