// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuthStore();

  return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hồ sơ cá nhân</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Xem và quản lý thông tin tài khoản của bạn</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.fullName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Vai trò</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Tên người dùng</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Ngày tham gia</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {user?.createdAt ? formatDate(user.createdAt) : 'Gần đây'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <Link
                to="/settings"
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-hover transition-colors"
            >
              Chỉnh sửa cài đặt
            </Link>
          </div>
        </div>
      </div>
  );
}