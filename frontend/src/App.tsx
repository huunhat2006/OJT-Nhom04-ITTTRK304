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
import OAuth2Callback from './pages/auth/OAuth2Callback';

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
import RecurringTransactions from './pages/user/RecurringTransactions';
import Notifications from './pages/user/Notifications';
import Profile from './pages/user/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCategories from './pages/admin/Categories';
import AdminAuditLogs from './pages/admin/AuditLogs';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <>
      <Router>
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            </Route>

            {/* OAuth2 callback — luôn public, không wrap AuthLayout */}
            <Route path="/oauth2/callback" element={<OAuth2Callback />} />

            {/* Protected Routes */}
            <Route element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" replace />}>
              {/* User & Personal Finance Routes (accessible to both USER and ADMIN) */}
              <Route path="/" element={<Overview />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/recurring" element={<RecurringTransactions />} />
              <Route path="/wallets" element={<Wallets />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/family" element={<Family />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/alerts" element={<SpendingAlerts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />

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
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </ErrorBoundary>
      </Router>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
