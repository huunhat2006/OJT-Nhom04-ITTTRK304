// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import api from '../../lib/axios';
import { NotificationItem, PageResponse } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get<PageResponse<NotificationItem>>('/notifications?page=0&size=20');
      setNotifications(res.data.content);
    } catch {
      toast.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleReadAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu đã đọc tất cả');
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thông báo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Danh sách các thông báo trong hệ thống</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleReadAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      <div className="card divide-y divide-gray-100 dark:divide-gray-800">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>Không có thông báo mới nào</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start gap-4 transition-colors ${
                !n.isRead ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</h3>
                  <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
