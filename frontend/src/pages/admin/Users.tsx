// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle } from 'lucide-react';
import api from '../../lib/axios';
import { User, PageResponse } from '../../types';
import { formatDateTime } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState<PageResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    role: '',
    isActive: '',
    page: 0,
    size: 20,
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: filters.page.toString(),
        size: filters.size.toString(),
        ...(filters.keyword && { keyword: filters.keyword }),
        ...(filters.role && { role: filters.role }),
        ...(filters.isActive && { isActive: filters.isActive }),
      });

      const response = await api.get<PageResponse<User>>(
        `/admin/users?${params.toString()}`
      );
      setUsers(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-status`);
      toast.success('Đã cập nhật trạng thái người dùng');
      fetchUsers();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Quản lý người dùng hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={filters.keyword}
              onChange={(e) =>
                setFilters({ ...filters, keyword: e.target.value, page: 0 })
              }
              className="input pl-10"
            />
          </div>

          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 0 })}
            className="input"
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <select
            value={filters.isActive}
            onChange={(e) =>
              setFilters({ ...filters, isActive: e.target.value, page: 0 })
            }
            className="input"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button className="btn btn-secondary" onClick={() => fetchUsers()}>
            Làm mới
          </button>
        </div>
      </div>

      {/* Users Table */}
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
                      Người dùng
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Vai trò
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Trạng thái
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Ngày tạo
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users?.content.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-gray-500">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`badge ${
                            user.role === 'ADMIN' ? 'badge-danger' : 'badge-primary'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`badge ${
                            user.isActive ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`text-sm hover:underline ${
                            user.isActive ? 'text-danger' : 'text-success'
                          }`}
                        >
                          {user.isActive ? (
                            <span className="flex items-center gap-1">
                              <Ban className="w-4 h-4" />
                              Vô hiệu hóa
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" />
                              Kích hoạt
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {users && users.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Hiển thị {users.content.length} trên {users.totalElements} người dùng
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFilters({ ...filters, page: Math.max(0, filters.page - 1) })
                    }
                    disabled={users.pageNumber === 0}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        page: Math.min(users.totalPages - 1, filters.page + 1),
                      })
                    }
                    disabled={users.pageNumber >= users.totalPages - 1}
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
