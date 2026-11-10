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
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import { useThemeStore } from '../store/themeStore';
import LanguageToggle from '../i18n/LanguageToggle';
import api from '../lib/axios';
import { FinancialSpace, NotificationItem, PageResponse } from '../types';
import { formatDateTime } from '../lib/utils';
import GlobalSearch from '../components/GlobalSearch';

export default function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentSpace, spaces, setSpaces, setCurrentSpace, reset } = useSpaceStore();
  const { theme, toggleTheme } = useThemeStore();

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
    { path: '/', label: t('nav.user.overview'), icon: LayoutDashboard },
    { path: '/transactions', label: t('nav.user.transactions'), icon: ArrowLeftRight },
    { path: '/recurring', label: t('nav.user.recurring'), icon: RefreshCw },
    { path: '/wallets', label: t('nav.user.wallets'), icon: Wallet },
    { path: '/budget', label: t('nav.user.budget'), icon: BarChart3 },
    { path: '/goals', label: t('nav.user.goals'), icon: Target },
    { path: '/alerts', label: t('nav.user.alerts'), icon: AlertTriangle },
    { path: '/family', label: t('nav.user.family'), icon: Home },
    { path: '/categories', label: t('nav.user.categories'), icon: Tags },
    { path: '/reports', label: t('nav.user.reports'), icon: BarChart3 },
  ];

  const adminNavItems = [
    { path: '/admin', label: t('nav.admin.dashboard'), icon: Shield },
    { path: '/admin/users', label: t('nav.admin.users'), icon: Users },
    { path: '/admin/categories', label: t('nav.admin.categories'), icon: FileText },
    { path: '/admin/audit-logs', label: t('nav.admin.auditLogs'), icon: FileText },
  ];

  const allNavItems = [...userNavItems, ...adminNavItems];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
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
            aria-label={t('header.closeMenu')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">
          {/* Section: Tài chính cá nhân / Personal Finance */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 px-3 mb-2">
              {user?.role === 'ADMIN' ? t('nav.sections.personal') : t('nav.sections.menu')}
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
                        ${
                          isActive
                            ? 'bg-white/15 text-white shadow-lg shadow-black/20 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-violet-400'
                            : 'text-white/60 hover:bg-white/8 hover:text-white'
                        }
                      `}
                    >
                      <span
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                          isActive ? 'bg-violet-500/40' : 'bg-transparent'
                        }`}
                      >
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
                {t('nav.sections.admin')}
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
                          ${
                            isActive
                              ? 'bg-white/15 text-white shadow-lg shadow-black/20 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-violet-400'
                              : 'text-white/60 hover:bg-white/8 hover:text-white'
                          }
                        `}
                      >
                        <span
                          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                            isActive ? 'bg-violet-500/40' : 'bg-transparent'
                          }`}
                        >
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
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-700/70 h-16 flex items-center px-3 lg:px-6 shadow-sm sticky top-0 z-30 transition-colors duration-200">
          <div className="flex items-center justify-between w-full gap-2">
            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors focus-ring shrink-0"
                aria-label={t('header.openMenu')}
              >
                <Menu className="w-5 h-5" />
              </button>
              {/* Breadcrumb / page title hint */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {allNavItems.find((i) => i.path === location.pathname)?.label ||
                    (location.pathname.startsWith('/admin')
                      ? t('nav.sections.admin')
                      : t('nav.user.overview'))}
                </span>
              </div>
            </div>

            {/* Right: Space selector + Search + Language + Theme + Notifications + User Menu */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Space Selector (only on personal finance pages) */}
              {spaces.length > 0 && !location.pathname.startsWith('/admin') && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSpaceMenu(!showSpaceMenu);
                      setShowNotifications(false);
                      setShowUserMenu(false);
                    }}
                    aria-label={t('header.selectSpace')}
                    aria-expanded={showSpaceMenu}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 focus-ring"
                  >
                    <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
                      <Wallet className="w-3 h-3 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                      {currentSpace?.name || t('header.selectSpace')}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${
                        showSpaceMenu ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {showSpaceMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 overflow-hidden animate-slide-in-down">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-4 py-2">
                        {t('header.spaces')}
                      </p>
                      {spaces.map((space) => (
                        <button
                          key={space.id}
                          onClick={() => {
                            setCurrentSpace(space);
                            setShowSpaceMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-ring ${
                            currentSpace?.id === space.id
                              ? 'bg-indigo-50 dark:bg-indigo-900/30'
                              : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                            <Wallet
                              className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {space.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {space.type === 'FAMILY'
                                ? t('header.spaceType.family')
                                : t('header.spaceType.personal')}
                            </div>
                          </div>
                          {currentSpace?.id === space.id && (
                            <span
                              className="ml-auto w-2 h-2 rounded-full bg-indigo-500 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Search Button */}
              <button
                onClick={() => setShowSearch(true)}
                title={t('header.searchHint')}
                aria-label={t('header.searchHint')}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-ring"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Language Switcher */}
              <LanguageToggle />

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
                aria-label={theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-ring"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Notifications Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowSpaceMenu(false);
                    setShowUserMenu(false);
                  }}
                  aria-label={`${t('header.notifications')}${
                    unreadCount > 0 ? ` (${unreadCount})` : ''
                  }`}
                  aria-expanded={showNotifications}
                  className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-ring"
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
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
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                          {t('header.notifications')}
                        </span>
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
                        {t('header.markAllRead')}
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <Bell
                            className="w-8 h-8 text-gray-200 dark:text-gray-600"
                            aria-hidden="true"
                          />
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            {t('header.noNotifications')}
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                              n.isRead ? '' : 'bg-indigo-50/40 dark:bg-indigo-900/10'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {n.title}
                              </span>
                              {!n.isRead && (
                                <span
                                  className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {n.message}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                              {formatDateTime(n.createdAt)}
                            </p>
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
                  aria-label={t('header.userAccount')}
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
                    className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 overflow-hidden animate-slide-in-down">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30">
                      <div className="flex items-center gap-3">
                        {user?.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {user?.fullName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                            {user?.fullName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                            {user?.email}
                          </div>
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
                        {location.pathname.startsWith('/admin')
                          ? t('header.userDashboard')
                          : t('header.adminPanel')}
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 transition-colors focus-ring"
                    >
                      <Settings className="w-4 h-4 text-gray-400" aria-hidden="true" />
                      {t('common.settings')}
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500 transition-colors focus-ring"
                        aria-label={t('common.logout')}
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" />
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-200"
          onClick={() => {
            setShowNotifications(false);
            setShowSpaceMenu(false);
            setShowUserMenu(false);
          }}
        >
          {spacesReady || location.pathname.startsWith('/admin') ? (
            <Outlet />
          ) : (
            <div
              className="flex items-center justify-center h-96"
              role="status"
              aria-label={t('common.loading')}
            >
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
                aria-hidden="true"
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
