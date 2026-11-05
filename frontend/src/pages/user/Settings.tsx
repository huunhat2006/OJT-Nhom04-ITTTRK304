// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useRef, useState } from 'react';
import {
  User,
  Lock,
  Wallet,
  Save,
  Plus,
  Home,
  Sun,
  Moon,
  Globe,
  Clock,
  Mail,
  Camera,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSpaceStore } from '../../store/spaceStore';
import api from '../../lib/axios';
import { FinancialSpace, UserPreferences } from '../../types';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { setLanguage, type Language } from '../../i18n';

// ── Timezone list (common) ──────────────────────────────────────────────────
const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: '(UTC+7) Hồ Chí Minh' },
  { value: 'Asia/Bangkok', label: '(UTC+7) Bangkok' },
  { value: 'Asia/Singapore', label: '(UTC+8) Singapore' },
  { value: 'Asia/Tokyo', label: '(UTC+9) Tokyo' },
  { value: 'Asia/Seoul', label: '(UTC+9) Seoul' },
  { value: 'Asia/Shanghai', label: '(UTC+8) Thượng Hải' },
  { value: 'Europe/London', label: '(UTC+0) London' },
  { value: 'Europe/Paris', label: '(UTC+1) Paris' },
  { value: 'America/New_York', label: '(UTC-5) New York' },
  { value: 'America/Los_Angeles', label: '(UTC-8) Los Angeles' },
  { value: 'UTC', label: '(UTC+0) UTC' },
];

type Tab = 'profile' | 'password' | 'spaces' | 'preferences';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { setSpaces, setCurrentSpace, currentSpace } = useSpaceStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // ── Profile tab ─────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [profileErrors, setProfileErrors] = useState({ fullName: '', email: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Password tab ─────────────────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });

  // ── Spaces tab ─────────────────────────────────────────────────────────
  const [spaces, setLocalSpaces] = useState<FinancialSpace[]>([]);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [spaceForm, setSpaceForm] = useState({ name: '', description: '' });
  const [creatingSpace, setCreatingSpace] = useState(false);

  // ── Preferences tab ────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState<UserPreferences>({
    timezone: 'Asia/Ho_Chi_Minh',
    emailNotifications: true,
    language: 'vi',
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('bton.theme') === 'dark';
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (activeTab === 'spaces') fetchSpaces();
    if (activeTab === 'preferences') fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Apply dark mode on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('bton.theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const fetchSpaces = async () => {
    try {
      const { data } = await api.get<FinancialSpace[]>('/spaces');
      setLocalSpaces(data);
      setSpaces(data);
    } catch {
      // ignore
    }
  };

  const fetchPreferences = async () => {
    try {
      const { data } = await api.get<UserPreferences>('/users/preferences');
      setPrefs(data);
    } catch {
      // ignore — use defaults
    }
  };

  // ── Profile validation ──────────────────────────────────────────────────
  const validateProfile = () => {
    const errs = { fullName: '', email: '' };
    if (!profileData.fullName.trim()) errs.fullName = 'Vui lòng nhập họ tên';
    else if (profileData.fullName.trim().length < 3) errs.fullName = 'Họ tên phải có ít nhất 3 ký tự';
    if (!profileData.email.trim()) errs.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) errs.email = 'Email không hợp lệ';
    setProfileErrors(errs);
    return !errs.fullName && !errs.email;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh tối đa 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setLoading(true);
    try {
      // Upload avatar first if changed
      if (avatarFile) {
        const form = new FormData();
        form.append('file', avatarFile);
        const res = await api.post<{ avatarUrl: string }>('/users/avatar', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAvatarPreview(res.data.avatarUrl);
        setAvatarFile(null);
      }
      const response = await api.put('/users/profile', {
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
      });
      updateUser(response.data);
      toast.success('Cập nhật thông tin thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ── Password validation ─────────────────────────────────────────────────
  const validatePassword = () => {
    const errs = { currentPassword: '', newPassword: '', confirmPassword: '' };
    if (!passwordData.currentPassword) errs.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!passwordData.newPassword) errs.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (passwordData.newPassword.length < 6) errs.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword))
      errs.newPassword = 'Phải có chữ hoa, chữ thường và số';
    if (!passwordData.confirmPassword) errs.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    else if (passwordData.newPassword !== passwordData.confirmPassword)
      errs.confirmPassword = 'Mật khẩu xác nhận không khớp';
    setPasswordErrors(errs);
    return !errs.currentPassword && !errs.newPassword && !errs.confirmPassword;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Đổi mật khẩu thành công');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  // ── Spaces ──────────────────────────────────────────────────────────────
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceForm.name.trim()) { toast.error('Vui lòng nhập tên không gian'); return; }
    setCreatingSpace(true);
    try {
      const { data } = await api.post<FinancialSpace>('/spaces', {
        name: spaceForm.name,
        description: spaceForm.description,
        type: 'PERSONAL',
        currency: 'VND',
      });
      toast.success('Đã tạo không gian');
      setShowCreateSpace(false);
      setSpaceForm({ name: '', description: '' });
      fetchSpaces();
      setCurrentSpace(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo không gian');
    } finally {
      setCreatingSpace(false);
    }
  };

  const handleDeleteSpace = async (space: FinancialSpace) => {
    if (!confirm(`Xóa (vô hiệu hóa) "${space.name}"?`)) return;
    try {
      await api.delete(`/spaces/${space.id}`);
      toast.success('Đã xóa không gian');
      fetchSpaces();
      if (currentSpace?.id === space.id) setCurrentSpace(null as any);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa');
    }
  };

  // ── Preferences ─────────────────────────────────────────────────────────
  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.put('/users/preferences', prefs);
      // Apply language immediately
      await setLanguage(prefs.language as Language);
      toast.success('Đã lưu tuỳ chọn');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu tuỳ chọn');
    } finally {
      setSavingPrefs(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: User },
    { id: 'password', label: 'Đổi mật khẩu', icon: Lock },
    { id: 'spaces', label: 'Không gian tài chính', icon: Wallet },
    { id: 'preferences', label: 'Tuỳ chọn', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Quản lý thông tin tài khoản và cài đặt</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabs */}
        <div className="card lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="card lg:col-span-3">
          {/* ── Profile Tab ─────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Thay avatar"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Ảnh đại diện</p>
                  <p className="text-xs text-gray-500 mt-0.5">JPG, PNG, WebP tối đa 5MB</p>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Thay ảnh
                  </button>
                </div>
              </div>

              {/* Username (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input type="text" value={user?.username || ''} disabled className="input bg-gray-100" />
                <p className="text-xs text-gray-500 mt-1">Username không thể thay đổi</p>
              </div>

              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => {
                    setProfileData({ ...profileData, fullName: e.target.value });
                    if (profileErrors.fullName) setProfileErrors({ ...profileErrors, fullName: '' });
                  }}
                  className={`input ${profileErrors.fullName ? 'border-danger focus:ring-danger' : ''}`}
                />
                {profileErrors.fullName && (
                  <p className="mt-1 text-sm text-danger">{profileErrors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => {
                    setProfileData({ ...profileData, email: e.target.value });
                    if (profileErrors.email) setProfileErrors({ ...profileErrors, email: '' });
                  }}
                  className={`input ${profileErrors.email ? 'border-danger focus:ring-danger' : ''}`}
                />
                {profileErrors.email && (
                  <p className="mt-1 text-sm text-danger">{profileErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="input"
                  placeholder="0901234567"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          )}

          {/* ── Password Tab ─────────────────────────────────────────────── */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Đổi mật khẩu</h2>

              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPwd.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value });
                      if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                    }}
                    className={`input pr-10 ${passwordErrors.currentPassword ? 'border-danger focus:ring-danger' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, current: !s.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-danger">{passwordErrors.currentPassword}</p>
                )}
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPwd.next ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                      if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: '' });
                    }}
                    className={`input pr-10 ${passwordErrors.newPassword ? 'border-danger focus:ring-danger' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, next: !s.next }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword ? (
                  <p className="mt-1 text-sm text-danger">{passwordErrors.newPassword}</p>
                ) : (
                  passwordData.newPassword && (
                    <p className="mt-1 text-xs text-gray-500">
                      Phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số
                    </p>
                  )
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPwd.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                      if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                    }}
                    className={`input pr-10 ${passwordErrors.confirmPassword ? 'border-danger focus:ring-danger' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => ({ ...s, confirm: !s.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </button>
            </form>
          )}

          {/* ── Spaces Tab ───────────────────────────────────────────────── */}
          {activeTab === 'spaces' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Không gian tài chính</h2>
                  <p className="text-sm text-gray-500 mt-1">Quản lý các không gian tài chính của bạn</p>
                </div>
                <button
                  onClick={() => setShowCreateSpace(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tạo không gian
                </button>
              </div>
              <div className="space-y-3">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{space.name}</div>
                      <div className="text-xs text-gray-500">
                        {space.type === 'FAMILY' ? 'Gia đình' : 'Cá nhân'} · {space.currency || 'VND'}
                      </div>
                    </div>
                    <button
                      onClick={() => { setCurrentSpace(space); toast.success(`Đã chọn "${space.name}"`); }}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Chọn
                    </button>
                    <button
                      onClick={() => handleDeleteSpace(space)}
                      className="text-sm text-danger hover:text-danger/80"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
                {spaces.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">Chưa có không gian nào</p>
                )}
              </div>
            </div>
          )}

          {/* ── Preferences Tab ──────────────────────────────────────────── */}
          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-gray-900">Tuỳ chọn</h2>

              {/* Dark / Light mode */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Giao diện
                </h3>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => !darkMode || toggleDarkMode()}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${!darkMode ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Sun className="w-6 h-6 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700">Sáng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => darkMode || toggleDarkMode()}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${darkMode ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Moon className="w-6 h-6 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">Tối</span>
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Ngôn ngữ
                </h3>
                <div className="flex gap-3">
                  {(['vi', 'en'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setPrefs({ ...prefs, language: lang })}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${prefs.language === lang ? 'border-primary bg-primary text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    >
                      {lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timezone */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Múi giờ
                </h3>
                <select
                  value={prefs.timezone}
                  onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                  className="input"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email notifications */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Thông báo qua email
                </h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setPrefs({ ...prefs, emailNotifications: !prefs.emailNotifications })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${prefs.emailNotifications ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${prefs.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </div>
                  <span className="text-sm text-gray-700">
                    {prefs.emailNotifications ? 'Đang bật – nhận thông báo qua email' : 'Đã tắt – không nhận thông báo qua email'}
                  </span>
                </label>
              </div>

              <button
                type="button"
                disabled={savingPrefs}
                onClick={handleSavePreferences}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingPrefs ? 'Đang lưu...' : 'Lưu tuỳ chọn'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Space Modal */}
      <Modal open={showCreateSpace} onClose={() => setShowCreateSpace(false)} title="Tạo không gian tài chính">
        <form onSubmit={handleCreateSpace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên *</label>
            <input
              type="text"
              value={spaceForm.name}
              onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
              className="input"
              placeholder="Chi tiêu cá nhân"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea
              value={spaceForm.description}
              onChange={(e) => setSpaceForm({ ...spaceForm, description: e.target.value })}
              className="input"
              rows={2}
              maxLength={500}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={creatingSpace} className="btn btn-primary flex-1">
              {creatingSpace ? 'Đang tạo...' : 'Tạo'}
            </button>
            <button type="button" onClick={() => setShowCreateSpace(false)} className="btn btn-secondary flex-1">
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
