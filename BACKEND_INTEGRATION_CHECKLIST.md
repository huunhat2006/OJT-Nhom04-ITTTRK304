# ✅ Backend Integration Checklist

## 📋 Danh sách công việc kết nối Frontend ↔ Backend

### Phase 1: Backend API Development ⏳

#### Enum & Constants
- [ ] Tạo `NotificationType` enum với các type mới:
  - `SPENDING_SPIKE`
  - `RAPID_SPENDING`
  - `RECURRING_PAYMENT_DUE`
  - `BUDGET_PACE_WARNING`

#### DTOs
- [ ] Tạo `SpendingAlertResponse.java`
  ```java
  - alertType: String
  - severity: String (LOW, MEDIUM, HIGH, CRITICAL)
  - title: String
  - message: String
  - amount: BigDecimal
  - threshold: BigDecimal
  - categoryName: String
  - categoryId: Long
  - detectedAt: LocalDateTime
  - metadata: Map<String, Object>
  ```

- [ ] Tạo `SpendingAnalysisResponse.java`
  ```java
  - alerts: List<SpendingAlertResponse>
  - analysisDate: LocalDateTime
  - spaceId: Long
  - month: Integer
  - year: Integer
  ```

#### Service Layer
- [ ] Tạo `SpendingAlertService.java`
- [ ] Implement method: `checkBudgetExceeded()`
- [ ] Implement method: `checkSpendingSpikes()`
- [ ] Implement method: `checkRapidSpending()`
- [ ] Implement method: `checkRecurringPaymentsDue()`
- [ ] Implement method: `analyzeSpending()`

#### Controller
- [ ] Tạo `SpendingAlertController.java`
- [ ] Endpoint: `GET /api/v1/alerts/analysis`
- [ ] Endpoint: `POST /api/v1/alerts/check-now`
- [ ] Add authorization checks
- [ ] Add error handling

#### Scheduled Jobs
- [ ] Tạo `@Scheduled` method chạy mỗi ngày
- [ ] Logic gửi notifications cho users
- [ ] Cron expression: `0 0 8 * * *` (8AM daily)

---

### Phase 2: API Testing 🧪

#### Unit Tests
- [ ] Test `checkBudgetExceeded()` logic
- [ ] Test `checkSpendingSpikes()` calculation
- [ ] Test `checkRapidSpending()` projection
- [ ] Test `checkRecurringPaymentsDue()` date logic
- [ ] Test edge cases (empty data, null values)

#### Integration Tests
- [ ] Test API endpoints với MockMvc
- [ ] Test authorization (user chỉ thấy alerts của mình)
- [ ] Test với multiple spaces
- [ ] Test error responses

#### Manual API Testing
- [ ] Test với Postman/Thunder Client
- [ ] Verify response format khớp với frontend types
- [ ] Test với real data
- [ ] Test performance (response time < 1s)

---

### Phase 3: Frontend Integration 🔗

#### Update alertService.ts
- [ ] Comment out mock data calls
- [ ] Uncomment real API calls
- [ ] Verify axios config correct
- [ ] Test error handling

#### Code Changes Required
```typescript
// src/lib/alertService.ts

// BEFORE (Mock):
return mockApiCall(mockAnalysisResponse, 800);

// AFTER (Real):
const params = spaceId ? { spaceId } : {};
const { data } = await api.get<SpendingAnalysisResponse>(
  '/alerts/analysis', 
  { params }
);
return data;
```

#### Testing
- [ ] Login to app
- [ ] Navigate to `/alerts`
- [ ] Verify alerts load from backend
- [ ] Test filters work
- [ ] Test modal opens
- [ ] Check console for errors
- [ ] Test on different accounts
- [ ] Test on different spaces

---

### Phase 4: Error Handling & Edge Cases 🐛

#### Backend
- [ ] Handle null/empty space
- [ ] Handle no transactions
- [ ] Handle no budgets
- [ ] Handle date edge cases (month boundaries)
- [ ] Add proper error messages

#### Frontend
- [ ] Handle API errors gracefully
- [ ] Show user-friendly error messages
- [ ] Retry logic on network failure
- [ ] Loading states
- [ ] Empty states

---

### Phase 5: Performance Optimization ⚡

#### Backend
- [ ] Add database indexes if needed
- [ ] Cache analysis results (Redis/Caffeine)
- [ ] Optimize queries
- [ ] Pagination for large result sets

#### Frontend
- [ ] Debounce filter changes
- [ ] Lazy load modal content
- [ ] Implement virtual scrolling if needed
- [ ] Cache alerts data (React Query/SWR)

---

### Phase 6: Notification Integration 🔔

#### Backend
- [ ] Create notifications when alerts detected
- [ ] Store in `notifications` table
- [ ] Link to related entities (budget, category)

#### Frontend
- [ ] Bell icon shows alert notifications
- [ ] Click notification → Navigate to alerts page
- [ ] Mark as read functionality

---

## 📊 API Contract Verification

### Request Format
```http
GET /api/v1/alerts/analysis?spaceId=1&month=12&year=2024
Authorization: Bearer {token}
```

### Response Format (MUST MATCH)
```json
{
  "alerts": [
    {
      "alertType": "BUDGET_EXCEEDED",
      "severity": "CRITICAL",
      "title": "Vượt ngân sách Ăn uống",
      "message": "Bạn đã chi 5,200,000 VNĐ...",
      "amount": 5200000,
      "threshold": 5000000,
      "categoryName": "Ăn uống",
      "categoryId": 5,
      "detectedAt": "2024-12-15T10:30:00",
      "metadata": {
        "spentPercent": 104.0,
        "budgetId": 123,
        "currentAmount": 5200000,
        "budgetAmount": 5000000
      }
    }
  ],
  "analysisDate": "2024-12-15T10:30:00",
  "spaceId": 1,
  "month": 12,
  "year": 2024
}
```

### Field Requirements
- ✅ `alertType`: Exact match với frontend enum
- ✅ `severity`: Must be "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- ✅ `detectedAt`: ISO 8601 format
- ✅ `amount`, `threshold`: Numbers (will be converted to BigDecimal)
- ✅ `metadata`: Object with flexible fields

---

## 🔐 Security Checklist

- [ ] Only return alerts for spaces user has access to
- [ ] Validate spaceId belongs to user
- [ ] Add rate limiting on check-now endpoint
- [ ] Sanitize user input
- [ ] Log sensitive operations

---

## 📈 Monitoring & Analytics

- [ ] Log API response times
- [ ] Track alert counts by type
- [ ] Monitor scheduled job execution
- [ ] Set up alerts for job failures
- [ ] Track user engagement with alerts page

---

## 🚀 Deployment Checklist

### Backend
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Scheduled jobs enabled
- [ ] Logging configured
- [ ] Health checks pass

### Frontend
- [ ] Mock data removed/disabled
- [ ] API base URL correct for environment
- [ ] Build passes without errors
- [ ] TypeScript compilation clean
- [ ] No console errors in production

---

## 🧪 End-to-End Test Scenarios

### Scenario 1: Budget Exceeded Alert
1. User creates budget: 5,000,000 VNĐ for "Ăn uống"
2. User adds transactions totaling 5,200,000 VNĐ
3. Navigate to `/alerts`
4. **Expected:** See "Vượt ngân sách Ăn uống" alert (CRITICAL)

### Scenario 2: Spending Spike
1. User has 3 months of transaction history
2. Current month spending is 75% higher
3. Navigate to `/alerts`
4. **Expected:** See "Chi tăng đột biến" alert (HIGH)

### Scenario 3: Rapid Spending
1. User creates budget for month
2. On day 10 of month, spent 70% of budget
3. Navigate to `/alerts`
4. **Expected:** See "Chi quá nhanh" alert with projected date

### Scenario 4: Recurring Payment Due
1. User has recurring transaction set
2. Next run date is in 3 days
3. Navigate to `/alerts`
4. **Expected:** See "Thanh toán định kỳ sắp đến hạn" alert

### Scenario 5: No Alerts
1. User with healthy spending
2. Navigate to `/alerts`
3. **Expected:** See green "Không có cảnh báo" message

---

## 📞 Communication Checklist

### Frontend → Backend Requirements
- [x] TypeScript types defined
- [x] API contract documented
- [x] Mock data shows expected format
- [ ] Questions/clarifications sent

### Backend → Frontend Delivery
- [ ] API endpoints deployed
- [ ] Postman collection provided
- [ ] Sample responses shared
- [ ] Known issues documented

---

## ✅ Final Integration Test

Before marking as complete, verify:

- [ ] All 4 alert types generate correctly
- [ ] Filters work with real data
- [ ] Modal shows all metadata
- [ ] Navigation works end-to-end
- [ ] Multiple users don't see each other's alerts
- [ ] Multiple spaces per user work
- [ ] Performance is acceptable (< 2s load)
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No 404s or 500s
- [ ] Refresh button works
- [ ] Empty state displays when appropriate

---

## 🎯 Success Criteria

✅ **Ready for Production when:**
1. All alerts generate correctly with real data
2. Frontend displays all alert types
3. Performance < 2 seconds
4. No critical bugs
5. Security review passed
6. Manual testing complete
7. Stakeholder approval

---

## 📅 Timeline Estimate

- **Backend Development:** 3-5 days
- **Backend Testing:** 1-2 days
- **Frontend Integration:** 1 day
- **E2E Testing:** 1-2 days
- **Bug Fixes:** 1-2 days
- **Total:** ~7-12 days

---

## 🎉 Launch Plan

1. **Soft Launch:** Deploy to staging, test with internal users
2. **Beta:** Enable for selected users, gather feedback
3. **Full Launch:** Enable for all users
4. **Monitor:** Track metrics for first week
5. **Iterate:** Address feedback and issues

---

**Status:** Frontend ✅ Complete | Backend ⏳ In Progress

Last Updated: December 2024
