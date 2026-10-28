# 💰 BTON - Budgivee

**Modern Personal Finance Management System**

Hệ thống quản lý tài chính cá nhân và gia đình thông minh, giúp bạn theo dõi thu chi, lập ngân sách, và đạt được các mục tiêu tiết kiệm.

![BTON Dashboard](https://img.shields.io/badge/Status-Active-success)
![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)

---

## ✨ Features

### 👥 Người dùng (User)
- 📊 **Dashboard trực quan** - Theo dõi tổng quan tài chính với biểu đồ
- 💰 **Quản lý giao dịch** - Ghi chép thu chi, phân loại theo danh mục
- 📅 **Ngân sách hàng tháng** - Đặt mục tiêu chi tiêu, nhận cảnh báo vượt ngân sách
- 🎯 **Mục tiêu tiết kiệm** - Theo dõi tiến độ đạt mục tiêu tài chính
- 📈 **Báo cáo phân tích** - Biểu đồ và thống kê chi tiết theo thời gian
- 👨‍👩‍👧‍👦 **Không gian gia đình** - Quản lý tài chính chung với gia đình
- 🏷️ **Danh mục tùy chỉnh** - Tạo danh mục riêng ngoài danh mục hệ thống

### 👨‍💼 Quản trị viên (Admin)
- 📊 **Admin Dashboard** - Thống kê tổng quan hệ thống
- 👥 **Quản lý người dùng** - Xem, kích hoạt/vô hiệu hóa tài khoản
- 🏷️ **Quản lý danh mục** - CRUD danh mục hệ thống
- 📝 **Audit Logs** - Theo dõi lịch sử thao tác của admin

---

## 🛠️ Tech Stack

### Backend
- **Java 17**
- **Spring Boot 3.x**
- **Spring Security** (JWT Authentication)
- **Spring Data JPA** (Hibernate)
- **MySQL 8.0**
- **Flyway** (Database Migration)
- **Swagger/OpenAPI** (API Documentation)
- **Lombok**
- **Maven/Gradle**

### Frontend
- **React 18**
- **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS** (Styling)
- **Zustand** (State management)
- **React Router** (Routing)
- **Axios** (HTTP client)
- **Recharts** (Data visualization)
- **Lucide React** (Icons)
- **React Hot Toast** (Notifications)

---

## 🚀 Quick Start

### 📋 Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Gradle 8+ (đã kèm `gradlew`, không cần cài thêm)

### ⚡ Khởi động trong 3 bước

**1. Tạo Database:**
```sql
CREATE DATABASE bton_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**2. Chạy Backend:**
```bash
./gradlew bootRun
```

**3. Chạy Frontend:**
```bash
cd frontend
npm install && npm run dev
```

### 🔑 Tài khoản demo

Có thể đăng nhập bằng **username** hoặc **email**.

**Admin:**
```
Username: admin
Email:    admin@bton.app
Password: Admin@1234
Role:     ADMIN
```

**User demo trên bản cài mới (Flyway seed):**
```
Username: nguyen.van.a    | Password: User@1234 | Nguyễn Văn A
Username: tran.thi.b      | Password: User@1234 | Trần Thị B
Username: le.van.c        | Password: User@1234 | Lê Văn C
```

**User của DB cũ (được tạo từ `database/init.sql`):**
```
Username: huunhat         | Password: Password123!
Username: hoangphuc       | Password: Password123!
Username: thephong        | Password: Password123!
Username: manhthang       | Password: Password123!
```

> Lưu ý: nhóm user thứ hai chỉ tồn tại trong database đang chạy của bạn.
> Nếu chạy `scripts/reset-db.ps1`, DB sẽ được tạo lại bằng Flyway và chỉ còn
> `admin` + 3 user `nguyen.van.a` / `tran.thi.b` / `le.van.c`.

👉 **Chi tiết:** Xem file [QUICK_START.md](QUICK_START.md) và [ACCOUNTS.md](ACCOUNTS.md)

---

## 🗄️ Database & Migrations

**Flyway là nguồn duy nhất** tạo schema và seed dữ liệu — không dùng
`database/init.sql` để seed nữa (file này chỉ còn để tham khảo). Trước đây
việc mount `init.sql` vào MySQL cùng lúc với Flyway đã gây ra dữ liệu demo
trùng/lệch (sai tên không gian, sai chủ sở hữu).

**Quy tắc làm việc:**

- Migration tự chạy khi backend khởi động: `src/main/resources/db/migration`.
- **Không sửa** file migration đã áp dụng (Flyway kiểm tra checksum).
- Thay đổi schema/dữ liệu mới → thêm file mới `V12__mo_ta_ngan.sql`, `V13__...`.
- Hibernate chạy `ddl-auto: validate` — schema do Flyway quản lý, không tự sửa.
- Không commit mật khẩu thật; truyền qua biến môi trường.

**Reset database local (xoá sạch rồi để Flyway tạo lại):**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/reset-db.ps1
# hoặc bỏ xác nhận:
powershell -ExecutionPolicy Bypass -File scripts/reset-db.ps1 -Force
```

Sau đó khởi động backend:

```bash
./gradlew bootRun
```

Flyway sẽ tự áp dụng `V1 → V11` và seed dữ liệu demo.

---

## 📁 Project Structure

```
BTON/
├── src/main/java/com/example/bton/    # Backend Source Code
│   ├── config/                         # Configuration (Security, Swagger, etc.)
│   ├── controller/                     # REST Controllers
│   ├── dto/                            # Data Transfer Objects
│   │   ├── request/                    # Request DTOs
│   │   └── response/                   # Response DTOs
│   ├── entity/                         # JPA Entities
│   ├── enums/                          # Enums
│   ├── exception/                      # Custom Exceptions
│   ├── repository/                     # JPA Repositories
│   ├── security/                       # Security (JWT, UserDetails)
│   ├── service/                        # Business Logic
│   │   └── impl/                       # Service Implementations
│   └── BtonApplication.java           # Main Application
│
├── src/main/resources/
│   ├── db/migration/                   # Flyway Migrations (single source of truth)
│   │   ├── V1__init_schema.sql        # Database Schema
│   │   ├── V2__seed_categories.sql    # System Categories
│   │   ├── V3__seed_demo_data.sql     # Demo Data
│   │   ├── V4..V8                    # Schema refinements
│   │   ├── V9__seed_admin_demo_data.sql
│   │   ├── V10__fix_demo_user_spaces.sql
│   │   └── V11__restore_system_categories.sql
│   └── application.yml                 # Application Config
│
├── frontend/                           # Frontend React App
│   ├── src/
│   │   ├── components/                # Reusable Components
│   │   ├── layouts/                   # Layout Components
│   │   │   ├── AuthLayout.tsx         # Login/Register Layout
│   │   │   └── DashboardLayout.tsx    # Main Dashboard Layout
│   │   ├── pages/                     # Page Components
│   │   │   ├── auth/                  # Auth Pages
│   │   │   ├── user/                  # User Pages
│   │   │   └── admin/                 # Admin Pages
│   │   ├── store/                     # Zustand State Management
│   │   ├── types/                     # TypeScript Types
│   │   ├── lib/                       # Utils & Axios Config
│   │   ├── App.tsx                    # Root Component
│   │   └── main.tsx                   # Entry Point
│   ├── public/                        # Static Assets
│   └── package.json
│
├── QUICK_START.md                     # Quick Start Guide
├── ACCOUNTS.md                        # Demo Accounts Info
├── SETUP.md                           # Detailed Setup Guide
└── README.md                          # This File
```

---

## 📊 Database Schema

### Core Tables
- `users` - User accounts
- `financial_spaces` - Personal/Family financial spaces
- `family_members` - Family space members
- `categories` - Transaction categories
- `transactions` - Income/Expense transactions
- `budgets` - Monthly budgets
- `savings_goals` - Savings goals
- `notifications` - User notifications
- `audit_logs` - Admin activity logs

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/register         # Register new user
POST   /api/v1/auth/login            # Login
GET    /api/v1/auth/me               # Get current user
PUT    /api/v1/auth/change-password  # Change password
```

### Users
```
GET    /api/v1/users/profile         # Get profile
PUT    /api/v1/users/profile         # Update profile
```

### Financial Spaces
```
GET    /api/v1/spaces                # List spaces
POST   /api/v1/spaces                # Create space
GET    /api/v1/spaces/{id}           # Get space details
PUT    /api/v1/spaces/{id}           # Update space
DELETE /api/v1/spaces/{id}           # Delete space
GET    /api/v1/spaces/{id}/members   # List members
POST   /api/v1/spaces/{id}/members   # Add member
```

### Transactions
```
GET    /api/v1/transactions          # List transactions (with filters)
POST   /api/v1/transactions          # Create transaction
GET    /api/v1/transactions/{id}     # Get transaction
PUT    /api/v1/transactions/{id}     # Update transaction
DELETE /api/v1/transactions/{id}     # Delete transaction
```

### Budgets
```
GET    /api/v1/budgets               # List budgets
POST   /api/v1/budgets               # Create budget
PUT    /api/v1/budgets/{id}          # Update budget
DELETE /api/v1/budgets/{id}          # Delete budget
```

### Savings Goals
```
GET    /api/v1/savings-goals         # List goals
POST   /api/v1/savings-goals         # Create goal
GET    /api/v1/savings-goals/{id}    # Get goal
PUT    /api/v1/savings-goals/{id}    # Update goal
DELETE /api/v1/savings-goals/{id}    # Delete goal
PATCH  /api/v1/savings-goals/{id}/amount  # Update saved amount
```

### Reports
```
GET    /api/v1/reports/dashboard     # Dashboard data
GET    /api/v1/reports               # Financial reports
```

### Admin
```
GET    /api/v1/admin/dashboard       # Admin dashboard
GET    /api/v1/admin/users           # List users
GET    /api/v1/admin/users/{id}      # Get user
PATCH  /api/v1/admin/users/{id}/toggle-status  # Toggle user status
GET    /api/v1/admin/categories      # List categories
POST   /api/v1/admin/categories      # Create category
PUT    /api/v1/admin/categories/{id} # Update category
PATCH  /api/v1/admin/categories/{id}/toggle  # Toggle category
GET    /api/v1/admin/audit-logs      # Audit logs
```

**API Documentation:** `http://localhost:8080/swagger-ui.html`

---

## 🎨 UI/UX Design

### Design Highlights
- ✨ Modern card-based interface
- 🎨 Gradient credit card displays
- 📊 Interactive charts (Area, Bar, Pie)
- 📱 Fully responsive (Mobile, Tablet, Desktop)
- 🌙 Dark mode ready components
- 🎯 Progress indicators for budgets
- 🔔 Real-time notifications
- 🚀 Fast and smooth animations

### Color Palette
- **Primary:** `#5B4FFF` - Tím chủ đạo
- **Success:** `#2DD4BF` - Xanh ngọc (Thu nhập, Hoàn thành)
- **Danger:** `#EF4444` - Đỏ (Chi tiêu, Cảnh báo)
- **Warning:** `#F59E0B` - Vàng (Cảnh báo)

---

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Hướng dẫn khởi động nhanh
- **[ACCOUNTS.md](ACCOUNTS.md)** - Thông tin tài khoản demo và dữ liệu mẫu
- **[SETUP.md](SETUP.md)** - Hướng dẫn cài đặt chi tiết
- **[frontend/README.md](frontend/README.md)** - Tài liệu Frontend
- **Swagger UI** - API Documentation tại `http://localhost:8080/swagger-ui.html`

---

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
./gradlew test

# Run tests + coverage report (build/reports/jacoco/test/html/index.html)
./gradlew test jacocoTestReport

# Skip tests during build
./gradlew clean build -x test
```

### Frontend Tests
```bash
cd frontend
npm run lint      # ESLint, 0 warning allowed
npx tsc --noEmit  # TypeScript type check
npm run build     # Production build
```

---

## 🚀 Deployment

### Backend (Spring Boot)
```bash
# Build JAR
./gradlew clean build

# Run JAR
java -jar build/libs/BTON-1.0.0.jar

# Or deploy to:
# - Heroku
# - AWS Elastic Beanstalk
# - Google Cloud Run
# - Docker Container
```

### Frontend (React)
```bash
cd frontend

# Build production
npm run build

# Output in: frontend/dist/

# Deploy to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - Firebase Hosting
```

---

## 🔒 Security Features

- ✅ JWT Authentication
- ✅ BCrypt password hashing
- ✅ Role-based access control (USER, ADMIN)
- ✅ CORS configuration
- ✅ SQL injection prevention (Parameterized queries)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Secure HTTP headers

---

## 📊 Demo Data Included

Khi chạy ứng dụng lần đầu, hệ thống tự động tạo:

- ✅ **2 tài khoản**: 1 Admin + 1 User
- ✅ **20+ danh mục** hệ thống (thu nhập/chi tiêu)
- ✅ **18 giao dịch** demo (3 tháng gần nhất)
- ✅ **6 ngân sách** tháng hiện tại
- ✅ **3 mục tiêu** tiết kiệm
- ✅ **2 không gian** tài chính
- ✅ **3 thông báo** mẫu

---

## 🛣️ Roadmap

### Phase 1 (✅ Completed)
- ✅ Authentication & Authorization
- ✅ User & Admin Dashboard
- ✅ Transaction Management
- ✅ Budget Tracking
- ✅ Savings Goals
- ✅ Reports & Analytics

### Phase 2 (🔜 Planned)
- 🔜 Recurring transactions
- 🔜 Multi-currency support
- 🔜 Export to Excel/PDF
- 🔜 Email notifications
- 🔜 Budget templates
- 🔜 Bill reminders

### Phase 3 (💡 Ideas)
- 💡 Mobile app (React Native)
- 💡 AI spending insights
- 💡 Bank integration
- 💡 Investment tracking
- 💡 Tax calculator
- 💡 Debt management

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Development Team** - Initial work

---

## 🙏 Acknowledgments

- Spring Boot Team
- React Team
- All open-source contributors

---

## 📞 Support

Nếu bạn gặp vấn đề hoặc có câu hỏi:

1. Check [QUICK_START.md](QUICK_START.md) for common issues
2. Check [SETUP.md](SETUP.md) for detailed setup
3. Open an issue on GitHub
4. Contact support team

---

## 📸 Screenshots

### User Dashboard
![Dashboard Preview](https://via.placeholder.com/800x400?text=Dashboard+Preview)

### Transactions Management
![Transactions Preview](https://via.placeholder.com/800x400?text=Transactions+Preview)

### Budget Tracking
![Budget Preview](https://via.placeholder.com/800x400?text=Budget+Preview)

### Admin Panel
![Admin Preview](https://via.placeholder.com/800x400?text=Admin+Panel+Preview)

---

**Made with ❤️ by BTON Team**

⭐ **Star this repo if you find it helpful!**
Trong DB hiện tại chỉ có 5 tài khoản, không còn tài khoản nào khác:

     ┌─────────┬─────────────────┬────────────────────┬────────────┬─────────────────────────────┐  
     │#        │Username         │Password            │Role        │Có dữ liệu?                  │  
     ├─────────┼─────────────────┼────────────────────┼────────────┼─────────────────────────────┤  
     │1        │admin            │Admin@1234          │ADMIN       │Không (không có space)       │  
     ├─────────┼─────────────────┼────────────────────┼────────────┼─────────────────────────────┤  
     │2        │huunhat          │Password123!        │USER        │Có đầy đủ                    │  
     ├─────────┼─────────────────┼────────────────────┼────────────┼─────────────────────────────┤  
     │3        │hoangphuc        │Password123!        │USER        │Chỉ 2 ví                     │  
     ├─────────┼─────────────────┼────────────────────┼────────────┼─────────────────────────────┤  
     │4        │thephong         │Password123!        │USER        │Chỉ 2 ví                     │  
     ├─────────┼─────────────────┼────────────────────┼────────────┼─────────────────────────────┤  
     │5        │manhthang        │Password123!        │USER        │Chỉ 2 ví                     │  
     └─────────┴─────────────────┴────────────────────┴────────────┴─────────────────────────────┘
cd vào OJT CHẠY
.\gradlew.bat bootRun