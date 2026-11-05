// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { useThemeStore, applyTheme } from './store/themeStore';

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
import SpendingAlerts from './pages/user/SpendingAlerts';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCategories from './pages/admin/Categories';
import AdminAuditLogs from './pages/admin/AuditLogs';

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const defaultPath = user?.role === 'ADMIN' ? '/admin' : '/';
  const { theme } = useThemeStore();

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={defaultPath} replace />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={defaultPath} replace />} />
          </Route>

          {/* Protected Routes */}
          <Route element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}>
            {/* User & Personal Finance Routes (accessible to both USER and ADMIN) */}
            <Route path="/" element={<Overview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/family" element={<Family />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/alerts" element={<SpendingAlerts />} />
            <Route path="/settings" element={<Settings />} />

            {/* Admin Management Routes (ADMIN only) */}
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
          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#1e293b' : '#fff',
            color: theme === 'dark' ? '#f1f5f9' : '#1f2937',
            border: theme === 'dark' ? '1px solid #334155' : '1px solid #e5e7eb',
          },
        }}
      />
    </>
  );
}

export default App;
