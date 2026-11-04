# ⚡ Quick Start - Alert System

## 🚀 Chạy ngay trong 3 phút!

### Bước 1: Enable Mock Data (30 giây)

Mở file `src/lib/alertService.ts` và uncomment mock data:

```typescript
import { mockAnalysisResponse, mockApiCall } from './mockAlertData';

async getSpendingAnalysis(spaceId?: number): Promise<SpendingAnalysisResponse> {
  // Return mock data for testing
  return mockApiCall(mockAnalysisResponse, 800);
}
```

### Bước 2: Chạy Dev Server (10 giây)

```bash
cd frontend
npm run dev
```

### Bước 3: Test! (2 phút)

1. **Open browser:** http://localhost:5173
2. **Login với account demo**
3. **Navigate:** Click menu "Cảnh báo" ở sidebar
4. **Xem alerts:** Bạn sẽ thấy 7 cảnh báo mẫu!

---

## 📍 Đường dẫn pages

```
http://localhost:5173/alerts  ← Trang đầy đủ tất cả cảnh báo
http://localhost:5173/        ← Dashboard (có thể thêm AlertWidget)
```

---

## 🎨 Components có sẵn

### 1. AlertCard - Card từng cảnh báo
```tsx
<AlertCard alert={alert} onClick={() => {}} />
```

### 2. AlertModal - Modal chi tiết
```tsx
<AlertModal isOpen={true} onClose={() => {}} alert={alert} />
```

### 3. AlertWidget - Widget dashboard
```tsx
<AlertWidget spaceId={1} maxAlerts={3} />
```

### 4. AlertBadge - Badge thông báo
```tsx
<AlertBadge spaceId={1} />
```

---

## 🔧 Tích hợp vào Dashboard (Optional)

Mở `src/pages/user/Overview.tsx`:

```tsx
// Add imports
import AlertWidget from '../../components/AlertWidget';
import AlertBadge from '../../components/AlertBadge';

// Add to component
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  <AlertWidget spaceId={currentSpace?.id} maxAlerts={3} />
  {/* Other widgets */}
</div>
```

---

## ✅ Verification Checklist

Test xem các tính năng này hoạt động:

- [ ] Sidebar có menu "Cảnh báo" với icon tam giác
- [ ] Click menu → Navigate đến `/alerts`
- [ ] Trang alerts hiển thị 7 cảnh báo
- [ ] 4 summary cards hiển thị số lượng theo severity
- [ ] Filters hoạt động (Severity + Type)
- [ ] Click alert card → Modal mở ra
- [ ] Modal hiển thị đầy đủ thông tin
- [ ] Button "Xem chi tiết" navigate đúng
- [ ] Button "Đóng" đóng modal
- [ ] Responsive trên mobile (thu nhỏ browser)
- [ ] Refresh button có spinner animation

---

## 🎯 Expected Results

### Alert Page View:
```
╔══════════════════════════════════════════════════╗
║  🚨 Cảnh báo chi tiêu thông minh     [Làm mới]  ║
╠══════════════════════════════════════════════════╣
║  [1 Nghiêm trọng] [2 Cao] [2 TB] [2 Thấp]       ║
╠══════════════════════════════════════════════════╣
║  🔴 NGHIÊM TRỌNG (1)                             ║
║    ┌──────────────────────────────────────────┐  ║
║    │ ⚠️ Vượt ngân sách Ăn uống              │  ║
║    │ Đã chi 5,200,000 VNĐ...                │  ║
║    └──────────────────────────────────────────┘  ║
║  🟠 CAO (2)                                      ║
║    ┌──────────────────────────────────────────┐  ║
║    │ 📈 Chi tăng đột biến Mua sắm           │  ║
║    └──────────────────────────────────────────┘  ║
║    ┌──────────────────────────────────────────┐  ║
║    │ ⚡ Chi quá nhanh Giải trí              │  ║
║    └──────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════╝
```

### Widget View (Dashboard):
```
╔═══════════════════════════════════════╗
║  🚨 Cảnh báo chi tiêu            [3]  ║
╠═══════════════════════════════════════╣
║ 🔴 Vượt ngân sách Ăn uống            ║
║    5,200,000 VNĐ                      ║
║───────────────────────────────────────║
║ 🟠 Chi tăng đột biến Mua sắm         ║
║    3,500,000 VNĐ                      ║
║───────────────────────────────────────║
║ 🟠 Chi quá nhanh Giải trí            ║
║    2,100,000 VNĐ                      ║
║───────────────────────────────────────║
║        Xem tất cả cảnh báo  →         ║
╚═══════════════════════════════════════╝
```

---

## 🐛 Troubleshooting

### Problem: Alerts page is blank
**Solution:** 
- Check console for errors
- Verify mock data is imported
- Check if currentSpace exists

### Problem: "Cannot find module"
**Solution:**
```bash
# Restart dev server
npm run dev
```

### Problem: Styling looks broken
**Solution:**
- Check Tailwind CSS is configured
- Verify all icon imports from 'lucide-react'
- Check className typos

### Problem: Modal not opening
**Solution:**
- Check Modal component is imported
- Verify onClick handler is attached
- Check z-index conflicts

---

## 📞 Support

Nếu có vấn đề:
1. Check console logs
2. Verify all imports
3. Restart dev server
4. Review ALERT_SYSTEM_SUMMARY.md

---

## 🎉 Done!

Frontend alerts system is ready to use với mock data!

**Next:** Đợi backend API để kết nối thật.

---

**Total Setup Time:** ~3 minutes  
**Files Modified:** 1 (alertService.ts)  
**New Dependencies:** 0 (all existing)  
**Browser Support:** ✅ Chrome, Firefox, Safari, Edge
