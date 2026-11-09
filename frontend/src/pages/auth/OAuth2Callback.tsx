// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { AuthResponse } from '../../types';

/**
 * Trang callback sau khi Google OAuth2 redirect về.
 * Backend redirect về /oauth2/callback?token=...&refreshToken=...
 * hoặc /oauth2/callback?error=... nếu thất bại.
 */
export default function OAuth2Callback() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const error = params.get('error');

    if (error) {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
      navigate('/login');
      return;
    }

    if (!token) {
      toast.error('Không nhận được token từ Google.');
      navigate('/login');
      return;
    }

    // Lấy thông tin user từ backend bằng token vừa nhận
    api.get<AuthResponse['userId'] extends number ? any : any>('/auth/me', {
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
            role: userData.role,
            isActive: userData.isActive ?? true,
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
  }, [login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-success/5 to-primary/5">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Đang xác thực với Google...</p>
      </div>
    </div>
  );
}
