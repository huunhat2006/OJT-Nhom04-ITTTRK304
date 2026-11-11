// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { User, Lock, Wallet, Save, Plus, Home, Palette, Sun, Moon, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useSpaceStore } from '../../store/spaceStore';
import { useThemeStore } from '../../store/themeStore';
import { setLanguage, type Language } from '../../i18n';
import api from '../../lib/axios';
import { FinancialSpace } from '../../types';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { setSpaces, setCurrentSpace, currentSpace } = useSpaceStore();
  const { theme, setTheme } = useThemeStore();
  const currentLang: Language = i18n.language === 'en' ? 'en' : 'vi';

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'spaces' | 'appearance'>('profile');
  const [spaces, setLocalSpaces] = useState<FinancialSpace[]>([]);
  const [showCreateSpace, setShowCreateSpace] = useState(false);
  const [spaceForm, setSpaceForm] = useState({ name: '', description: '' });
  const [creatingSpace, setCreatingSpace] = useState(false);

  useEffect(() => {
    if (activeTab === 'spaces') fetchSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchSpaces = async () => {
    try {
      const { data } = await api.get<FinancialSpace[]>('/spaces');
      setLocalSpaces(data);
      setSpaces(data);
    } catch {
      // ignore
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceForm.name.trim()) {
      toast.error(t('settings.spaces.name'));
      return;
    }
    setCreatingSpace(true);
    try {
      const { data } = await api.post<FinancialSpace>('/spaces', {
        name: spaceForm.name,
        description: spaceForm.description,
        type: 'PERSONAL',
        currency: 'VND',
      });
      toast.success(t('settings.spaces.createdSuccess'));
      setShowCreateSpace(false);
      setSpaceForm({ name: '', description: '' });
      fetchSpaces();
      setCurrentSpace(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('settings.profile.failed'));
    } finally {
      setCreatingSpace(false);
    }
  };

  const handleDeleteSpace = async (space: FinancialSpace) => {
    if (!confirm(`${t('common.delete')} "${space.name}"?`)) return;
    try {
      await api.delete(`/spaces/${space.id}`);
      toast.success(t('settings.spaces.deletedSuccess'));
      fetchSpaces();
      if (currentSpace?.id === space.id) setCurrentSpace(null as any);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('settings.profile.failed'));
    }
  };

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileErrors, setProfileErrors] = useState({
    fullName: '',
    email: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateProfile = () => {
    const newErrors = {
      fullName: '',
      email: '',
    };

    if (!profileData.fullName.trim()) {
      newErrors.fullName = t('auth.errors.fullNameRequired');
    } else if (profileData.fullName.trim().length < 3) {
      newErrors.fullName = t('auth.errors.fullNameMin');
    }

    if (!profileData.email.trim()) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }

    setProfileErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== '');
  };

  const validatePassword = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = t('auth.errors.loginPasswordRequired');
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = t('auth.errors.passwordRequired');
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = t('auth.errors.loginPasswordMin');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = t('auth.errors.passwordPattern');
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = t('settings.password.confirm');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordInvalid');
    }

    setPasswordErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== '');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProfile()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/users/profile', profileData);
      updateUser(response.data);
      toast.success(t('settings.profile.success'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('settings.profile.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success(t('settings.password.success'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('settings.password.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData({ ...profileData, [field]: value });
    if (profileErrors[field as keyof typeof profileErrors]) {
      setProfileErrors({ ...profileErrors, [field]: '' });
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData({ ...passwordData, [field]: value });
    if (passwordErrors[field as keyof typeof passwordErrors]) {
      setPasswordErrors({ ...passwordErrors, [field]: '' });
    }
  };

  const tabs = [
    { id: 'profile', label: t('settings.tabs.profile'), icon: User },
    { id: 'password', label: t('settings.tabs.password'), icon: Lock },
    { id: 'spaces', label: t('settings.tabs.spaces'), icon: Wallet },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('settings.subtitle')}</p>
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('settings.profile.title')}
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.profile.username')}
                </label>
                <input
                  type="text"
                  value={user?.username}
                  disabled
                  className="input bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">{t('settings.profile.usernameImmutable')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.profile.fullName')} <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => handleProfileChange('fullName', e.target.value)}
                  placeholder={t('settings.profile.fullNamePlaceholder')}
                  className={`input ${profileErrors.fullName ? 'border-danger focus:ring-danger' : ''}`}
                />
                {profileErrors.fullName && (
                  <p className="mt-1 text-sm text-danger">{profileErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.profile.email')} <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  placeholder={t('settings.profile.emailPlaceholder')}
                  className={`input ${profileErrors.email ? 'border-danger focus:ring-danger' : ''}`}
                />
                {profileErrors.email && (
                  <p className="mt-1 text-sm text-danger">{profileErrors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? t('settings.profile.saving') : t('settings.profile.save')}
              </button>
            </form>
          )}

          {/* Tab 2: Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('settings.password.title')}
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.password.current')} <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className={`input ${passwordErrors.currentPassword ? 'border-danger focus:ring-danger' : ''}`}
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-danger">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.password.new')} <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className={`input ${passwordErrors.newPassword ? 'border-danger focus:ring-danger' : ''}`}
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-danger">{passwordErrors.newPassword}</p>
                )}
                {!passwordErrors.newPassword && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('settings.password.hint')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('settings.password.confirm')} <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className={`input ${passwordErrors.confirmPassword ? 'border-danger focus:ring-danger' : ''}`}
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {loading ? t('settings.password.submitting') : t('settings.password.submit')}
              </button>
            </form>
          )}

          {/* Tab 3: Spaces */}
          {activeTab === 'spaces' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t('settings.spaces.title')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.spaces.subtitle')}
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateSpace(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('settings.spaces.createBtn')}
                </button>
              </div>
              <div className="space-y-3">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{space.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {space.type === 'FAMILY' ? t('header.spaceType.family') : t('header.spaceType.personal')} ·{' '}
                        {space.currency || 'VND'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentSpace(space);
                        toast.success(`${t('settings.spaces.selectedSuccess')}: "${space.name}"`);
                      }}
                      className="text-sm text-primary hover:text-primary-dark font-medium px-2 py-1"
                    >
                      {t('common.select')}
                    </button>
                    <button
                      onClick={() => handleDeleteSpace(space)}
                      className="text-sm text-danger hover:text-danger-dark font-medium px-2 py-1"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                ))}
                {spaces.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">{t('settings.spaces.empty')}</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Appearance & Language */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t('settings.appearance.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('settings.appearance.subtitle')}
                </p>
              </div>

              {/* Theme Selection */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {t('settings.appearance.themeTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('settings.appearance.themeDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Light Card */}
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`relative p-4 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${
                      theme === 'light'
                        ? 'border-primary bg-primary/5 text-gray-900'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{t('settings.appearance.light')}</div>
                      <div className="text-xs text-gray-500">Light background</div>
                    </div>
                    {theme === 'light' && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>

                  {/* Dark Card */}
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`relative p-4 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${
                      theme === 'dark'
                        ? 'border-primary bg-primary/10 text-gray-100'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-900/60 text-indigo-400 flex items-center justify-center shrink-0">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{t('settings.appearance.dark')}</div>
                      <div className="text-xs text-gray-400">Dark background</div>
                    </div>
                    {theme === 'dark' && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {t('settings.appearance.langTitle')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('settings.appearance.langDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Vietnamese Card */}
                  <button
                    type="button"
                    onClick={() => void setLanguage('vi')}
                    className={`relative p-4 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${
                      currentLang === 'vi'
                        ? 'border-primary bg-primary/5 text-gray-900 dark:text-gray-100'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-base shrink-0">
                      🇻🇳
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{t('settings.appearance.vietnamese')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Tiếng Việt mặc định</div>
                    </div>
                    {currentLang === 'vi' && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>

                  {/* English Card */}
                  <button
                    type="button"
                    onClick={() => void setLanguage('en')}
                    className={`relative p-4 rounded-xl border-2 flex items-center gap-3 text-left transition-all ${
                      currentLang === 'en'
                        ? 'border-primary bg-primary/10 text-gray-100'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-base shrink-0">
                      🇬🇧
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{t('settings.appearance.english')}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">English Language</div>
                    </div>
                    {currentLang === 'en' && (
                      <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal create space */}
      <Modal
        open={showCreateSpace}
        onClose={() => setShowCreateSpace(false)}
        title={t('settings.spaces.createTitle')}
      >
        <form onSubmit={handleCreateSpace} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.spaces.name')} *
            </label>
            <input
              type="text"
              value={spaceForm.name}
              onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
              className="input"
              placeholder={t('settings.spaces.namePlaceholder')}
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('settings.spaces.description')}
            </label>
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
              {creatingSpace ? t('common.loading') : t('common.create')}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateSpace(false)}
              className="btn btn-secondary flex-1"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
