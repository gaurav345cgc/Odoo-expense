# 🚀 Complete API Documentation - Expense Management System

## 📋 **Overview**
This document provides comprehensive API documentation for the integrated Expense Management System, including both Developer 1's authentication/user management modules and Developer 2's expense management system.

**Base URL**: `http://localhost:3000`  
**Version**: 1.0.0  
**Environment**: Development/Prototype

---

## 🔐 **Authentication & Authorization**

### **Note**: Authentication middleware has been **DISABLED** for prototype testing
- All endpoints are currently accessible without JWT tokens
- In production, JWT tokens would be required for protected routes
- Token format: `Authorization: Bearer <jwt_token>`

---

## 📚 **API Endpoints**

### **1. System Health & Status**

#### **Health Check**
```http
GET /health
```
**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### **API Status**
```http
GET /api/status
```
**Response:**
```json
{
  "message": "Expense Management System API",
  "version": "1.0.0",
  "developer": "Developer 2",
  "phase": "Phase 7 - Developer 1 Integration Complete",
  "features": [
    "Expense CRUD Operations",
    "Multi-step Approval Workflow",
    "OCR Receipt Processing",
    "Currency Conversion",
    "Audit Trail Logging",
    "Conditional Approval Rules",
    "Percentage-based Auto-approval",
    "Specific Approver Rules",
    "Hybrid Rule Engine",
    "Rule Evaluation Traceability",
    "Manager Dashboard APIs",
    "Pending Expenses with Filters",
    "Expense History Analytics",
    "Dashboard Statistics",
    "CSV Export Functionality",
    "Developer 1 Authentication System",
    "User Management Integration",
    "Company Management Integration",
    "JWT Authentication",
    "Role-based Access Control"
  ],
  "endpoints": {
    "health": "/health",
    "status": "/api/status",
    "expenses": "/api/expenses (Phase 2 - Active)",
    "ocr": "/api/expenses/ocr-* (Phase 3 - Active)",
    "workflow": "/api/workflow (Phase 4 - Active)",
    "conditional": "/api/test/*-rules* (Phase 5 - Active)",
    "dashboard": "/api/manager/* (Phase 6 - Active)",
    "auth": "/api/auth/* (Developer 1 - Active)",
    "users": "/api/users/* (Developer 1 - Active)",
    "companies": "/api/companies/* (Developer 1 - Active)"
  }
}
```

---

## 🔑 **Developer 1 - Authentication & User Management**

### **Authentication Endpoints**

#### **User Registration**
```http
POST /api/auth/signup
```
**Request Body:**
```json
{
  "name": "Alice Admin",
  "email": "admin@mycorp.com",
  "password": "password123",
  "country": "USA"
}
```
**Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "name": "Alice Admin",
      "email": "admin@mycorp.com",
      "role": "Admin",
      "companyId": "507f1f77bcf86cd799439011",
      "_id": "507f1f77bcf86cd799439012"
    },
    "company": {
      "name": "Alice Admin's Company",
      "country": "USA",
      "baseCurrency": "USD",
      "createdBy": "507f1f77bcf86cd799439012",
      "_id": "507f1f77bcf86cd799439011"
    }
  },
  "message": "User registered successfully"
}
```

#### **User Login**
```http
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "admin@mycorp.com",
  "password": "password123"
}
```
**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "507f1f77bcf86cd799439012"
  },
  "message": "User logged in successfully"
}
```

### **User Management Endpoints**

#### **Create New User**
```http
POST /api/users
```
**Request Body (Manager):**
```json
{
  "name": "Bob Manager",
  "email": "bob.manager@mycorp.com",
  "password": "manager123",
  "role": "Manager"
}
```
**Request Body (Employee):**
```json
{
  "name": "Charlie Employee",
  "email": "charlie.e@mycorp.com",
  "password": "employee123",
  "role": "Employee",
  "managerId": "507f1f77bcf86cd799439013"
}
```
**Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "name": "Charlie Employee",
    "email": "charlie.e@mycorp.com",
    "role": "Employee",
    "companyId": "507f1f77bcf86cd799439011",
    "managerId": "507f1f77bcf86cd799439013",
    "_id": "507f1f77bcf86cd799439014"
  },
  "message": "User created successfully"
}
```

#### **Get All Users**
```http
GET /api/users
```
**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Alice Admin",
      "email": "admin@mycorp.com",
      "role": "Admin",
      "companyId": "507f1f77bcf86cd799439011"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Bob Manager",
      "email": "bob.manager@mycorp.com",
      "role": "Manager",
      "companyId": "507f1f77bcf86cd799439011"
    }
  ]
}
```

#### **Update User Role**
```http
PATCH /api/users/:id/role
```
**Request Body:**
```json
{
  "role": "Manager"
}
```
**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Charlie Employee",
    "email": "charlie.e@mycorp.com",
    "role": "Manager",
    "companyId": "507f1f77bcf86cd799439011",
    "managerId": "507f1f77bcf86cd799439013"
  },
  "message": "User role updated"
}
```

#### **Assign User Manager**
```http
PATCH /api/users/:id/manager
```
**Request Body:**
```json
{
  "managerId": "507f1f77bcf86cd799439013"
}
```
**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Charlie Employee",
    "email": "charlie.e@mycorp.com",
    "role": "Employee",
    "companyId": "507f1f77bcf86cd799439011",
    "managerId": "507f1f77bcf86cd799439013"
  },
  "message": "Manager assigned successfully"
}
```

### **Company Management Endpoints**

#### **Get My Company**
```http
GET /api/companies/me
```
**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Alice Admin's Company",
    "country": "USA",
    "baseCurrency": "USD",
    "createdBy": "507f1f77bcf86cd799439012"
  }
}
```

#### **Update My Company**
```http
PATCH /api/companies/me
```
**Request Body:**
```json
{
  "name": "Innovate Corp International",
  "baseCurrency": "EUR"
}
```
**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Innovate Corp International",
    "country": "USA",
    "baseCurrency": "EUR",
    "createdBy": "507f1f77bcf86cd799439012"
  },
  "message": "Company updated successfully"
}
```

---

## 💰 **Developer 2 - Expense Management**

### **Expense CRUD Operations**

#### **Create Expense**
```http
POST /api/expenses
```
**Request Body:**
```json
{
  "amount": 150.50,
  "currency": "USD",
  "category": "TRAVEL",
  "description": "Business trip to client meeting",
  "date": "2024-01-15T00:00:00.000Z",
  "receiptUrl": "https://example.com/receipt.jpg"
}
```
**Response (201 Created):**
```json
{
  "message": "Expense created successfully",
  "expense": {
    "id": "507f1f77bcf86cd799439015",
    "amount": 150.50,
    "currency": "USD",
    "convertedAmount": 150.50,
    "conversionRate": 1.0,
    "category": "TRAVEL",
    "description": "Business trip to client meeting",
    "date": "2024-01-15T00:00:00.000Z",
    "receiptUrl": "https://example.com/receipt.jpg",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Get My Expenses**
```http
GET /api/expenses/my?page=1&limit=10&status=PENDING&category=TRAVEL&startDate=2024-01-01&endDate=2024-01-31&sortBy=createdAt&sortOrder=desc
```
**Response (200 OK):**
```json
{
  "message": "Expenses retrieved successfully",
  "expenses": [
    {
      "id": "507f1f77bcf86cd799439015",
      "amount": 150.50,
      "currency": "USD",
      "convertedAmount": 150.50,
      "category": "TRAVEL",
      "description": "Business trip to client meeting",
      "date": "2024-01-15T00:00:00.000Z",
      "status": "PENDING",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalExpenses": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### **Get Expense by ID**
```http
GET /api/expenses/:id
```
**Response (200 OK):**
```json
{
  "message": "Expense retrieved successfully",
  "expense": {
    "id": "507f1f77bcf86cd799439015",
    "amount": 150.50,
    "currency": "USD",
    "convertedAmount": 150.50,
    "conversionRate": 1.0,
    "category": "TRAVEL",
    "description": "Business trip to client meeting",
    "date": "2024-01-15T00:00:00.000Z",
    "receiptUrl": "https://example.com/receipt.jpg",
    "status": "PENDING",
    "approvals": [],
    "currentApprovalStep": 0,
    "totalApprovalSteps": 0,
    "approvalRules": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Update Expense**
```http
PATCH /api/expenses/:id
```
**Request Body:**
```json
{
  "amount": 175.00,
  "description": "Updated business trip description"
}
```
**Response (200 OK):**
```json
{
  "message": "Expense updated successfully",
  "expense": {
    "id": "507f1f77bcf86cd799439015",
    "amount": 175.00,
    "currency": "USD",
    "convertedAmount": 175.00,
    "category": "TRAVEL",
    "description": "Updated business trip description",
    "date": "2024-01-15T00:00:00.000Z",
    "status": "PENDING",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

#### **Delete Expense**
```http
DELETE /api/expenses/:id
```
**Response (200 OK):**
```json
{
  "message": "Expense deleted successfully"
}
```

#### **Get Expense Logs**
```http
GET /api/expenses/:id/logs?limit=10
```
**Response (200 OK):**
```json
{
  "message": "Expense logs retrieved successfully",
  "logs": [
    {
      "id": "507f1f77bcf86cd799439016",
      "action": "CREATED",
      "details": "Expense created",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "userId": "507f1f77bcf86cd799439012"
    }
  ]
}
```

### **Expense Utilities**

#### **Get Supported Currencies**
```http
GET /api/expenses/currencies
```
**Response (200 OK):**
```json
{
  "message": "Supported currencies retrieved successfully",
  "currencies": [
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    }
  ]
}
```

#### **Get Expense Categories**
```http
GET /api/expenses/categories
```
**Response (200 OK):**
```json
{
  "message": "Expense categories retrieved successfully",
  "categories": [
    {
      "value": "TRAVEL",
      "label": "Travel",
      "description": "Business travel expenses"
    },
    {
      "value": "MEALS",
      "label": "Meals",
      "description": "Food and dining"
    },
    {
      "value": "ACCOMMODATION",
      "label": "Accommodation",
      "description": "Hotel and lodging"
    },
    {
      "value": "TRANSPORT",
      "label": "Transport",
      "description": "Transportation costs"
    },
    {
      "value": "ENTERTAINMENT",
      "label": "Entertainment",
      "description": "Client entertainment"
    },
    {
      "value": "OFFICE_SUPPLIES",
      "label": "Office Supplies",
      "description": "Office equipment and supplies"
    },
    {
      "value": "TRAINING",
      "label": "Training",
      "description": "Professional development"
    },
    {
      "value": "CLIENT_MEETING",
      "label": "Client Meeting",
      "description": "Client meeting expenses"
    },
    {
      "value": "OTHER",
      "label": "Other",
      "description": "Miscellaneous expenses"
    }
  ]
}
```

#### **Test Currency Conversion**
```http
GET /api/expenses/test-conversion?amount=100&from=USD&to=EUR
```
**Response (200 OK):**
```json
{
  "message": "Currency conversion test successful",
  "conversion": {
    "from": "USD",
    "to": "EUR",
    "amount": 100,
    "convertedAmount": 85.50,
    "rate": 0.855,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Get Expense Statistics**
```http
GET /api/expenses/statistics?startDate=2024-01-01&endDate=2024-01-31&category=TRAVEL
```
**Response (200 OK):**
```json
{
  "message": "Expense statistics retrieved successfully",
  "statistics": {
    "totalExpenses": 5,
    "totalAmount": 1250.75,
    "averageAmount": 250.15,
    "byCategory": {
      "TRAVEL": {
        "count": 3,
        "totalAmount": 750.50
      },
      "MEALS": {
        "count": 2,
        "totalAmount": 500.25
      }
    },
    "byStatus": {
      "PENDING": 2,
      "APPROVED": 2,
      "REJECTED": 1
    }
  }
}
```

---

## 📄 **OCR Receipt Processing**

#### **Get OCR Information**
```http
GET /api/expenses/ocr-info
```
**Response (200 OK):**
```json
{
  "message": "OCR service information",
  "service": {
    "provider": "Google Vision API",
    "status": "active",
    "supportedFormats": ["jpg", "jpeg", "png", "pdf"],
    "maxFileSize": "10MB",
    "features": [
      "Text extraction",
      "Receipt parsing",
      "Amount detection",
      "Date extraction",
      "Merchant identification"
    ]
  }
}
```

#### **Get Sample Receipts**
```http
GET /api/expenses/ocr-samples
```
**Response (200 OK):**
```json
{
  "message": "Sample receipts retrieved successfully",
  "samples": [
    {
      "id": "sample1",
      "name": "Restaurant Receipt",
      "url": "https://example.com/samples/restaurant.jpg",
      "description": "Sample restaurant receipt for testing"
    }
  ]
}
```

#### **Test OCR**
```http
GET /api/expenses/ocr-test
```
**Response (200 OK):**
```json
{
  "message": "OCR test completed successfully",
  "testResult": {
    "status": "success",
    "extractedData": {
      "merchant": "Sample Restaurant",
      "amount": 45.50,
      "currency": "USD",
      "date": "2024-01-15",
      "items": ["Lunch", "Drink"]
    }
  }
}
```

#### **Process Receipt (Upload + OCR)**
```http
POST /api/expenses/ocr-upload
Content-Type: multipart/form-data
```
**Request Body (Form Data):**
```
file: [receipt image file]
```
**Response (200 OK):**
```json
{
  "message": "Receipt processed successfully",
  "ocrResult": {
    "merchant": "ABC Restaurant",
    "amount": 45.50,
    "currency": "USD",
    "date": "2024-01-15",
    "confidence": 0.95,
    "rawText": "ABC Restaurant\n123 Main St\nDate: 01/15/2024\nTotal: $45.50"
  },
  "fileInfo": {
    "originalName": "receipt.jpg",
    "size": 245760,
    "mimeType": "image/jpeg"
  }
}
```

#### **Auto-Submit Expense from OCR**
```http
POST /api/expenses/auto-submit
```
**Request Body:**
```json
{
  "ocrData": {
    "merchant": "ABC Restaurant",
    "amount": 45.50,
    "currency": "USD",
    "date": "2024-01-15"
  },
  "category": "MEALS",
  "description": "Business lunch with client"
}
```
**Response (201 Created):**
```json
{
  "message": "Expense auto-submitted successfully",
  "expense": {
    "id": "507f1f77bcf86cd799439017",
    "amount": 45.50,
    "currency": "USD",
    "category": "MEALS",
    "description": "Business lunch with client",
    "date": "2024-01-15T00:00:00.000Z",
    "status": "PENDING",
    "ocrData": {
      "merchant": "ABC Restaurant",
      "confidence": 0.95
    }
  }
}
```

---

## ⚙️ **Approval Workflow**

#### **Get Workflow Information**
```http
GET /api/workflow/info
```
**Response (200 OK):**
```json
{
  "message": "Workflow information retrieved successfully",
  "workflow": {
    "types": ["SEQUENTIAL", "PERCENTAGE", "SPECIFIC", "HYBRID"],
    "approvalSteps": {
      "SEQUENTIAL": "Step-by-step approval chain",
      "PERCENTAGE": "Percentage-based approval",
      "SPECIFIC": "Specific role approval",
      "HYBRID": "Combination of rules"
    },
    "roles": ["MANAGER", "ADMIN", "FINANCE", "DIRECTOR", "CFO"],
    "statuses": ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]
  }
}
```

#### **Test Workflow**
```http
POST /api/workflow/test
```
**Request Body:**
```json
{
  "amount": 1000,
  "currency": "USD",
  "category": "TRAVEL",
  "directorOnly": false,
  "managerOnly": false
}
```
**Response (200 OK):**
```json
{
  "message": "Workflow test completed successfully",
  "testResult": {
    "approvalRules": {
      "type": "SEQUENTIAL",
      "description": "Standard approval workflow"
    },
    "approvalFlow": [
      {
        "step": 1,
        "approverRole": "MANAGER",
        "status": "PENDING"
      },
      {
        "step": 2,
        "approverRole": "ADMIN",
        "status": "PENDING"
      }
    ]
  }
}
```

#### **Start Approval Workflow**
```http
POST /api/workflow/start/:id
```
**Response (200 OK):**
```json
{
  "message": "Approval workflow started successfully",
  "expense": {
    "id": "507f1f77bcf86cd799439015",
    "status": "PENDING",
    "currentApprovalStep": 1,
    "totalApprovalSteps": 2,
    "approvals": [
      {
        "step": 1,
        "approverRole": "MANAGER",
        "status": "PENDING"
      },
      {
        "step": 2,
        "approverRole": "ADMIN",
        "status": "PENDING"
      }
    ]
  }
}
```

#### **Approve Expense**
```http
PATCH /api/workflow/approve/:id
```
**Request Body:**
```json
{
  "comments": "Approved by Manager",
  "approverRole": "MANAGER"
}
```
**Response (200 OK):**
```json
{
  "message": "Expense approved successfully",
  "expense": {
    "id": "507f1f77bcf86cd799439015",
    "status": "PENDING",
    "currentApprovalStep": 2,
    "approvals": [
      {
        "step": 1,
        "approverRole": "MANAGER",
        "status": "APPROVED",
        "comments": "Approved by Manager",
        "approvedAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

#### **Reject Expense**
```http
PATCH /api/workflow/reject/:id
```
**Request Body:**
```json
{
  "comments": "Expense not justified",
  "approverRole": "MANAGER"
}
```
**Response (200 OK):**
```json
{
  "message": "Expense rejected successfully",
  "expense": {
    "id": "507f1f77bcf86cd799439015",
    "status": "REJECTED",
    "approvals": [
      {
        "step": 1,
        "approverRole": "MANAGER",
        "status": "REJECTED",
        "comments": "Expense not justified",
        "rejectedAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

#### **Get Pending Expenses**
```http
GET /api/workflow/pending?approverRole=MANAGER&limit=10&page=1
```
**Response (200 OK):**
```json
{
  "message": "Pending expenses retrieved successfully",
  "expenses": [
    {
      "id": "507f1f77bcf86cd799439015",
      "amount": 150.50,
      "currency": "USD",
      "category": "TRAVEL",
      "description": "Business trip to client meeting",
      "date": "2024-01-15T00:00:00.000Z",
      "currentApprovalStep": 1,
      "approvals": [
        {
          "step": 1,
          "approverRole": "MANAGER",
          "status": "PENDING"
        }
      ]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalExpenses": 1
  }
}
```

#### **Get Approval Statistics**
```http
GET /api/workflow/statistics
```
**Response (200 OK):**
```json
{
  "message": "Approval statistics retrieved successfully",
  "statistics": {
    "totalPending": 5,
    "totalApproved": 25,
    "totalRejected": 3,
    "byRole": {
      "MANAGER": {
        "pending": 3,
        "approved": 15,
        "rejected": 1
      },
      "ADMIN": {
        "pending": 2,
        "approved": 10,
        "rejected": 2
      }
    }
  }
}
```

#### **Get Approval History**
```http
GET /api/workflow/history/:id
```
**Response (200 OK):**
```json
{
  "message": "Approval history retrieved successfully",
  "history": [
    {
      "step": 1,
      "approverRole": "MANAGER",
      "status": "APPROVED",
      "comments": "Approved by Manager",
      "timestamp": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

## 📊 **Manager Dashboard**

#### **Get Pending Expenses**
```http
GET /api/manager/pending?approverRole=MANAGER&category=TRAVEL&startDate=2024-01-01&endDate=2024-01-31&limit=10&page=1
```
**Response (200 OK):**
```json
{
  "message": "Pending expenses retrieved successfully",
  "expenses": [
    {
      "id": "507f1f77bcf86cd799439015",
      "amount": 150.50,
      "currency": "USD",
      "category": "TRAVEL",
      "description": "Business trip to client meeting",
      "date": "2024-01-15T00:00:00.000Z",
      "currentApprovalStep": 1,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalExpenses": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### **Get Expense History**
```http
GET /api/manager/history?status=APPROVED&category=TRAVEL&startDate=2024-01-01&endDate=2024-01-31&limit=10&page=1
```
**Response (200 OK):**
```json
{
  "message": "Expense history retrieved successfully",
  "expenses": [
    {
      "id": "507f1f77bcf86cd799439015",
      "amount": 150.50,
      "currency": "USD",
      "category": "TRAVEL",
      "description": "Business trip to client meeting",
      "date": "2024-01-15T00:00:00.000Z",
      "status": "APPROVED",
      "approvedAt": "2024-01-15T11:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalExpenses": 1
  }
}
```

#### **Get Dashboard Statistics**
```http
GET /api/manager/stats?startDate=2024-01-01&endDate=2024-01-31
```
**Response (200 OK):**
```json
{
  "message": "Dashboard statistics retrieved successfully",
  "statistics": {
    "totalExpenses": 50,
    "totalAmount": 12500.75,
    "averageAmount": 250.15,
    "byStatus": {
      "PENDING": 10,
      "APPROVED": 35,
      "REJECTED": 5
    },
    "byCategory": {
      "TRAVEL": {
        "count": 20,
        "totalAmount": 5000.00
      },
      "MEALS": {
        "count": 15,
        "totalAmount": 3000.75
      },
      "ACCOMMODATION": {
        "count": 10,
        "totalAmount": 3500.00
      },
      "OTHER": {
        "count": 5,
        "totalAmount": 1000.00
      }
    },
    "approvalMetrics": {
      "averageApprovalTime": "2.5 days",
      "approvalRate": 87.5,
      "rejectionRate": 12.5
    }
  }
}
```

#### **Export Expenses**
```http
GET /api/manager/export?format=csv&status=APPROVED&startDate=2024-01-01&endDate=2024-01-31
```
**Response (200 OK):**
```json
{
  "message": "Export completed successfully",
  "export": {
    "format": "csv",
    "filename": "expenses_2024-01-01_to_2024-01-31.csv",
    "downloadUrl": "https://example.com/exports/expenses_2024-01-01_to_2024-01-31.csv",
    "recordCount": 35,
    "totalAmount": 8750.25,
    "generatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

## 🧪 **Test Endpoints (Development)**

### **Expense Test Endpoints**
```http
GET /api/expenses/test
GET /api/logs/test
GET /api/db/test
```

### **Manager Test Endpoints**
```http
GET /api/test/manager/pending
GET /api/test/manager/history
GET /api/test/manager/stats
GET /api/test/manager/export
```

### **Conditional Rules Test Endpoints**
```http
POST /api/test/expense-conditional
POST /api/test/apply-rules/:id
GET /api/test/rules-summary/:id
POST /api/test/approve/:id
GET /api/test/pending
```

---

## 📝 **Data Models**

### **Expense Categories**
- `TRAVEL` - Business travel expenses
- `MEALS` - Food and dining
- `ACCOMMODATION` - Hotel and lodging
- `TRANSPORT` - Transportation costs
- `ENTERTAINMENT` - Client entertainment
- `OFFICE_SUPPLIES` - Office equipment and supplies
- `TRAINING` - Professional development
- `CLIENT_MEETING` - Client meeting expenses
- `OTHER` - Miscellaneous expenses

### **Expense Statuses**
- `PENDING` - Awaiting approval
- `APPROVED` - Approved by all required approvers
- `REJECTED` - Rejected by an approver
- `CANCELLED` - Cancelled by employee

### **User Roles**
- `Admin` - System administrator
- `Manager` - Department manager
- `Employee` - Regular employee

### **Approval Roles**
- `MANAGER` - Department manager
- `ADMIN` - System administrator
- `FINANCE` - Finance department
- `DIRECTOR` - Company director
- `CFO` - Chief Financial Officer

### **Supported Currencies**
USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, BRL, MXN, RUB, KRW, SGD, HKD, NZD, SEK, NOK, DKK, PLN, CZK, HUF, TRY, ZAR, AED, SAR, QAR, KWD, BHD, OMR, JOD, LBP, EGP, MAD, TND, DZD

---

## ⚠️ **Error Responses**

### **Validation Error (400)**
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "amount",
      "message": "Amount must be greater than 0",
      "value": -10
    }
  ]
}
```

### **Not Found Error (404)**
```json
{
  "message": "Expense not found or access denied"
}
```

### **Server Error (500)**
```json
{
  "message": "Failed to create expense",
  "error": "Database connection failed"
}
```

### **Authentication Error (401)**
```json
{
  "statusCode": 401,
  "data": null,
  "message": "Invalid credentials."
}
```

### **Authorization Error (403)**
```json
{
  "statusCode": 403,
  "data": null,
  "message": "Access denied. Admin role required."
}
```

---

## 🔧 **Development Notes**

1. **Authentication**: Currently disabled for prototype testing
2. **Database**: MongoDB with Mongoose ODM
3. **File Upload**: Multer middleware for receipt processing
4. **OCR**: Google Vision API integration
5. **Currency**: Real-time exchange rates with caching
6. **Validation**: Joi schema validation
7. **Error Handling**: Global error handler with structured responses

---

## 📞 **Support**

For technical support or questions about the API, please refer to the development team or check the system status endpoint at `/api/status`.