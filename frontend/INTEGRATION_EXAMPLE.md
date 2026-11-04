# 🔗 Ví dụ tích hợp Alert Widget vào Overview Dashboard

## 📋 Cách 1: Thêm Alert Widget vào Overview.tsx (Recommended)

### Bước 1: Import component

```tsx
// Thêm vào đầu file src/pages/user/Overview.tsx
import AlertWidget from '../../components/AlertWidget';
import AlertBadge from '../../components/AlertBadge';
```

### Bước 2: Thêm vào layout

```tsx
// Trong return của component Overview, thêm AlertWidget vào grid layout

// Ví dụ: Thêm sau phần Metric Cards
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  {/* Existing metric cards */}
  <MetricCard ... />
  <MetricCard ... />
  <MetricCard ... />
</div>

{/* THÊM MỚI: Alert Widget và Budget Overview */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  {/* Alert Widget - Cột 1 */}
  <div className="lg:col-span-1">
    <AlertWidget 
      spaceId={currentSpace?.id} 
      maxAlerts={3} 
    />
  </div>
  
  {/* Budget Overview or other widgets - Cột 2-3 */}
  <div className="lg:col-span-2">
    {/* Existing budget or goal widgets */}
  </div>
</div>
```

---

## 📋 Cách 2: Thêm Alert Badge phía trên Dashboard

```tsx
// Trong Overview.tsx, thêm AlertBadge ở header

return (
  <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
    {/* Header with Alert Badge */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Tổng quan tài chính
        </h1>
        <p className="text-gray-600 mt-1">
          {formatDate(new Date())}
        </p>
      </div>
      
      {/* Alert Badge */}
      <AlertBadge spaceId={currentSpace?.id} />
    </div>
    
    {/* Rest of the dashboard */}
    ...
  </div>
);
```

---

## 📋 Cách 3: Full Dashboard Layout với Alerts

```tsx
// Complete example for Overview.tsx

import { useState, useEffect } from 'react';
import { useSpaceStore } from '../../store/spaceStore';
import AlertWidget from '../../components/AlertWidget';
import AlertBadge from '../../components/AlertBadge';

export default function Overview() {
  const { currentSpace } = useSpaceStore();
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Tổng quan tài chính
        </h1>
        <AlertBadge spaceId={currentSpace?.id} />
      </div>

      {/* Metric Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard title="Tổng thu nhập" ... />
        <MetricCard title="Tổng chi tiêu" ... />
        <MetricCard title="Số dư" ... />
      </div>

      {/* Alert Widget + Budget Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Alert Widget */}
        <div className="lg:col-span-1">
          <AlertWidget 
            spaceId={currentSpace?.id} 
            maxAlerts={3} 
          />
        </div>
        
        {/* Budget Summary */}
        <div className="lg:col-span-2">
          <BudgetSummaryCard ... />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ExpenseByCategory ... />
        <MonthlyTrend ... />
      </div>

      {/* Recent Transactions */}
      <div className="mb-6">
        <RecentTransactions ... />
      </div>
    </div>
  );
}
```

---

## 🎨 Styling Tips

### Alert Widget trong sidebar (nếu có)

```tsx
<div className="sticky top-6 space-y-6">
  <AlertWidget 
    spaceId={currentSpace?.id} 
    maxAlerts={5} 
  />
  <QuickActions />
</div>
```

### Mobile-first responsive

```tsx
// Widget sẽ tự động full-width trên mobile
// và chiếm 1/3 trên desktop

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Mobile: Stack vertically */}
  {/* Desktop: 1 column (1/3 width) */}
  <AlertWidget spaceId={currentSpace?.id} />
  
  {/* Desktop: 2 columns (2/3 width) */}
  <div className="lg:col-span-2">
    Other content
  </div>
</div>
```

---

## 🚀 Advanced: Conditional Rendering

Chỉ hiển thị widget khi có cảnh báo:

```tsx
import { useState, useEffect } from 'react';
import { alertService } from '../../lib/alertService';
import AlertWidget from '../../components/AlertWidget';

export default function Overview() {
  const { currentSpace } = useSpaceStore();
  const [hasAlerts, setHasAlerts] = useState(false);

  useEffect(() => {
    const checkAlerts = async () => {
      if (!currentSpace?.id) return;
      try {
        const data = await alertService.getSpendingAnalysis(currentSpace.id);
        setHasAlerts(data.alerts.length > 0);
      } catch (error) {
        console.error('Failed to check alerts:', error);
      }
    };
    checkAlerts();
  }, [currentSpace]);

  return (
    <div className="p-6">
      {/* Chỉ hiển thị nếu có cảnh báo */}
      {hasAlerts && (
        <div className="mb-6">
          <AlertWidget spaceId={currentSpace?.id} />
        </div>
      )}
      
      {/* Rest of dashboard */}
      ...
    </div>
  );
}
```

---

## 🎯 Placement Recommendations

### ✅ Best Practice: Top of Dashboard
```
[Header with Badge]
[Alert Widget] [Budget Summary]
[Charts]
[Transactions]
```

### ✅ Alternative: Sidebar
```
[Main Content]  |  [Alert Widget]
[Charts]        |  [Quick Actions]
[Transactions]  |  [Goals]
```

### ❌ Not Recommended
```
[Transactions]
[Charts]
[Alert Widget]  <- Quá thấp, user có thể bỏ lỡ
```

---

## 📱 Mobile Optimization

Alert Widget tự động responsive:

```tsx
// Mobile: Full width, stack layout
// Tablet: 2 columns
// Desktop: 1/3 hoặc 1/4 width

<div className="w-full lg:w-1/3">
  <AlertWidget spaceId={currentSpace?.id} />
</div>
```

---

## 🔔 Toast Notifications

Khi có cảnh báo mới, hiển thị toast:

```tsx
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { alertService } from '../../lib/alertService';

useEffect(() => {
  const checkNewAlerts = async () => {
    const data = await alertService.getSpendingAnalysis(currentSpace?.id);
    const criticalAlerts = data.alerts.filter(a => a.severity === 'CRITICAL');
    
    if (criticalAlerts.length > 0) {
      toast.error(
        `🚨 Bạn có ${criticalAlerts.length} cảnh báo nghiêm trọng!`,
        { duration: 5000 }
      );
    }
  };
  
  checkNewAlerts();
}, [currentSpace]);
```

---

## ✅ Checklist Integration

- [ ] Import AlertWidget và AlertBadge
- [ ] Thêm AlertBadge vào header
- [ ] Thêm AlertWidget vào grid layout
- [ ] Test responsive trên mobile/tablet/desktop
- [ ] Kiểm tra loading states
- [ ] Test với no alerts case
- [ ] Test click navigation đến /alerts page
- [ ] Verify API calls không bị duplicate

---

**Ready to integrate!** 🎉

Choose phương pháp tích hợp phù hợp với design hiện tại của bạn.
