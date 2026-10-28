# 🚀 Quick Start - BTON Budgivee

## ⚡ Khởi động nhanh trong 3 bước

### Bước 1️⃣: Cấu hình Database

```sql
-- Kết nối MySQL và chạy:
CREATE DATABASE bton_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Lưu ý:** Username/password MySQL của bạn phải khớp với `application.yml`:
- Username: `root`
- Password: `Phuchb24@`

Hoặc sửa file `src/main/resources/application.yml` cho phù hợp.

### Bước 2️⃣: Chạy Backend

```bash
# Từ thư mục gốc dự án BTON
./gradlew bootRun
```

✅ Backend chạy tại: `http://localhost:8080`  
✅ Swagger UI: `http://localhost:8080/swagger-ui.html`  
✅ Flyway tự động tạo tables và seed data

### Bước 3️⃣: Chạy Frontend

```bash
# Mở terminal mới
cd frontend
npm install
npm run dev
```

✅ Frontend chạy tại: `http://localhost:3000`

---

## 🔑 Đăng nhập ngay

### 👨‍💼 Admin:
```
Username: admin
Password: Admin@1234
```

### 👤 User:
```
Username: nguyen.van.a
Password: User@1234
```

---

## 📊 Xem ngay dữ liệu có sẵn

Đăng nhập bằng tài khoản **nguyen.van.a** để xem:

✅ **Dashboard** với biểu đồ thu chi  
✅ **18 giao dịch** từ tháng 8-10/2026  
✅ **6 ngân sách** đã được thiết lập  
✅ **3 mục tiêu tiết kiệm** (1 đã hoàn thành!)  
✅ **2 không gian tài chính** (cá nhân + gia đình)  
✅ **20+ danh mục** hệ thống tiếng Việt  

---

## 🎯 Test các chức năng chính

### User Features:
1. 📊 **Dashboard/Overview** - Xem tổng quan tài chính
2. 💰 **Transactions** - Thêm/sửa/xóa giao dịch
3. 📅 **Budget** - Theo dõi ngân sách tháng
4. 🎯 **Goals** - Quản lý mục tiêu tiết kiệm
5. 📈 **Reports** - Xem báo cáo chi tiết
6. ⚙️ **Settings** - Cập nhật profile

### Admin Features:
1. 📊 **Admin Dashboard** - Thống kê hệ thống
2. 👥 **Users** - Quản lý người dùng
3. 🏷️ **Categories** - Quản lý danh mục
4. 📝 **Audit Logs** - Lịch sử thao tác

---

## 🔧 Các lệnh hữu ích

### Backend:
```bash
# Build
./gradlew clean build

# Run tests
./gradlew test

# Skip tests
./gradlew clean build -x test
```

### Frontend:
```bash
# Dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

### Database:
```sql
-- Reset database (nếu cần)
DROP DATABASE bton_db;
CREATE DATABASE bton_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Kiểm tra migrations đã chạy
USE bton_db;
SELECT * FROM flyway_schema_history ORDER BY installed_rank;

-- Xem user có sẵn
SELECT id, username, email, full_name, role, is_active FROM users;

-- Kiểm tra transactions
SELECT COUNT(*) as total, type, SUM(amount) as sum_amount 
FROM transactions 
GROUP BY type;
```

---

## 📱 API Testing với Swagger

Truy cập: `http://localhost:8080/swagger-ui.html`

**Test flow:**
1. Dùng endpoint `/api/v1/auth/login` để lấy JWT token
2. Click **Authorize** (nút khóa) ở góc phải trên
3. Nhập: `Bearer <your-token>`
4. Test các API khác

---

## 🎨 Giao diện

Frontend được thiết kế dựa trên hình ảnh bạn cung cấp:

✅ Modern card-based UI  
✅ Gradient credit cards  
✅ Area charts cho spending  
✅ Progress bars cho budgets  
✅ Responsive design  
✅ Dark mode ready components  

**Màu chủ đạo:**
- Primary: `#5B4FFF` (Tím)
- Success: `#2DD4BF` (Xanh ngọc)
- Danger: `#EF4444` (Đỏ)
- Warning: `#F59E0B` (Vàng)

---

## 🐛 Troubleshooting

### Port already in use:
```bash
# Đổi port backend trong application.yml
server.port: 8081

# Đổi port frontend trong vite.config.ts
server: { port: 3001 }
```

### Cannot connect to database:
- Kiểm tra MySQL đang chạy: `mysql -u root -p`
- Kiểm tra database tồn tại: `SHOW DATABASES;`
- Kiểm tra user/pass trong `application.yml`

### No data in frontend:
- Mở Console (F12) xem API calls
- Kiểm tra token đã lưu: `localStorage.getItem('auth-storage')`
- Clear localStorage và đăng nhập lại

### Flyway migration errors:
```sql
-- Xóa flyway history và reset
DELETE FROM flyway_schema_history WHERE version > '1';

-- Hoặc drop tất cả và chạy lại
DROP DATABASE bton_db;
CREATE DATABASE bton_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 📚 Tài liệu chi tiết

- `ACCOUNTS.md` - Thông tin tài khoản và dữ liệu demo
- `SETUP.md` - Hướng dẫn setup chi tiết
- `frontend/README.md` - Tài liệu frontend
- Swagger API Docs - `http://localhost:8080/swagger-ui.html`

---

## ✨ Features Highlights

### Đã triển khai:
✅ Authentication & Authorization (JWT)  
✅ User & Admin roles  
✅ Financial Spaces (Personal/Family)  
✅ Transactions with categories  
✅ Monthly budgets with alerts  
✅ Savings goals tracking  
✅ Dashboard with charts  
✅ Financial reports  
✅ Audit logging  
✅ Notifications  
✅ Responsive UI  

### Có thể mở rộng:
🔜 Recurring transactions  
🔜 Multi-currency support  
🔜 Export to Excel/PDF  
🔜 Email notifications  
🔜 Mobile app  
🔜 Budget templates  
🔜 AI spending insights  

---

## 🎯 Next Steps

1. ✅ Đăng nhập và khám phá UI
2. ✅ Thêm giao dịch mới
3. ✅ Tạo mục tiêu tiết kiệm
4. ✅ Xem báo cáo tài chính
5. 🔧 Customize theo nhu cầu
6. 🚀 Deploy lên production

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra logs backend (console)
2. Kiểm tra console frontend (F12)
3. Xem lại `SETUP.md` và `ACCOUNTS.md`
4. Debug với Swagger UI

Happy coding! 🎉
