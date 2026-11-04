# 🚨 Alert Components - Hướng dẫn sử dụng

## 📦 Các Component đã tạo

### 1. **AlertCard** - Card hiển thị cảnh báo
```tsx
import AlertCard from '@/components/AlertCard';

<AlertCard 
  alert={alert} 
  onClick={() => handleAlertClick(alert)} 
/>
```

**Props:**
- `alert`: SpendingAlert - Đối tượng cảnh báo
- `onClick?`: () => void - Hàm xử lý khi click

---

### 2. **AlertModal** - Modal chi tiết cảnh báo
```tsx
import AlertModal from '@/components/AlertModal';

<AlertModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  alert={selectedAlert}
/>
```

**Props:**
- `isOpen`: boolean - Trạng thái hiển thị modal
- `onClose`: () => void - Hàm đóng modal
- `alert`: SpendingAlert | null - Cảnh báo cần hiển thị

---

### 3. **AlertWidget** - Widget nhỏ cho Dashboard
```tsx
import AlertWidget from '@/components/AlertWidget';

<AlertWidget 
  spaceId={currentSpace?.id} 
  maxAlerts={3} 
/>
```

**Props:**
- `spaceId?`: number - ID không gian tài chính
- `maxAlerts?`: number - Số lượng cảnh báo hiển thị (default: 3)

---

### 4. **AlertBadge** - Badge số lượng cảnh báo
```tsx
import AlertBadge from '@/components/AlertBadge';

<AlertBadge spaceId={currentSpace?.id} />
```

**Props:**
- `spaceId?`: number - ID không gian tài chính

---

## 📄 Trang SpendingAlerts

Trang đầy đủ hiển thị tất cả cảnh báo với filter và group theo mức độ.

**Route:** `/alerts`

**File:** `src/pages/user/SpendingAlerts.tsx`

---

## 🔧 Services

### alertService

```tsx
import { alertService } from '@/lib/alertService';

// Lấy phân tích chi tiêu
const analysis = await alertService.getSpendingAnalysis(spaceId);

// Trigger kiểm tra thủ công
await alertService.triggerManualCheck(spaceId);

// Lấy cảnh báo theo tháng
const alerts = await alertService.getAlertsByMonth(spaceId, month, year);
```

---

## 📊 Types

```typescript
// Alert Types
type AlertType = 
  | 'BUDGET_EXCEEDED'           // Vượt ngân sách
  | 'BUDGET_WARNING'            // Cảnh báo ngân sách
  | 'SPENDING_SPIKE'            // Chi tăng đột biến
  | 'RAPID_SPENDING'            // Chi quá nhanh
  | 'RECURRING_PAYMENT_DUE'     // Thanh toán định kỳ
  | 'BUDGET_PACE_WARNING';      // Tốc độ chi tiêu

// Severity Levels
type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Alert Object
interface SpendingAlert {
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  amount?: number;
  threshold?: number;
  categoryName?: string;
  categoryId?: number;
  detectedAt: string;
  metadata?: {
    currentAmount?: number;
    previousAmount?: number;
    increasePercent?: number;
    daysRemaining?: number;
    estimatedRunOutDay?: number;
    // ... more fields
  };
}
```

---

## 🎨 Styling Guide

### Severity Colors

```css
CRITICAL: red-500/red-600   /* bg-red-50, text-red-600, border-red-500 */
HIGH:     orange-500/600    /* bg-orange-50, text-orange-600, border-orange-500 */
MEDIUM:   yellow-500/600    /* bg-yellow-50, text-yellow-600, border-yellow-500 */
LOW:      blue-500/600      /* bg-blue-50, text-blue-600, border-blue-500 */
```

### Icons

```tsx
BUDGET_EXCEEDED: <AlertTriangle />
SPENDING_SPIKE: <TrendingUp />
RAPID_SPENDING: <Zap />
RECURRING_PAYMENT_DUE: <Clock />
```

---

## 🚀 Cách tích hợp vào Dashboard

### Option 1: Widget nhỏ (Recommended)

```tsx
// src/pages/user/Overview.tsx
import AlertWidget from '@/components/AlertWidget';

// Trong component
<AlertWidget spaceId={currentSpace?.id} maxAlerts={3} />
```

### Option 2: Badge notification

```tsx
import AlertBadge from '@/components/AlertBadge';

<AlertBadge spaceId={currentSpace?.id} />
```

### Option 3: Inline alerts trong dashboard cards

```tsx
import { alertService } from '@/lib/alertService';
import AlertCard from '@/components/AlertCard';

const [alerts, setAlerts] = useState<SpendingAlert[]>([]);

useEffect(() => {
  const loadAlerts = async () => {
    const data = await alertService.getSpendingAnalysis(spaceId);
    setAlerts(data.alerts.slice(0, 2)); // Top 2 alerts
  };
  loadAlerts();
}, [spaceId]);

// Render
<div className="space-y-2">
  {alerts.map(alert => (
    <AlertCard key={...} alert={alert} onClick={...} />
  ))}
</div>
```

---

## 📱 Responsive Design

Tất cả components đã được thiết kế responsive:
- Mobile: Stack layout, full width
- Tablet: 2 columns grid
- Desktop: 3-4 columns grid

---

## 🔔 Real-time Updates

Để có real-time updates, thêm polling hoặc WebSocket:

```tsx
useEffect(() => {
  const interval = setInterval(async () => {
    const data = await alertService.getSpendingAnalysis(spaceId);
    setAlerts(data.alerts);
  }, 60000); // Refresh mỗi 60s

  return () => clearInterval(interval);
}, [spaceId]);
```

---

## 🧪 Testing

```bash
# Run dev server
npm run dev

# Visit pages
http://localhost:5173/alerts
http://localhost:5173/
```

---

## 📞 API Endpoints cần Backend

```
GET  /api/v1/alerts/analysis?spaceId={id}
POST /api/v1/alerts/check-now?spaceId={id}
GET  /api/v1/alerts/analysis?spaceId={id}&month={m}&year={y}
```

**Response Format:**
```json
{
  "alerts": [
    {
      "alertType": "BUDGET_EXCEEDED",
      "severity": "CRITICAL",
      "title": "Vượt ngân sách Ăn uống",
      "message": "Bạn đã chi 5,200,000 VNĐ, vượt 104% ngân sách.",
      "amount": 5200000,
      "threshold": 5000000,
      "categoryName": "Ăn uống",
      "categoryId": 5,
      "detectedAt": "2024-12-15T10:30:00",
      "metadata": {
        "spentPercent": 104,
        "budgetId": 123
      }
    }
  ],
  "analysisDate": "2024-12-15T10:30:00",
  "spaceId": 1,
  "month": 12,
  "year": 2024
}
```

---

## 🎯 Next Steps

1. ✅ Frontend components hoàn tất
2. ⏳ Chờ Backend API implementation
3. ⏳ Integration testing
4. ⏳ Add unit tests cho components

---

**Created by:** Frontend Developer  
**Date:** December 2024  
**Version:** 1.0.0
