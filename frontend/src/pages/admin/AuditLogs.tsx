// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import api from '../../lib/axios';
import { AuditLog, PageResponse } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const [logs, setLogs] = useState<PageResponse<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    page: 0,
    size: 20,
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page.toString(),
        size: filters.size.toString(),
        ...(filters.action && { action: filters.action }),
      });

      const response = await api.get<PageResponse<AuditLog>>(
        `/admin/audit-logs?${params.toString()}`
      );
      setLogs(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.startsWith('CREATE')) return 'badge-success';
    if (action.startsWith('UPDATE')) return 'badge-warning';
    if (action.startsWith('DELETE')) return 'badge-danger';
    return 'badge-primary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">
            Lịch sử hoạt động của admin trên hệ thống
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 0 })}
            className="input flex-1"
          >
            <option value="">Tất cả hành động</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="TOGGLE">TOGGLE</option>
          </select>
          <button className="btn btn-secondary" onClick={() => fetchLogs()}>
            Làm mới
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Admin
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Hành động
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Loại
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Chi tiết
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Thời gian
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.content.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
                            {log.adminFullName?.charAt(0) || log.adminUsername?.charAt(0) || 'A'}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {log.adminFullName || log.adminUsername}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.targetType}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-md truncate">
                        {log.description}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs && logs.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Hiển thị {logs.content.length} trên {logs.totalElements} logs
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFilters({ ...filters, page: Math.max(0, filters.page - 1) })
                    }
                    disabled={logs.pageNumber === 0}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        page: Math.min(logs.totalPages - 1, filters.page + 1),
                      })
                    }
                    disabled={logs.pageNumber >= logs.totalPages - 1}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
