// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useRef, useState } from 'react';
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
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import api from '../lib/axios';
import { FinancialSpace, NotificationItem, PageResponse } from '../types';
import { formatDateTime } from '../lib/utils';
import GlobalSearch from '../components/GlobalSearch';

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
  const [showSearch, setShowSearch] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

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

  // Load notifications + poll every 30s
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
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cmd+K / Ctrl+K → open global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
    { path: '/recurring', label: 'Định kỳ', icon: RefreshCw },
    { path: '/wallets', label: 'Ví tiền', icon: Wallet },
    { path: '/budget', label: 'Ngân sách', icon: BarChart3 },
    { path: '/goals', label: 'Mục tiêu', icon: Target },
    { path: '/alerts', label: 'Cảnh báo', icon: AlertTriangle },
    { path: '/family', label: 'Gia đình', icon: Home },
    { path: '/categories', label: 'Danh mục', icon: Tags },
    { path: '/reports', label: 'Báo cáo', icon: BarChart3 },
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard Quản trị', icon: Shield },
    { path: '/admin/users', label: 'Người dùng', icon: Users },
    { path: '/admin/categories', label: 'Danh mục hệ thống', icon: FileText },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ];

  const allNavItems = [...userNavItems, ...adminNavItems];

  return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Global Search overlay */}
        {showSearch && <GlobalSearch onClose={() => setShowSearch(false)} />}

        {/* Sidebar */}
        <aside
            className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 flex flex-col
          bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]
          shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">Budgivee</span>
            </div>
            <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white/60 hover:text-white transition-colors"
                aria-label="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">
            {/* Section: Tài chính cá nhân */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-3 mb-2">
                {user?.role === 'ADMIN' ? 'Tài chính cá nhân' : 'Menu'}
              </p>
              <ul className="space-y-0.5">
                {userNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                      <li key={item.path}>
                        <Link
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                        relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                        ${isActive
                                ? 'bg-white/15 text-white shadow-lg shadow-black/20 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-violet-400'
                                : 'text-white/60 hover:bg-white/8 hover:text-white'
                            }
                      `}
                        >
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${isActive ? 'bg-violet-500/40' : 'bg-transparent'}`}>
                        <Icon className="w-4.5 h-4.5" />
                      </span>
                          <span className="font-medium text-sm">{item.label}</span>
                          {isActive && (
                              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                          )}
                        </Link>
                      </li>
                  );
                })}
              </ul>
            </div>

            {/* Section: Quản trị hệ thống (chỉ hiển thị khi role là ADMIN) */}
            {user?.role === 'ADMIN' && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-300/80 px-3 mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-violet-400" />
                    Quản trị hệ thống
                  </p>
                  <ul className="space-y-0.5">
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                          <li key={item.path}>
                            <Link
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                          relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                          ${isActive
                                    ? 'bg-white/15 text-white shadow-lg shadow-black/20 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-violet-400'
                                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                                }
                        `}
                            >
                        <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${isActive ? 'bg-violet-500/40' : 'bg-transparent'}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </span>
                              <span className="font-medium text-sm">{item.label}</span>
                              {isActive && (
                                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
                              )}
                            </Link>
                          </li>
                      );
                    })}
                  </ul>
                </div>
            )}
          </nav>

          {/* Bottom: Settings + Logout */}
          <div className="p-3 border-t border-white/10">
            <Link
                to="/settings"
                onClick={() => setSidebarOpen(false)}
                aria-current={location.pathname === '/settings' ? 'page' : undefined}
                className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 focus-ring
              ${location.pathname === '/settings'
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                }
            `}
            >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg">
              <Settings className="w-4 h-4" aria-hidden="true" />
            </span>
              <span className="font-medium text-sm">Cài đặt</span>
            </Link>
            <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 mt-0.5 rounded-xl text-white/60 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 focus-ring"
                aria-label="Đăng xuất"
            >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg">
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </span>
              <span className="font-medium text-sm">Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-700/70 h-16 flex items-center px-3 lg:px-6 shadow-sm sticky top-0 z-30">
            <div className="flex items-center justify-between w-full gap-2">
              {/* Left: hamburger + breadcrumb */}
              <div className="flex items-center gap-2 min-w-0">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 transition-colors focus-ring shrink-0"
                    aria-label="Mở menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {/* Breadcrumb / page title hint */}
                <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {allNavItems.find(i => i.path === location.pathname)?.label || (location.pathname.startsWith('/admin') ? 'Quản trị hệ thống' : 'Dashboard')}
                </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Space Selector (only on personal finance pages) */}
                {spaces.length > 0 && !location.pathname.startsWith('/admin') && (
                    <div className="relative">
                      <button
                          onClick={() => {
                            setShowSpaceMenu(!showSpaceMenu);
                            setShowNotifications(false);
                            setShowUserMenu(false);
                          }}
                          aria-label="Chọn không gian tài chính"
                          aria-expanded={showSpaceMenu}
                          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 focus-ring"
                      >
                        <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
                          <Wallet className="w-3 h-3 text-white" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                      {currentSpace?.name || 'Chọn không gian'}
                    </span>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${showSpaceMenu ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                        />
                      </button>
                      {showSpaceMenu && (
                          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 overflow-hidden animate-slide-in-down">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-4 py-2">
                              Không gian tài chính
                            </p>
                            {spaces.map((space) => (
                                <button
                                    key={space.id}
                                    onClick={() => { setCurrentSpace(space); setShowSpaceMenu(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-ring ${currentSpace?.id === space.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}
                                >
                                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                                    <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                                  </div>
                                  <div className="text-left min-w-0">
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{space.name}</div>
                                    <div className="text-xs text-gray-400">
                                      {space.type === 'FAMILY' ? 'Gia đình' : 'Cá nhân'}
                                    </div>
                                  </div>
                                  {currentSpace?.id === space.id && (
                                      <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 shrink-0" aria-hidden="true" />
                                  )}
                                </button>
                            ))}
                          </div>
                      )}
                    </div>
                )}

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowSpaceMenu(false);
                        setShowUserMenu(false);
                      }}
                      aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
                      aria-expanded={showNotifications}
                      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-ring"
                  >
                    <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                    {unreadCount > 0 && (
                        <span
                            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-bounce-in"
                            aria-hidden="true"
                        >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                    )}
                  </button>
                  {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-slide-in-down">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-700/50">
                          <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-gray-500" aria-hidden="true" />
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Thông báo</span>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                            {unreadCount}
                          </span>
                            )}
                          </div>
                          <button
                              onClick={handleMarkAllRead}
                              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium focus-ring"
                          >
                            Đánh dấu đã đọc
                          </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                          {notifications.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <Bell className="w-8 h-8 text-gray-200 dark:text-gray-600" aria-hidden="true" />
                                <p className="text-sm text-gray-400 dark:text-gray-500">Không có thông báo</p>
                              </div>
                          ) : (
                              notifications.map((n) => (
                                  <div
                                      key={n.id}
                                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${n.isRead ? '' : 'bg-indigo-50/40 dark:bg-indigo-900/10'}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{n.title}</span>
                                      {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" aria-hidden="true" />}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{formatDateTime(n.createdAt)}</p>
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
                      onClick={() => {
                        setShowUserMenu(!showUserMenu);
                        setShowNotifications(false);
                        setShowSpaceMenu(false);
                      }}
                      aria-label="Tài khoản người dùng"
                      aria-expanded={showUserMenu}
                      className="flex items-center gap-2 pl-2 pr-2 sm:pr-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-ring"
                  >
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-8 h-8 rounded-full object-cover shadow-md shadow-indigo-200"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-indigo-200 shrink-0">
                          {user?.fullName?.charAt(0) || 'U'}
                        </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[80px] truncate">
                    {user?.fullName?.split(' ').pop()}
                  </span>
                    <ChevronDown
                        className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                    />
                  </button>
                  {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 overflow-hidden animate-slide-in-down">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30">
                          <div className="flex items-center gap-3">
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                                  {user?.fullName?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{user?.fullName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{user?.email}</div>
                            </div>
                          </div>
                        </div>
                        {user?.role === 'ADMIN' && (
                            <Link
                                to={location.pathname.startsWith('/admin') ? '/' : '/admin'}
                                onClick={() => setShowUserMenu(false)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-colors focus-ring"
                            >
                              <Shield className="w-4 h-4 text-indigo-500" />
                              {location.pathname.startsWith('/admin') ? 'Về Ví cá nhân' : 'Bảng điều khiển Quản trị'}
                            </Link>
                        )}
                        <Link
                            to="/settings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-colors focus-ring"
                        >
                          <Settings className="w-4 h-4 text-gray-400" aria-hidden="true" />
                          Cài đặt
                        </Link>
                        <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                          <button
                              onClick={() => { handleLogout(); setShowUserMenu(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500 transition-colors focus-ring"
                              aria-label="Đăng xuất"
                          >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200" onClick={() => {
            setShowNotifications(false);
            setShowSpaceMenu(false);
            setShowUserMenu(false);
          }}>
            {spacesReady || location.pathname.startsWith('/admin') ? (
                <Outlet />
            ) : (
                <div className="flex items-center justify-center h-96" role="status" aria-label="Đang tải">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true" />
                </div>
            )}
          </main>
        </div>
      </div>
  );
}