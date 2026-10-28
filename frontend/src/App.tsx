// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User Pages
import Overview from './pages/user/Overview';
import Transactions from './pages/user/Transactions';
import Wallets from './pages/user/Wallets';
import Budget from './pages/user/Budget';
import Goals from './pages/user/Goals';
import Family from './pages/user/Family';
import Categories from './pages/user/Categories';
import Reports from './pages/user/Reports';
import Settings from './pages/user/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCategories from './pages/admin/Categories';
import AdminAuditLogs from './pages/admin/AuditLogs';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          </Route>

          {/* Protected Routes */}
          <Route element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}>
            {/* User Routes */}
            <Route path="/" element={<Overview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/family" element={<Family />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />

            {/* Admin Routes */}
            {user?.role === 'ADMIN' && (
              <>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              </>
            )}
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
