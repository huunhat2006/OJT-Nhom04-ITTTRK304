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
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSpaceStore } from '../store/spaceStore';
import api from '../lib/axios';
import { FinancialSpace } from '../types';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentSpace, spaces, setSpaces, setCurrentSpace, reset } = useSpaceStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSpaceMenu, setShowSpaceMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const userNavItems = [
    { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/transactions', label: 'Giao dịch', icon: ArrowLeftRight },
    { path: '/wallets', label: 'Ví tiền', icon: Wallet },
    { path: '/budget', label: 'Ngân sách', icon: BarChart3 },
    { path: '/goals', label: 'Mục tiêu', icon: Target },
    { path: '/alerts', label: 'Cảnh báo', icon: AlertTriangle },
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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-3">
            Menu
          </p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
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
        </nav>

        {/* Bottom: Settings + Logout */}
        <div className="p-3 border-t border-white/10">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${location.pathname === '/settings'
                ? 'bg-white/15 text-white'
                : 'text-white/60 hover:bg-white/8 hover:text-white'
              }
            `}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg">
              <Settings className="w-4 h-4" />
            </span>
            <span className="font-medium text-sm">Cài đặt</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 mt-0.5 rounded-xl text-white/60 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg">
              <LogOut className="w-4 h-4" />
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
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/70 h-16 flex items-center px-4 lg:px-6 shadow-sm sticky top-0 z-30">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Space Selector */}
              {spaces.length > 0 && !location.pathname.startsWith('/admin') && (
                <div className="relative">
                  <button
                    onClick={() => setShowSpaceMenu(!showSpaceMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
                  >
                    <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center">
                      <Wallet className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                      {currentSpace?.name || 'Chọn không gian'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showSpaceMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showSpaceMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-4 py-2">
                        Không gian tài chính
                      </p>
                      {spaces.map((space) => (
                        <button
                          key={space.id}
                          onClick={() => {
                            setCurrentSpace(space);
                            setShowSpaceMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${currentSpace?.id === space.id ? 'bg-indigo-50' : ''}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium text-gray-800">{space.name}</div>
                            <div className="text-xs text-gray-400">
                              {space.type === 'FAMILY' ? 'Gia đình' : 'Cá nhân'}
                            </div>
                          </div>
                          {currentSpace?.id === space.id && (
                            <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-indigo-200">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user?.fullName?.split(' ').pop()}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                          {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{user?.fullName}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[140px]">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to={location.pathname.startsWith('/admin') ? '/' : '/admin'}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-indigo-500" />
                        {location.pathname.startsWith('/admin') ? 'User Dashboard' : 'Admin Panel'}
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Cài đặt
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-8" onClick={() => {
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
