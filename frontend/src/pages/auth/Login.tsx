// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { AuthResponse } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    usernameOrEmail: '',
    password: '',
  });

  const validateForm = () => {
    const newErrors = {
      usernameOrEmail: '',
      password: '',
    };

    if (!formData.usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = 'Vui lòng nhập username hoặc email';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return !newErrors.usernameOrEmail && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/login', formData);
      login({
        id: response.data.userId,
        username: response.data.username,
        email: response.data.email,
        fullName: response.data.fullName,
        role: response.data.role,
        isActive: true,
        createdAt: '',
      }, response.data.accessToken, response.data.refreshToken);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Budgivee</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Welcome back</h1>
        <p className="text-gray-600 text-center mb-8">
          Sign in to continue to your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username or Email
            </label>
            <input
              type="text"
              value={formData.usernameOrEmail}
              onChange={(e) => handleChange('usernameOrEmail', e.target.value)}
              className={`input ${errors.usernameOrEmail ? 'border-danger focus:ring-danger' : ''}`}
              placeholder="Enter username or email"
            />
            {errors.usernameOrEmail && (
              <p className="mt-1 text-sm text-danger">{errors.usernameOrEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`input pr-10 ${errors.password ? 'border-danger focus:ring-danger' : ''}`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-danger">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
