// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Users, UserPlus, Home, ArrowLeftRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/axios';
import { AdminDashboard as AdminDashboardType } from '../../types';
import { formatNumber } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<AdminDashboardType | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get<AdminDashboardType>('/admin/dashboard');
      setDashboard(response.data);
    } catch {
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Tổng người dùng',
      value: formatNumber(dashboard?.totalUsers || 0),
      sub: `+${formatNumber(dashboard?.newUsersThisMonth || 0)} tháng này`,
      icon: Users,
      iconClass: 'bg-primary/10 text-primary',
    },
    {
      label: 'Người dùng hoạt động',
      value: formatNumber(dashboard?.activeUsers || 0),
      sub: `${dashboard?.totalUsers ? Math.round(((dashboard.activeUsers || 0) / dashboard.totalUsers) * 100) : 0}% tổng số`,
      icon: UserPlus,
      iconClass: 'bg-success/10 text-success',
    },
    {
      label: 'Không gian tài chính',
      value: formatNumber(dashboard?.totalSpaces || 0),
      sub: `${formatNumber(dashboard?.familySpaces || 0)} nhóm gia đình`,
      icon: Home,
      iconClass: 'bg-warning/10 text-warning',
    },
    {
      label: 'Giao dịch tháng này',
      value: formatNumber(dashboard?.totalTransactionsThisMonth || 0),
      sub: 'Theo dõi hệ thống',
      icon: ArrowLeftRight,
      iconClass: 'bg-danger/10 text-danger',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Tổng quan hệ thống</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${s.iconClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">{s.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User registration trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Đăng ký người dùng (6 tháng)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboard?.userRegistrationTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#5B4FFF"
                  strokeWidth={2}
                  dot={{ fill: '#5B4FFF', r: 4 }}
                  name="Đăng ký"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction trend */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Giao dịch (6 tháng)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboard?.transactionTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2DD4BF"
                  strokeWidth={2}
                  dot={{ fill: '#2DD4BF', r: 4 }}
                  name="Giao dịch"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
