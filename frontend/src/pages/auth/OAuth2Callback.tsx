// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { AuthResponse } from '../../types';

export default function OAuth2Callback() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [otpRequired, setOtpRequired] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const error = params.get('error');
    const isOtp = params.get('otpRequired');
    const sessId = params.get('sessionId');
    const mail = params.get('email');

    if (error) {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
      navigate('/login');
      return;
    }

    // Nếu cần xác thực mã OTP gửi về Email
    if (isOtp === 'true' && sessId) {
      setOtpRequired(true);
      setSessionId(sessId);
      if (mail) setEmail(mail);
      return;
    }

    // Trường hợp token trực tiếp (fallback)
    if (token) {
      handleCompleteLogin(token, refreshToken);
      return;
    }

    toast.error('Không nhận được thông tin đăng nhập.');
    navigate('/login');
  }, [navigate]);

  const handleCompleteLogin = (token: string, refreshToken?: string | null) => {
    api
      .get<any>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const userData = res.data;
        login(
          {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName,
            avatarUrl: userData.avatarUrl,
            phone: userData.phone,
            role: userData.role,
            isActive: userData.isActive ?? true,
            hasPassword: userData.hasPassword ?? false,
            createdAt: userData.createdAt ?? '',
          },
          token,
          refreshToken ?? undefined
        );
        toast.success('Đăng nhập Google thành công!');
        if (userData.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      })
      .catch(() => {
        toast.error('Xác thực thất bại. Vui lòng thử lại.');
        navigate('/login');
      });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/verify-otp', {
        sessionId,
        otp,
      });
      const data = res.data;
      handleCompleteLogin(data.accessToken, data.refreshToken);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { sessionId });
      toast.success('Đã gửi lại mã OTP về email của bạn!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại mã OTP');
    } finally {
      setResending(false);
    }
  };

  if (otpRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🛡️
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Xác thực OTP 2 lớp</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Chúng tôi đã gửi mã 6 chữ số đến email: <br />
              <strong className="text-gray-800 dark:text-gray-200">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
                Nhập mã xác thực OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                className="w-full text-center tracking-[12px] text-3xl font-mono py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium hover:from-indigo-700 hover:to-violet-700 transition shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              {loading ? 'Đang kiểm tra...' : 'Xác nhận đăng nhập'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              disabled={resending}
              onClick={handleResendOtp}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {resending ? 'Đang gửi...' : 'Chưa nhận được mã? Gửi lại'}
            </button>
            <div>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← Quay lại trang đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-success/5 to-primary/5">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Đang xác thực với Google...</p>
      </div>
    </div>
  );
}
