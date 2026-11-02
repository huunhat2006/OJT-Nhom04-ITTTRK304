// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  Users,
  Shield,
  FileText,
  Menu,
  X,
  Tags,
  Home,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import api from '../lib/axios';
import { FinancialSpace, NotificationItem, PageResponse } from '../types';
import { formatDateTime } from '../lib/utils';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentSpace, spaces, setSpaces, setCurrentSpace, reset } = useSpaceStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSpaceMenu, setShowSpaceMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [spacesReady, setSpacesReady] = useState(false);

  // Load accessible spaces from API and auto-select the first one
  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const { data } = await api.get<FinancialSpace[]>('/spaces');
        setSpaces(data);
        const store = useSpaceStore.getState();
        const stillValid = store.currentSpace
          ? data.find((s) => s.id === store.currentSpace!.id)
          : null;
        if (!stillValid && data.length > 0) {
          setCurrentSpace(data[0]);
        } else if (stillValid) {
          setCurrentSpace(stillValid);
        } else if (data.length === 0) {
          reset();
        }
      } catch {
        // stay silent — pages show "select a space" hint
      } finally {
        setSpacesReady(true);
      }
    };
    loadSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [listRes, countRes] = await Promise.all([
          api.get<PageResponse<NotificationItem>>('/notifications?page=0&size=10'),
          api.get<{ count: number }>('/notifications/unread-count'),
        ]);
        setNotifications(listRes.data.content);
        setUnreadCount(countRes.data.count);
      } catch {
        // ignore
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // ignore — logout locally regardless
    }
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const userNavItems = [
    { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/transactions', label: 'Giao dịch', icon: ArrowLeftRight },
    { path: '/wallets', label: 'Ví tiền', icon: Wallet },
    { path: '/budget', label: 'Ngân sách', icon: BarChart3 },
    { path: '/goals', label: 'Mục tiêu', icon: Target },
    { path: '/family', label: 'Gia đình', icon: Home },
    { path: '/categories', label: 'Danh mục', icon: Tags },
    { path: '/reports', label: 'Báo cáo', icon: BarChart3 },
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: Shield },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/categories', label: 'Categories', icon: FileText },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  const navItems = user?.role === 'ADMIN' && location.pathname.startsWith('/admin')
    ? adminNavItems
    : userNavItems;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Budgivee</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                        ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Menu */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                ${
                  location.pathname === '/settings'
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Cài đặt</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-8">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Space Selector */}
              {spaces.length > 0 && !location.pathname.startsWith('/admin') && (
                <div className="relative">
                  <button
                    onClick={() => setShowSpaceMenu(!showSpaceMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{currentSpace?.name || 'Chọn không gian'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {showSpaceMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {spaces.map((space) => (
                        <button
                          key={space.id}
                          onClick={() => {
                            setCurrentSpace(space);
                            setShowSpaceMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                        >
                          <Wallet className="w-4 h-4 text-gray-600" />
                          <div className="text-left">
                            <div className="text-sm font-medium">{space.name}</div>
                            <div className="text-xs text-gray-500">
                              {space.type === 'FAMILY' ? 'Gia đình' : 'Cá nhân'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-danger rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-gray-900">Thông báo</span>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary hover:text-primary-dark"
                      >
                        Đánh dấu đã đọc
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">Không có thông báo</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b border-gray-50 ${n.isRead ? '' : 'bg-primary/5'}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium text-gray-900">{n.title}</span>
                              {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2"
                >
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{user?.fullName}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to={location.pathname.startsWith('/admin') ? '/' : '/admin'}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm"
                      >
                        <Shield className="w-4 h-4" />
                        {location.pathname.startsWith('/admin') ? 'User Dashboard' : 'Admin Panel'}
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm"
                    >
                      <Settings className="w-4 h-4" />
                      Cài đặt
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-danger"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8" onClick={() => {
          setShowNotifications(false);
          setShowSpaceMenu(false);
          setShowUserMenu(false);
        }}>
          {spacesReady || location.pathname.startsWith('/admin') ? (
            <Outlet />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
