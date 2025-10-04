# Postman Testing Guide - Phase 1

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click "Import" button
3. Select `postman/Expense_Management_Phase1_Collection.json`
4. Collection will be imported with all test endpoints

### 2. Set Environment Variable
1. In Postman, go to "Environments"
2. Create new environment: "Expense Management - Phase 1"
3. Add variable:
   - **Variable**: `baseUrl`
   - **Initial Value**: `http://localhost:3000`
   - **Current Value**: `http://localhost:3000`

### 3. Start Server
```bash
npm run dev
```

### 4. Run Tests
1. Select the imported collection
2. Click "Run" button
3. Select all requests
4. Click "Run Expense Management System - Phase 1"

## 📋 Test Endpoints

### Health & Status
| Method | Endpoint | Description | Expected Status |
|--------|----------|-------------|-----------------|
| GET | `/health` | Health check | 200 |
| GET | `/api/status` | API information | 200 |

### Database & Models
| Method | Endpoint | Description | Expected Status |
|--------|----------|-------------|-----------------|
| GET | `/api/db/test` | Database connection test | 200 |
| GET | `/api/expenses/test` | Expense model test | 200 |
| GET | `/api/logs/test` | ExpenseLog model test | 200 |

### Error Handling
| Method | Endpoint | Description | Expected Status |
|--------|----------|-------------|-----------------|
| GET | `/api/nonexistent` | 404 error test | 404 |

## 🧪 Manual Testing Steps

### Step 1: Health Check
1. Send GET request to `{{baseUrl}}/health`
2. Verify response:
   ```json
   {
     "status": "OK",
     "timestamp": "2025-10-04T04:15:46.826Z",
     "environment": "development",
     "version": "1.0.0"
   }
   ```

### Step 2: API Status
1. Send GET request to `{{baseUrl}}/api/status`
2. Verify response includes:
   - API version and developer info
   - Feature list
   - Available endpoints
   - Phase information

### Step 3: Database Test
1. Send GET request to `{{baseUrl}}/api/db/test`
2. Verify response:
   ```json
   {
     "message": "Database connection successful",
     "collections": {
       "expenses": 5,
       "expenseLogs": 3
     },
     "mockData": {
       "companyId": "507f1f77bcf86cd799439011",
       "employeeId": "507f1f77bcf86cd799439012",
       "managerId": "507f1f77bcf86cd799439013",
       "adminId": "507f1f77bcf86cd799439014"
     }
   }
   ```

### Step 4: Expense Model Test
1. Send GET request to `{{baseUrl}}/api/expenses/test`
2. Verify response includes:
   - 5 sample expenses
   - Valid amounts, currencies, categories
   - Different statuses (PENDING, APPROVED, REJECTED)

### Step 5: ExpenseLog Model Test
1. Send GET request to `{{baseUrl}}/api/logs/test`
2. Verify response includes:
   - 3 sample logs
   - Valid actions (CREATED, APPROVED)
   - Valid roles (EMPLOYEE, MANAGER)

### Step 6: Error Handling Test
1. Send GET request to `{{baseUrl}}/api/nonexistent`
2. Verify response:
   ```json
   {
     "message": "Route not found",
     "availableRoutes": [
       "GET /health",
       "GET /api/status",
       "GET /api/expenses/test",
       "GET /api/logs/test",
       "GET /api/db/test"
     ]
   }
   ```

## 🔍 Expected Results

### ✅ All Tests Should Pass
- **Response Time**: < 5000ms for all requests
- **Status Codes**: Match expected status codes
- **JSON Format**: All responses should be valid JSON
- **Data Validation**: Sample data should be present and valid

### 📊 Sample Data Validation
- **Expenses**: 5 expenses with different statuses
- **Logs**: 3 audit trail entries
- **Currencies**: USD, EUR, GBP
- **Categories**: MEALS, TRAVEL, TRANSPORT, TRAINING, OFFICE_SUPPLIES
- **Statuses**: PENDING, APPROVED, REJECTED

## 🐛 Troubleshooting

### Server Not Starting
1. Check if port 3000 is available
2. Verify MongoDB connection
3. Check environment variables

### Database Connection Issues
1. Ensure MongoDB is running
2. Check MONGODB_URI in environment
3. Verify database permissions

### No Sample Data
1. Run seed command: `npm run seed`
2. Check database connection
3. Verify seed file execution

### 404 Errors
1. Ensure server is running
2. Check endpoint URLs
3. Verify route configuration

## 📈 Performance Expectations

| Endpoint | Expected Response Time |
|----------|----------------------|
| `/health` | < 100ms |
| `/api/status` | < 100ms |
| `/api/db/test` | < 200ms |
| `/api/expenses/test` | < 150ms |
| `/api/logs/test` | < 150ms |
| `/api/nonexistent` | < 100ms |

## 🎯 Success Criteria

Phase 1 is considered successful when:
- ✅ All 6 test endpoints return expected responses
- ✅ Database connection is successful
- ✅ Sample data is present (5 expenses, 3 logs)
- ✅ Error handling works correctly
- ✅ Response times are within acceptable limits
- ✅ All JSON responses are valid

## 🚀 Next Steps

After successful Phase 1 testing:
1. **Phase 2**: Implement expense CRUD operations
2. **Phase 3**: Add OCR receipt processing
3. **Phase 4**: Implement approval workflow
4. **Phase 5**: Add conditional approval rules

---
*Happy Testing! 🎉*