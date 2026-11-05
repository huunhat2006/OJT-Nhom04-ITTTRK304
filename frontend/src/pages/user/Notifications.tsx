// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import api from '../../lib/axios';
import { NotificationItem, PageResponse } from '../../types';
import { formatRelativeTime, formatDateTime } from '../../lib/utils';

type FilterType = 'all' | 'unread' | 'read';

function getNotificationIcon(type: string) {
  const t = type?.toUpperCase() ?? '';
  if (t.includes('BUDGET_EXCEEDED') || t.includes('CRITICAL'))
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  if (t.includes('BUDGET') || t.includes('WARNING') || t.includes('SPENDING'))
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  if (t.includes('GOAL') || t.includes('COMPLETED') || t.includes('SUCCESS'))
    return <CheckCircle2 className="w-5 h-5 text-green-500" />;
  if (t.includes('TRANSACTION') || t.includes('INCOME'))
    return <TrendingUp className="w-5 h-5 text-indigo-500" />;
  if (t.includes('SYSTEM') || t.includes('INFO'))
    return <Info className="w-5 h-5 text-blue-500" />;
  return <Bell className="w-5 h-5 text-gray-400" />;
}

function getTypeLabel(type: string): string {
  const t = type?.toUpperCase() ?? '';
  if (t.includes('BUDGET_EXCEEDED')) return 'Vượt ngân sách';
  if (t.includes('BUDGET_WARNING')) return 'Cảnh báo ngân sách';
  if (t.includes('SPENDING_SPIKE')) return 'Chi tăng đột biến';
  if (t.includes('RAPID_SPENDING')) return 'Chi nhanh';
  if (t.includes('GOAL')) return 'Mục tiêu';
  if (t.includes('TRANSACTION')) return 'Giao dịch';
  if (t.includes('SYSTEM')) return 'Hệ thống';
  return 'Thông báo';
}

const PAGE_SIZE = 15;

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async (p = page, f = filter) => {
    setLoading(true);
    try {
      let url = `/notifications?page=${p}&size=${PAGE_SIZE}`;
      if (f === 'unread') url += '&isRead=false';
      if (f === 'read') url += '&isRead=true';
      const { data } = await api.get<PageResponse<NotificationItem>>(url);
      setNotifications(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page, filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(0);
  };

  const handleMarkOneRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadOnPage = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Thông báo
          </h1>
          <p className="text-gray-500 mt-1">
            {totalElements > 0 ? `${totalElements} thông báo` : 'Không có thông báo nào'}
          </p>
        </div>
        {unreadOnPage > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn btn-secondary flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            {markingAll ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="card p-1 flex gap-1">
        {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {f === 'all' ? 'Tất cả' : f === 'unread' ? 'Chưa đọc' : 'Đã đọc'}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <BellOff className="w-12 h-12 text-gray-200" />
            <p className="text-base font-medium">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Không có thông báo'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${n.isRead ? '' : 'bg-indigo-50/30'}`}
              >
                {/* Icon */}
                <div className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  {getNotificationIcon(n.type)}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkOneRead(n.id)}
                        className="shrink-0 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
                        aria-label="Đánh dấu đã đọc"
                      >
                        Đánh dấu đọc
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                      {getTypeLabel(n.type)}
                    </span>
                    <span className="text-[11px] text-gray-400" title={formatDateTime(n.createdAt)}>
                      {formatRelativeTime(n.createdAt)}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Trang {page + 1} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn btn-secondary flex items-center gap-1 px-3 py-2 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </button>
            {/* Page numbers (show up to 5 around current) */}
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => Math.abs(i - page) <= 2)
              .map((i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    i === page
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn btn-secondary flex items-center gap-1 px-3 py-2 text-sm disabled:opacity-40"
            >
              Sau
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
