# BTON - Budgivee Setup Guide

Hướng dẫn cài đặt và chạy ứng dụng quản lý tài chính Budgivee (BTON).

## Tổng quan

- **Backend**: Spring Boot 3.x + PostgreSQL
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: PostgreSQL 15+

## Yêu cầu hệ thống

### Backend
- Java 17 hoặc cao hơn
- Maven 3.8+
- PostgreSQL 15+

### Frontend
- Node.js 18+ 
- npm hoặc yarn

## Cài đặt Backend

### 1. Cấu hình Database

Tạo database PostgreSQL:

```sql
CREATE DATABASE bton_db;
CREATE USER bton_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bton_db TO bton_user;
```

### 2. Cấu hình application.properties

Cập nhật file `src/main/resources/application.properties`:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/bton_db
spring.datasource.username=bton_user
spring.datasource.password=your_password

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT Configuration
jwt.secret=your-secret-key-here-should-be-at-least-256-bits
jwt.expiration=86400000

# Server Port
server.port=8080

# Swagger
springdoc.api-docs.path=/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

### 3. Chạy Backend

Sử dụng Gradle (khuyến nghị, đã kèm wrapper):

```bash
./gradlew clean build
./gradlew bootRun

# Hoặc build jar và chạy
java -jar build/libs/BTON-1.0.0.jar
```

Nếu dùng Maven (cần cài Maven 3.8+): `mvn spring-boot:run`.

Backend sẽ chạy tại: `http://localhost:8080`

API Documentation: `http://localhost:8080/swagger-ui.html`

### 4. Tạo tài khoản Admin đầu tiên

Sau khi backend chạy, bạn có thể:

**Option 1**: Sử dụng API để đăng ký và cập nhật role thủ công trong database:

```bash
# Đăng ký user thông thường
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@bton.com",
    "password": "admin123",
    "fullName": "Administrator"
  }'

# Sau đó update role trong database:
# UPDATE users SET role = 'ADMIN' WHERE username = 'admin';
```

**Option 2**: Tạo SQL script initialization:

Tạo file `src/main/resources/data.sql`:

```sql
-- Insert admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, role, is_active, created_at, updated_at)
VALUES ('admin', 'admin@bton.com', '$2a$10$... (hash of admin123)', 'Administrator', 'ADMIN', true, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, type, icon, color, is_system, is_active, created_by_id)
VALUES 
('Lương', 'INCOME', '💰', '#2DD4BF', true, true, 1),
('Đầu tư', 'INCOME', '📈', '#10B981', true, true, 1),
('Ăn uống', 'EXPENSE', '🍔', '#F59E0B', true, true, 1),
('Mua sắm', 'EXPENSE', '🛍️', '#EC4899', true, true, 1),
('Di chuyển', 'EXPENSE', '🚗', '#8B5CF6', true, true, 1),
('Y tế', 'EXPENSE', '🏥', '#10B981', true, true, 1);
```

## Cài đặt Frontend

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Cấu hình Environment

Tạo file `.env` trong thư mục `frontend/`:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

### 3. Chạy Development Server

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

### 4. Build cho Production

```bash
npm run build
npm run preview
```

## Cấu trúc dự án

```
BTON/
├── src/main/java/com/example/bton/    # Backend source code
│   ├── config/                         # Security, Swagger configs
│   ├── controller/                     # REST Controllers
│   ├── dto/                            # Request/Response DTOs
│   ├── entity/                         # JPA Entities
│   ├── enums/                          # Enums
│   ├── exception/                      # Custom exceptions
│   ├── repository/                     # JPA Repositories
│   ├── security/                       # JWT, UserDetails
│   ├── service/                        # Business logic
│   └── BtonApplication.java           # Main application
├── frontend/                           # Frontend React app
│   ├── src/
│   │   ├── components/                # Reusable components
│   │   ├── layouts/                   # Layout components
│   │   ├── pages/                     # Page components
│   │   ├── store/                     # Zustand stores
│   │   ├── types/                     # TypeScript types
│   │   └── lib/                       # Utilities
│   └── package.json
└── pom.xml / build.gradle             # Build configuration
```

## Tính năng chính

### Người dùng (USER)

1. **Authentication**
   - Đăng ký, đăng nhập
   - Quản lý profile
   - Đổi mật khẩu

2. **Financial Spaces**
   - Tạo không gian tài chính cá nhân/gia đình
   - Thêm thành viên gia đình
   - Quản lý nhiều không gian

3. **Transactions**
   - Thêm giao dịch thu/chi
   - Phân loại theo danh mục
   - Tìm kiếm và lọc
   - Xuất báo cáo

4. **Budgets**
   - Đặt ngân sách theo tháng
   - Theo dõi chi tiêu theo danh mục
   - Cảnh báo vượt ngân sách

5. **Savings Goals**
   - Đặt mục tiêu tiết kiệm
   - Theo dõi tiến độ
   - Cập nhật số tiền đã tiết kiệm

6. **Dashboard & Reports**
   - Biểu đồ chi tiêu
   - Phân tích theo danh mục
   - Xu hướng thu chi
   - Báo cáo tài chính

### Admin (ADMIN)

1. **Dashboard**
   - Thống kê tổng quan hệ thống
   - Số lượng người dùng
   - Tổng giao dịch

2. **User Management**
   - Xem danh sách người dùng
   - Kích hoạt/vô hiệu hóa tài khoản
   - Tìm kiếm và lọc

3. **Category Management**
   - Quản lý danh mục hệ thống
   - Thêm/sửa/xóa danh mục
   - Bật/tắt danh mục

4. **Audit Logs**
   - Lịch sử thao tác admin
   - Theo dõi các thay đổi

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Đăng ký
- `POST /api/v1/auth/login` - Đăng nhập
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/v1/auth/change-password` - Đổi mật khẩu

### Users
- `GET /api/v1/users/profile` - Lấy profile
- `PUT /api/v1/users/profile` - Cập nhật profile

### Financial Spaces
- `GET /api/v1/spaces` - Danh sách spaces
- `POST /api/v1/spaces` - Tạo space mới
- `GET /api/v1/spaces/{id}` - Chi tiết space
- `PUT /api/v1/spaces/{id}` - Cập nhật space
- `DELETE /api/v1/spaces/{id}` - Xóa space

### Transactions
- `GET /api/v1/transactions` - Danh sách giao dịch
- `POST /api/v1/transactions` - Tạo giao dịch
- `PUT /api/v1/transactions/{id}` - Cập nhật
- `DELETE /api/v1/transactions/{id}` - Xóa

### Budgets
- `GET /api/v1/budgets` - Danh sách ngân sách
- `POST /api/v1/budgets` - Tạo ngân sách
- `PUT /api/v1/budgets/{id}` - Cập nhật
- `DELETE /api/v1/budgets/{id}` - Xóa

### Savings Goals
- `GET /api/v1/savings-goals` - Danh sách mục tiêu
- `POST /api/v1/savings-goals` - Tạo mục tiêu
- `PUT /api/v1/savings-goals/{id}` - Cập nhật
- `DELETE /api/v1/savings-goals/{id}` - Xóa

### Reports
- `GET /api/v1/reports/dashboard` - Dashboard data
- `GET /api/v1/reports` - Báo cáo tài chính

### Admin
- `GET /api/v1/admin/dashboard` - Admin dashboard
- `GET /api/v1/admin/users` - Quản lý users
- `GET /api/v1/admin/categories` - Quản lý categories
- `GET /api/v1/admin/audit-logs` - Audit logs

## Testing

### Backend Testing

```bash
# Run tests
./gradlew test

# With coverage
./gradlew test jacocoTestReport
```

### Frontend Testing

```bash
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

## Troubleshooting

### Backend không khởi động
- Kiểm tra MySQL đã chạy chưa
- Kiểm tra username/password database
- Kiểm tra port 8080 có bị chiếm không

### Frontend không kết nối được backend
- Kiểm tra backend đang chạy tại port 8080
- Kiểm tra CORS configuration trong SecurityConfig
- Kiểm tra proxy config trong vite.config.ts

### CORS errors
- Đảm bảo SecurityConfig có cấu hình CORS đúng
- Frontend phải chạy qua proxy hoặc cấu hình CORS cho phép origin

## License

MIT License

## Support

Nếu có vấn đề, vui lòng tạo issue trên GitHub repository.
