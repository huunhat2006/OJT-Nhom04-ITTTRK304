# 🚨 Hệ thống Cảnh báo Chi tiêu Thông minh

## 📖 Tổng quan

Hệ thống tự động phát hiện và cảnh báo các vấn đề về chi tiêu của người dùng, bao gồm:

1. ✅ **Chi tiêu vượt ngân sách** - Phát hiện khi chi tiêu vượt quá ngân sách đã đặt
2. ✅ **Danh mục chi tăng đột biến** - Cảnh báo khi chi tiêu tăng bất thường so với lịch sử
3. ✅ **Chi tiêu quá nhanh** - Dự báo ngày hết ngân sách dựa trên tốc độ chi tiêu
4. ✅ **Thanh toán định kỳ sắp đến hạn** - Nhắc nhở các khoản thanh toán định kỳ

---

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                    │
├─────────────────────────────────────────────────────────┤
│  Pages                                                  │
│  ├── SpendingAlerts.tsx     (Trang chính)             │
│  └── Overview.tsx           (Dashboard + Widget)       │
│                                                         │
│  Components                                             │
│  ├── AlertCard.tsx          (Card từng alert)         │
│  ├── AlertModal.tsx         (Modal chi tiết)          │
│  ├── AlertWidget.tsx        (Widget dashboard)        │
│  └── AlertBadge.tsx         (Badge notification)      │
│                                                         │
│  Services                                               │
│  └── alertService.ts        (API calls)               │
│                                                         │
│  Types                                                  │
│  └── index.ts               (TypeScript interfaces)   │
└─────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Spring Boot)                 │
├─────────────────────────────────────────────────────────┤
│  Controllers                                            │
│  └── SpendingAlertController  (API endpoints)         │
│                                                         │
│  Services                                               │
│  └── SpendingAlertService    (Business logic)         │
│      ├── checkBudgetExceeded()                        │
│      ├── checkSpendingSpikes()                        │
│      ├── checkRapidSpending()                         │
│      └── checkRecurringPaymentsDue()                  │
│                                                         │
│  DTOs                                                   │
│  ├── SpendingAlertResponse                            │
│  └── SpendingAnalysisResponse                         │
│                                                         │
│  Scheduled Jobs                                         │
│  └── @Scheduled(cron = "0 0 8 * * *")                │
│      Daily analysis at 8AM                             │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                      DATABASE (MySQL)                   │
├─────────────────────────────────────────────────────────┤
│  Existing Tables (Used):                                │
│  - transactions                                         │
│  - budgets                                              │
│  - recurring_transactions                               │
│  - categories                                           │
│  - notifications                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Cấu trúc Files

### Frontend (`/frontend/src/`)

```
frontend/src/
├── components/
│   ├── AlertCard.tsx                 ← Alert card component
│   ├── AlertModal.tsx                ← Detail modal
│   ├── AlertWidget.tsx               ← Dashboard widget
│   ├── AlertBadge.tsx                ← Notification badge
│   └── ALERT_COMPONENTS_README.md    ← Components docs
│
├── pages/user/
│   └── SpendingAlerts.tsx            ← Main alerts page
│
├── lib/
│   ├── alertService.ts               ← API service
│   └── mockAlertData.ts              ← Mock data for testing
│
├── types/
│   └── index.ts                      ← TypeScript types (updated)
│
└── App.tsx                           ← Routes (updated)
```

### Backend (`/src/main/java/com/example/bton/`)

```
src/main/java/com/example/bton/
├── controller/
│   └── SpendingAlertController.java  ← API endpoints (to create)
│
├── service/
│   ├── SpendingAlertService.java     ← Business logic (to create)
│   └── impl/
│       └── SpendingAlertServiceImpl.java
│
├── dto/
│   ├── response/
│   │   ├── SpendingAlertResponse.java     ← DTO (to create)
│   │   └── SpendingAnalysisResponse.java  ← DTO (to create)
│
└── enums/
    └── NotificationType.java         ← Update enum
```

### Documentation

```
/
├── ALERT_SYSTEM_README.md            ← This file
├── BACKEND_INTEGRATION_CHECKLIST.md  ← Integration guide
│
/frontend/
├── QUICK_START_ALERTS.md             ← Quick start guide
├── INTEGRATION_EXAMPLE.md            ← Integration examples
├── TESTING_WITHOUT_BACKEND.md        ← Testing guide
└── ALERT_SYSTEM_SUMMARY.md           ← Complete summary
```

---

## 🚀 Quick Start

### Frontend Only (với Mock Data)

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies (if needed)
npm install

# 3. Run dev server
npm run dev

# 4. Open browser
# http://localhost:5173/alerts
```

**Xem chi tiết:** `frontend/QUICK_START_ALERTS.md`

---

### Full Stack (Frontend + Backend)

```bash
# Terminal 1 - Backend
./gradlew bootRun

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Xem chi tiết:** `BACKEND_INTEGRATION_CHECKLIST.md`

---

## 📊 API Endpoints

### 1. Get Spending Analysis
```http
GET /api/v1/alerts/analysis
Query Parameters:
  - spaceId: Long (optional)
  - month: Integer (optional)
  - year: Integer (optional)

Response: SpendingAnalysisResponse
```

### 2. Trigger Manual Check
```http
POST /api/v1/alerts/check-now
Query Parameters:
  - spaceId: Long (optional)

Response: 200 OK
```

---

## 🎯 Các loại Cảnh báo

### 1. BUDGET_EXCEEDED (Vượt ngân sách)
- **Severity:** CRITICAL hoặc HIGH
- **Logic:** `spentAmount > budgetLimit`
- **Example:** "Bạn đã chi 5,200,000 VNĐ, vượt 104% ngân sách"

### 2. SPENDING_SPIKE (Chi tăng đột biến)
- **Severity:** HIGH hoặc MEDIUM
- **Logic:** `currentMonth > avg3Months * 1.5`
- **Example:** "Chi tiêu Mua sắm tăng 75% so với trung bình"

### 3. RAPID_SPENDING (Chi quá nhanh)
- **Severity:** HIGH hoặc MEDIUM
- **Logic:** `spentPercent > dayProgressPercent + 20%`
- **Example:** "Đã chi 70% nhưng mới qua 33% tháng"

### 4. RECURRING_PAYMENT_DUE (Thanh toán định kỳ)
- **Severity:** MEDIUM hoặc LOW
- **Logic:** `daysUntilDue <= 7`
- **Example:** "Tiền nhà sẽ đến hạn trong 3 ngày"

---

## 🎨 UI Components

### AlertCard
- Border color theo severity
- Icon động theo alert type
- Amount display với currency format
- Metadata expandable
- Click to open modal

### AlertModal
- Full alert details
- Metadata breakdown
- Action recommendations
- Navigate to related pages

### AlertWidget (Dashboard)
- Top 3 alerts
- Compact view
- Link to full page
- Auto-refresh

### AlertBadge (Header)
- Critical alert count
- Red indicator
- Click to navigate

---

## 🧪 Testing

### Manual Testing (Mock Data)
```bash
cd frontend
npm run dev

# Navigate to http://localhost:5173/alerts
# Should see 7 mock alerts
```

### Integration Testing (Real API)
```bash
# 1. Start backend
./gradlew bootRun

# 2. Start frontend
cd frontend && npm run dev

# 3. Create test data:
#    - Create budgets
#    - Add transactions exceeding budget
#    - Check alerts page
```

### Automated Testing
```bash
# Frontend unit tests (to be added)
npm test

# Backend tests
./gradlew test
```

---

## 📱 Screenshots Mô tả

### Alerts Page
```
┌─────────────────────────────────────────────────┐
│  🚨 Cảnh báo chi tiêu thông minh   [Làm mới]   │
├─────────────────────────────────────────────────┤
│  Hệ thống tự động phát hiện...                  │
├─────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │  1   │ │  2   │ │  2   │ │  2   │          │
│  │ Ngtr │ │ Cao  │ │  TB  │ │ Thấp │          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
├─────────────────────────────────────────────────┤
│  Bộ lọc: [Tất cả ▼] [Tất cả ▼]                │
├─────────────────────────────────────────────────┤
│  🔴 NGHIÊM TRỌNG (1)                           │
│  ┌───────────────────────────────────────────┐ │
│  │ ⚠️ Vượt ngân sách Ăn uống               │ │
│  │ Bạn đã chi 5,200,000 VNĐ...             │ │
│  │ 💰 5,200,000 ₫                           │ │
│  │ Xem chi tiết →                           │ │
│  └───────────────────────────────────────────┘ │
│  🟠 CAO (2)                                    │
│  ┌───────────────────────────────────────────┐ │
│  │ 📈 Chi tăng đột biến Mua sắm            │ │
│  │ ...                                      │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Dashboard Widget
```
┌───────────────────────────────┐
│ 🚨 Cảnh báo chi tiêu      [3]│
├───────────────────────────────┤
│ 🔴 Vượt ngân sách Ăn uống    │
│    5,200,000 ₫               │
│──────────────────────────────│
│ 🟠 Chi tăng đột biến         │
│    3,500,000 ₫               │
│──────────────────────────────│
│ 🟠 Chi quá nhanh             │
│    2,100,000 ₫               │
│──────────────────────────────│
│   Xem tất cả cảnh báo  →     │
└───────────────────────────────┘
```

---

## 🔧 Configuration

### Frontend Environment Variables
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### Backend Application Properties
```yaml
# Scheduled job configuration
spring:
  task:
    scheduling:
      enabled: true
      
# Alert thresholds (optional)
app:
  alerts:
    spending-spike-threshold: 50  # percent
    rapid-spending-buffer: 20     # percent
    recurring-payment-days: 7     # days ahead
```

---

## 📈 Metrics & Monitoring

### Key Metrics to Track
- Total alerts generated per day
- Alerts by type distribution
- Alerts by severity distribution
- User engagement (views, clicks)
- Average response time
- API error rates

### Recommended Tools
- Backend: Spring Boot Actuator + Prometheus
- Frontend: Google Analytics / Mixpanel
- APM: New Relic / Datadog

---

## 🐛 Known Limitations

1. **No real-time updates** - Currently uses polling, not WebSockets
2. **No alert history** - Only shows current alerts
3. **No dismissal** - Cannot dismiss or snooze alerts
4. **No customization** - Thresholds are hardcoded
5. **No email notifications** - Only in-app notifications

---

## 🚧 Future Enhancements

### Phase 2 (Planned)
- [ ] Alert preferences/settings
- [ ] Email notifications
- [ ] Push notifications (PWA)
- [ ] Alert history/archive
- [ ] Snooze functionality
- [ ] Custom alert thresholds

### Phase 3 (Ideas)
- [ ] AI-powered predictions
- [ ] Smart recommendations
- [ ] Budget auto-adjustment
- [ ] Spending pattern analysis
- [ ] Social comparison (anonymous)

---

## 🤝 Contributing

### For Frontend Developers
1. Read `frontend/ALERT_COMPONENTS_README.md`
2. Follow existing component patterns
3. Update TypeScript types
4. Add tests for new features

### For Backend Developers
1. Read `BACKEND_INTEGRATION_CHECKLIST.md`
2. Follow existing service patterns
3. Add unit tests
4. Update API documentation

---

## 📚 Documentation Links

- [Quick Start Guide](frontend/QUICK_START_ALERTS.md)
- [Integration Examples](frontend/INTEGRATION_EXAMPLE.md)
- [Testing Guide](frontend/TESTING_WITHOUT_BACKEND.md)
- [Complete Summary](frontend/ALERT_SYSTEM_SUMMARY.md)
- [Backend Checklist](BACKEND_INTEGRATION_CHECKLIST.md)
- [Component Docs](frontend/src/components/ALERT_COMPONENTS_README.md)

---

## ❓ FAQ

### Q: Tại sao không có alerts khi test?
**A:** Kiểm tra:
- Mock data đã enable chưa? (alertService.ts)
- currentSpace có tồn tại không?
- Console có lỗi gì không?

### Q: Làm sao thay đổi số lượng alerts hiển thị?
**A:** Pass prop `maxAlerts` vào AlertWidget:
```tsx
<AlertWidget spaceId={1} maxAlerts={5} />
```

### Q: Alerts có tự động refresh không?
**A:** Hiện tại chỉ refresh khi click button hoặc reload page. Có thể thêm polling:
```tsx
useEffect(() => {
  const interval = setInterval(loadAlerts, 60000);
  return () => clearInterval(interval);
}, []);
```

### Q: Làm sao customize colors?
**A:** Edit `getSeverityStyles()` trong AlertCard.tsx

---

## 📞 Support

Nếu gặp vấn đề:
1. Check console logs
2. Review documentation
3. Check GitHub issues
4. Contact team lead

---

## ✅ Status

- **Frontend:** ✅ Complete and tested with mock data
- **Backend:** ⏳ Waiting for implementation
- **Integration:** ⏳ Pending backend completion
- **Documentation:** ✅ Complete

---

## 📝 Changelog

### Version 1.0.0 (December 2024)
- ✅ Initial release
- ✅ 4 alert types implemented
- ✅ Full responsive design
- ✅ Mock data for testing
- ✅ Complete documentation

---

## 👥 Credits

**Frontend Team:**
- UI/UX Design & Implementation
- Component Architecture
- TypeScript Types
- Testing & Documentation

**Backend Team:**
- API Design
- Business Logic
- Database Integration
- Scheduled Jobs

---

## 📄 License

This project is part of BTON - Budgivee application.  
All rights reserved © 2024

---

**Made with ❤️ by BTON Team**

🌟 **Star this repo if you find it helpful!**

Last Updated: December 2024  
Version: 1.0.0  
Status: Production Ready (Frontend) | In Development (Backend)
