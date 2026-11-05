// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useRef, useState } from 'react';
import { Camera, Save, Lock, Eye, EyeOff, User, Mail, Phone, AtSign, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { formatDate } from '../../lib/utils';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── Profile form ───────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [profileErrors, setProfileErrors] = useState({ fullName: '', email: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password form ──────────────────────────────────────────────────────
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
  const [savingPassword, setSavingPassword] = useState(false);

  // ── Avatar ─────────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Validate profile ───────────────────────────────────────────────────
  const validateProfile = () => {
    const errs = { fullName: '', email: '' };
    if (!profileData.fullName.trim()) errs.fullName = 'Vui lòng nhập họ tên';
    else if (profileData.fullName.trim().length < 3) errs.fullName = 'Họ tên phải có ít nhất 3 ký tự';
    if (!profileData.email.trim()) errs.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) errs.email = 'Email không hợp lệ';
    setProfileErrors(errs);
    return !errs.fullName && !errs.email;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;
    setSavingProfile(true);
    try {
      if (avatarFile) {
        const form = new FormData();
        form.append('file', avatarFile);
        const res = await api.post<{ avatarUrl: string }>('/users/avatar', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAvatarPreview(res.data.avatarUrl);
        setAvatarFile(null);
      }
      const { data } = await api.put('/users/profile', {
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
      });
      updateUser(data);
      toast.success('Cập nhật thông tin thành công');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Validate password ──────────────────────────────────────────────────
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
    setSavingPassword(true);
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
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 mt-1">Quản lý thông tin và bảo mật tài khoản</p>
      </div>

      {/* Profile card */}
      <div className="card">
        {/* Avatar banner */}
        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
          <div className="relative group shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.fullName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Thay ảnh đại diện"
            >
              <Camera className="w-7 h-7 text-white" />
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
            <h2 className="text-xl font-bold text-gray-900">{user?.fullName}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${user?.role === 'ADMIN' ? 'badge-primary' : 'badge-success'} text-xs`}>
                <Shield className="w-3 h-3 inline mr-1" />
                {user?.role === 'ADMIN' ? 'Admin' : 'User'}
              </span>
              {user?.createdAt && (
                <span className="text-xs text-gray-400">
                  Tham gia từ {formatDate(user.createdAt)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Thay ảnh đại diện
            </button>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleUpdateProfile} className="space-y-5 pt-6">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-4 h-4" /> Thông tin cơ bản
          </h3>

          {/* Username (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5" /> Username
            </label>
            <input type="text" value={user?.username || ''} disabled className="input bg-gray-100" />
            <p className="text-xs text-gray-400 mt-1">Username không thể thay đổi</p>
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
              placeholder="Nguyễn Văn A"
            />
            {profileErrors.fullName && (
              <p className="mt-1 text-sm text-danger">{profileErrors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => {
                setProfileData({ ...profileData, email: e.target.value });
                if (profileErrors.email) setProfileErrors({ ...profileErrors, email: '' });
              }}
              className={`input ${profileErrors.email ? 'border-danger focus:ring-danger' : ''}`}
              placeholder="email@example.com"
            />
            {profileErrors.email && (
              <p className="mt-1 text-sm text-danger">{profileErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Số điện thoại
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="input"
              placeholder="0901234567"
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn btn-primary flex items-center gap-2 w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>

      {/* Change password card */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4" /> Đổi mật khẩu
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-5">
          {/* Current */}
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
                autoComplete="current-password"
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

          {/* New */}
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
                autoComplete="new-password"
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
            ) : passwordData.newPassword ? (
              <p className="mt-1 text-xs text-gray-500">
                Ít nhất 6 ký tự, có chữ hoa, chữ thường và số
              </p>
            ) : null}
          </div>

          {/* Confirm */}
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
                autoComplete="new-password"
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

          <button
            type="submit"
            disabled={savingPassword}
            className="btn btn-primary flex items-center gap-2 w-full sm:w-auto"
          >
            <Lock className="w-4 h-4" />
            {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}
