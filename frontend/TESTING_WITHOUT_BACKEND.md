# 🧪 Testing Alert Components Without Backend

## 📝 Hướng dẫn test components khi chưa có Backend API

### Step 1: Enable Mock Data

Mở file `src/lib/alertService.ts` và thay đổi như sau:

```typescript
// src/lib/alertService.ts
import api from './axios';
import { SpendingAnalysisResponse } from '../types';
import { mockAnalysisResponse, mockApiCall } from './mockAlertData'; // ← THÊM IMPORT

class AlertService {
  async getSpendingAnalysis(spaceId?: number): Promise<SpendingAnalysisResponse> {
    // COMMENT CODE GỌI API THẬT:
    // const params = spaceId ? { spaceId } : {};
    // const { data } = await api.get<SpendingAnalysisResponse>('/alerts/analysis', { params });
    // return data;
    
    // ← SỬ DỤNG MOCK DATA
    return mockApiCall(mockAnalysisResponse, 800);
  }

  async triggerManualCheck(spaceId?: number): Promise<void> {
    // MOCK: Just delay
    return mockApiCall(undefined, 1000);
  }

  async getAlertsByMonth(
    spaceId: number,
    month: number,
    year: number
  ): Promise<SpendingAnalysisResponse> {
    // MOCK: Return same data
    return mockApiCall(mockAnalysisResponse, 500);
  }
}

export const alertService = new AlertService();
export default alertService;
```

---

### Step 2: Run Development Server

```bash
cd frontend
npm run dev
```

Navigate to: **http://localhost:5173/alerts**

---

### Step 3: Test Scenarios

#### ✅ Test 1: View All Alerts Page

1. Go to `/alerts`
2. You should see:
   - 7 mock alerts
   - Summary cards showing counts by severity
   - Filters working
   - Click on alerts to open modal

**Expected:**
```
NGHIÊM TRỌNG (1): Vượt ngân sách Ăn uống
CAO (2): Chi tăng đột biến, Chi quá nhanh
TRUNG BÌNH (2): Tiền nhà sắp đến hạn, Sắp vượt ngân sách
THẤP (2): Tốc độ chi tiêu, Nhắc nhở Internet
```

---

#### ✅ Test 2: Alert Widget on Dashboard

Add to `src/pages/user/Overview.tsx`:

```tsx
import AlertWidget from '../../components/AlertWidget';

// Inside component
<AlertWidget spaceId={1} maxAlerts={3} />
```

**Expected:**
- Shows top 3 alerts
- Has "Xem tất cả cảnh báo" link
- Severity color coding works

---

#### ✅ Test 3: Alert Badge

Add to header in `Overview.tsx`:

```tsx
import AlertBadge from '../../components/AlertBadge';

<AlertBadge spaceId={1} />
```

**Expected:**
- Shows "1 cảnh báo nghiêm trọng" (red badge)
- Clicking navigates to `/alerts`

---

#### ✅ Test 4: Filter Functionality

On `/alerts` page:

1. **Filter by Severity:**
   - Select "Nghiêm trọng" → Shows 1 alert
   - Select "Cao" → Shows 2 alerts
   - Select "Tất cả" → Shows 7 alerts

2. **Filter by Type:**
   - Select "Vượt ngân sách" → Shows 1 alert
   - Select "Chi tăng đột biến" → Shows 1 alert
   - Select "Thanh toán định kỳ" → Shows 2 alerts

---

#### ✅ Test 5: Alert Modal

1. Click any alert card
2. Modal should open showing:
   - Alert title & message
   - Amount (formatted currency)
   - Category name
   - Severity badge
   - Metadata (increase %, days remaining, etc.)
   - Recommendations
   - Action buttons

---

#### ✅ Test 6: Responsive Design

Test on different screen sizes:

**Mobile (< 768px):**
- Alerts stack vertically
- Filter dropdowns full width
- Modal full screen

**Tablet (768px - 1024px):**
- 2 column grid for summary cards
- Alerts still stack

**Desktop (> 1024px):**
- 4 column grid for summary cards
- Alert widget takes 1/3 width in grid

---

#### ✅ Test 7: Loading States

To test loading states, increase delay in mock:

```typescript
// In alertService.ts
return mockApiCall(mockAnalysisResponse, 3000); // 3 second delay
```

**Expected:**
- Skeleton loading animation
- Smooth transition to content

---

#### ✅ Test 8: Empty State

To test no alerts, modify mock data:

```typescript
// In alertService.ts
const emptyResponse = {
  ...mockAnalysisResponse,
  alerts: [],
};
return mockApiCall(emptyResponse);
```

**Expected:**
- Green success message
- "Không có cảnh báo" text
- Checkmark icon

---

### Step 4: Test with Random Data

For variety, use random generator:

```typescript
// In alertService.ts
import { generateRandomAlerts, mockApiCall } from './mockAlertData';

async getSpendingAnalysis(spaceId?: number): Promise<SpendingAnalysisResponse> {
  return mockApiCall({
    alerts: generateRandomAlerts(10), // Random 10 alerts
    analysisDate: new Date().toISOString(),
    spaceId: spaceId || 1,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
}
```

---

## 🎨 Visual Testing Checklist

### Colors
- [ ] CRITICAL alerts are red
- [ ] HIGH alerts are orange
- [ ] MEDIUM alerts are yellow
- [ ] LOW alerts are blue

### Icons
- [ ] Budget exceeded: Triangle warning
- [ ] Spending spike: Trending up arrow
- [ ] Rapid spending: Lightning bolt
- [ ] Recurring payment: Clock

### Layout
- [ ] Cards have proper spacing
- [ ] Borders are visible
- [ ] Hover effects work
- [ ] Click areas are large enough

### Typography
- [ ] Titles are bold and readable
- [ ] Messages are not truncated
- [ ] Currency amounts are formatted
- [ ] Dates are formatted (if shown)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot find module 'mockAlertData'"

**Solution:**
```bash
# Make sure file exists
ls src/lib/mockAlertData.ts

# Restart dev server
npm run dev
```

---

### Issue 2: Alerts not showing

**Check:**
1. Mock data is imported correctly
2. `spaceId` is passed to components
3. No console errors
4. API call is actually using mock

---

### Issue 3: Modal not opening

**Check:**
1. `isModalOpen` state is toggled
2. `selectedAlert` is set
3. Modal component is imported
4. No z-index issues

---

### Issue 4: Currency not formatted

**Check:**
```typescript
// Verify formatCurrency function in utils
import { formatCurrency } from '../lib/utils';

console.log(formatCurrency(5000000)); 
// Should output: "5.000.000 ₫" or similar
```

---

## 📊 Mock Data Structure Reference

```typescript
SpendingAlert {
  alertType: 'BUDGET_EXCEEDED' | 'SPENDING_SPIKE' | ...
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  message: string
  amount?: number
  threshold?: number
  categoryName?: string
  categoryId?: number
  detectedAt: string (ISO date)
  metadata?: {
    currentAmount?: number
    previousAmount?: number
    increasePercent?: number
    daysRemaining?: number
    estimatedRunOutDay?: number
    spentPercent?: number
    budgetId?: number
    // ... more fields
  }
}
```

---

## 🔄 Switch Back to Real API

When backend is ready, revert changes:

```typescript
// src/lib/alertService.ts
async getSpendingAnalysis(spaceId?: number): Promise<SpendingAnalysisResponse> {
  // REMOVE mock:
  // return mockApiCall(mockAnalysisResponse, 800);
  
  // RESTORE real API:
  const params = spaceId ? { spaceId } : {};
  const { data } = await api.get<SpendingAnalysisResponse>('/alerts/analysis', { params });
  return data;
}
```

---

## ✅ Full Test Checklist

Before marking as complete:

- [ ] All 7 alerts display correctly
- [ ] Summary cards show correct counts
- [ ] Filters work (severity + type)
- [ ] Alert cards are clickable
- [ ] Modal opens with full details
- [ ] Modal recommendations display
- [ ] "Xem chi tiết" button navigates
- [ ] "Đóng" button closes modal
- [ ] AlertWidget shows top 3 alerts
- [ ] AlertBadge shows count
- [ ] Responsive on mobile/tablet/desktop
- [ ] Loading skeleton displays
- [ ] Empty state displays when no alerts
- [ ] Refresh button works (with spinner)
- [ ] No console errors
- [ ] All TypeScript types are correct

---

## 🎯 Next Steps After Testing

1. ✅ Frontend components tested and working
2. ⏳ Wait for Backend API implementation
3. ⏳ Replace mock data with real API calls
4. ⏳ Integration testing with real data
5. ⏳ Add unit tests (Jest/Vitest)
6. ⏳ Add E2E tests (Playwright/Cypress)

---

**Happy Testing!** 🎉

If you encounter any issues, check the mock data structure and component props carefully.
