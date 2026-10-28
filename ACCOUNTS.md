# 🔐 Tài Khoản Demo - BTON Budgivee

## 📋 Thông tin tài khoản mẫu

### 👨‍💼 Tài khoản ADMIN

```
Username: admin
Email:    admin@bton.app
Password: Admin@1234
Role:     ADMIN
```

**Quyền truy cập:**
- ✅ Admin Dashboard với thống kê hệ thống
- ✅ Quản lý tất cả người dùng (xem, kích hoạt/vô hiệu hóa)
- ✅ Quản lý danh mục hệ thống (thêm/sửa/xóa/toggle)
- ✅ Xem Audit Logs (lịch sử thao tác admin)
- ✅ Truy cập tất cả chức năng của user

---

### 👤 Tài khoản USER (Khách hàng)

```
Username: nguyen.van.a
Email:    nguyenvana@example.com
Password: User@1234
Role:     USER
Họ tên:   Nguyễn Văn A
SĐT:      0901234567
```

**Quyền truy cập:**
- ✅ Dashboard cá nhân với biểu đồ thu chi
- ✅ Quản lý giao dịch thu/chi
- ✅ Quản lý ngân sách theo tháng
- ✅ Theo dõi mục tiêu tiết kiệm
- ✅ Xem báo cáo tài chính
- ✅ Quản lý không gian tài chính (cá nhân/gia đình)
- ✅ Thêm thành viên gia đình
- ✅ Tạo danh mục tùy chỉnh

---

## 📊 Dữ liệu Demo cho User `nguyen.van.a`

### Không gian tài chính:
1. **Tài chính cá nhân** (PERSONAL)
2. **Tài chính gia đình** (FAMILY) - có thêm thành viên Trần Thị B

### Giao dịch có sẵn:
- **Thu nhập tháng 10/2026**: 18,000,000 VNĐ
  - Lương: 15,000,000 VNĐ
  - Freelance: 3,000,000 VNĐ

- **Chi tiêu tháng 10/2026**: 8,550,000 VNĐ
  - Thuê nhà: 3,000,000 VNĐ
  - Ăn uống: 2,500,000 VNĐ
  - Mua sắm: 1,200,000 VNĐ
  - Xăng xe: 800,000 VNĐ
  - Y tế: 500,000 VNĐ
  - Điện nước: 400,000 VNĐ
  - Điện thoại: 150,000 VNĐ

### Ngân sách tháng 10/2026:
- Ăn uống: 3,000,000 VNĐ (đã dùng 83%)
- Thuê nhà: 3,500,000 VNĐ (đã dùng 86%)
- Mua sắm: 1,500,000 VNĐ (đã dùng 80%)
- Xăng xe: 1,000,000 VNĐ (đã dùng 80%)
- Giải trí: 800,000 VNĐ
- Điện nước: 500,000 VNĐ (đã dùng 80%)

### Mục tiêu tiết kiệm:
1. **Mua laptop mới** (MacBook Pro M3)
   - Mục tiêu: 35,000,000 VNĐ
   - Đã tiết kiệm: 12,000,000 VNĐ (34%)
   - Hạn: 31/12/2026
   - Trạng thái: Đang thực hiện

2. **Quỹ du lịch hè** (Đà Nẵng - Hội An)
   - Mục tiêu: 10,000,000 VNĐ
   - Đã tiết kiệm: 6,500,000 VNĐ (65%)
   - Hạn: 31/07/2026
   - Trạng thái: Đã hoàn thành ✅

3. **Quỹ khẩn cấp** (Dự phòng 3 tháng lương)
   - Mục tiêu: 45,000,000 VNĐ
   - Đã tiết kiệm: 15,000,000 VNĐ (33%)
   - Hạn: 01/06/2027
   - Trạng thái: Đang thực hiện

### Thông báo:
- ⚠️ Cảnh báo: Ngân sách Ăn uống tháng 10 đã sử dụng 83%
- 🎉 Chúc mừng! Đã hoàn thành mục tiêu "Quỹ du lịch hè"
- 📢 Chào mừng bạn đến với BTON!

---

## 🚀 Cách sử dụng

### 1. Khởi động Backend
```bash
# Đảm bảo MySQL đang chạy
# Database: bton_db sẽ tự động được tạo

# Chạy Spring Boot
./gradlew bootRun
```

### 2. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Đăng nhập

Truy cập: `http://localhost:3000`

**Đăng nhập Admin:**
- Username: `admin`
- Password: `Admin@1234`

**Đăng nhập User:**
- Username: `nguyen.van.a`
- Password: `User@1234`

---

## 📚 Danh mục hệ thống có sẵn

### Thu nhập (INCOME):
- 💰 Lương (Salary)
- 💼 Freelance
- 📈 Đầu tư (Investment)
- 🎁 Quà tặng (Gift)
- 💵 Khác (Other Income)

### Chi tiêu (EXPENSE):
- 🍔 Ăn uống (Food & Dining)
- 🚗 Di chuyển (Transportation)
- 🏠 Nhà ở (Housing)
- 🏥 Y tế (Healthcare)
- 📚 Giáo dục (Education)
- 🛍️ Mua sắm (Shopping)
- 🎮 Giải trí (Entertainment)
- 💡 Tiện ích (Utilities)
- 📱 Liên lạc (Communication)
- 💰 Tiết kiệm (Savings)
- 👨‍👩‍👧‍👦 Gia đình (Family)
- 👔 Công việc (Work)
- 🎁 Quà tặng (Gift)
- 💸 Khác (Other Expense)

---

## 🔧 Tài khoản bổ sung

Nếu muốn thêm tài khoản mới:

```bash
# Sử dụng API đăng ký
POST http://localhost:8080/api/v1/auth/register
Content-Type: application/json

{
  "username": "your_username",
  "email": "your_email@example.com",
  "password": "Your@Password123",
  "fullName": "Your Full Name"
}
```

---

## 🔐 Mã hóa mật khẩu

Dự án sử dụng BCrypt để mã hóa mật khẩu với độ phức tạp 10 rounds.

Nếu cần tạo mật khẩu mới:
```java
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String hashedPassword = encoder.encode("YourPassword");
```

Hoặc sử dụng online tool: https://bcrypt-generator.com/
- Rounds: 10

---

## 📝 Ghi chú

- Tất cả mật khẩu trong demo đều dễ nhớ cho mục đích testing
- Trong production, nên sử dụng mật khẩu mạnh hơn
- Dữ liệu demo được tạo tự động khi chạy Flyway migration
- Database sẽ được reset mỗi khi chạy lại migration

---

## 🆘 Troubleshooting

### Lỗi: Table already exists
```bash
# Xóa database và tạo lại
DROP DATABASE bton_db;
CREATE DATABASE bton_db;

# Hoặc set ddl-auto=create trong application.yml (chỉ dùng cho dev)
```

### Lỗi: Authentication failed
- Kiểm tra username/password
- Kiểm tra database có dữ liệu chưa
- Xem log backend để debug

### Không thấy dữ liệu demo
- Kiểm tra Flyway migration đã chạy chưa
- Xem log: `SELECT * FROM flyway_schema_history;`
- Chạy lại migration nếu cần

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Backend logs tại console
2. Frontend console (F12)
3. Database connection
4. Port conflicts (8080, 3000)

Happy coding! 🚀
