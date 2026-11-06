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

            {/* Protected Routes */}
            <Route element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}>
              {/* User Routes */}
              <Route path="/" element={<ErrorBoundary><Overview /></ErrorBoundary>} />
              <Route path="/transactions" element={<ErrorBoundary><Transactions /></ErrorBoundary>} />
              <Route path="/wallets" element={<ErrorBoundary><Wallets /></ErrorBoundary>} />
              <Route path="/budget" element={<ErrorBoundary><Budget /></ErrorBoundary>} />
              <Route path="/goals" element={<ErrorBoundary><Goals /></ErrorBoundary>} />
              <Route path="/family" element={<ErrorBoundary><Family /></ErrorBoundary>} />
              <Route path="/categories" element={<ErrorBoundary><Categories /></ErrorBoundary>} />
              <Route path="/reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
              <Route path="/alerts" element={<ErrorBoundary><SpendingAlerts /></ErrorBoundary>} />
              <Route path="/recurring" element={<ErrorBoundary><RecurringTransactions /></ErrorBoundary>} />
              <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
              <Route path="/notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
              <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />

              {/* Admin Routes */}
              {user?.role === 'ADMIN' && (
                <>
                  <Route path="/admin" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
                  <Route path="/admin/users" element={<ErrorBoundary><AdminUsers /></ErrorBoundary>} />
                  <Route path="/admin/categories" element={<ErrorBoundary><AdminCategories /></ErrorBoundary>} />
                  <Route path="/admin/audit-logs" element={<ErrorBoundary><AdminAuditLogs /></ErrorBoundary>} />
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
