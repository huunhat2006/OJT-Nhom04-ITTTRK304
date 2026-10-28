// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useSpaceStore } from '../../store/spaceStore';
import api from '../../lib/axios';
import { DashboardResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const COLORS = ['#5B4FFF', '#2DD4BF', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#F97316'];

export default function Overview() {
  const { currentSpace } = useSpaceStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);

  const currentDate = new Date();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  useEffect(() => {
    if (currentSpace) fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpace]);

  const fetchDashboard = async () => {
    if (!currentSpace) return;
    try {
      setLoading(true);
      const response = await api.get<DashboardResponse>(
        `/reports/dashboard?spaceId=${currentSpace.id}&month=${month}&year=${year}`
      );
      setDashboard(response.data);
    } catch {
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Vui lòng chọn không gian tài chính</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pieData = (dashboard?.expenseByCategory || []).slice(0, 6).map((c) => ({
    name: c.categoryNameVi || c.categoryName,
    value: Number(c.amount),
    color: c.color,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-gray-500 mt-1">
            Tháng {month}/{year} — {currentSpace.name}
          </p>
        </div>
        <Link to="/transactions" className="btn btn-primary">
          Xem giao dịch
        </Link>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-sm text-gray-600 mb-2">Số dư</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(Number(dashboard?.balance || 0))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-success">
              <ArrowUpRight className="w-4 h-4" />
              <span className="font-medium">{formatCurrency(Number(dashboard?.totalIncome || 0))}</span>
            </div>
            <span className="text-gray-400">thu</span>
            <div className="flex items-center gap-1 text-danger">
              <ArrowDownRight className="w-4 h-4" />
              <span className="font-medium">{formatCurrency(Number(dashboard?.totalExpense || 0))}</span>
            </div>
            <span className="text-gray-400">chi</span>
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600 mb-2">Tổng thu nhập</div>
          <div className="text-3xl font-bold text-success">
            {formatCurrency(Number(dashboard?.totalIncome || 0))}
          </div>
          <p className="text-xs text-gray-500 mt-4">Trong tháng {month}/{year}</p>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600 mb-2">Tổng chi tiêu</div>
          <div className="text-3xl font-bold text-danger">
            {formatCurrency(Number(dashboard?.totalExpense || 0))}
          </div>
          <p className="text-xs text-gray-500 mt-4">Trong tháng {month}/{year}</p>
        </div>
      </div>

      {/* Budget Warnings */}
      {dashboard?.budgetWarnings && dashboard.budgetWarnings.length > 0 && (
        <div className="card border border-warning/40 bg-warning/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-semibold text-gray-900">Cảnh báo ngân sách</h3>
          </div>
          <div className="space-y-2">
            {dashboard.budgetWarnings.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{b.category?.nameVi || b.category?.name || 'Danh mục'}</span>
                <span className={`font-medium ${b.status === 'EXCEEDED' ? 'text-danger' : 'text-warning'}`}>
                  {Number(b.usagePercentage)}% đã dùng
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Pie */}
        <div className="card lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiêu theo danh mục</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có chi tiêu trong tháng</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="space-y-2 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                />
                <span className="flex-1 text-gray-700 truncate">{entry.name}</span>
                <span className="font-medium text-gray-900">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Giao dịch gần đây</h2>
            <Link to="/transactions" className="text-sm text-primary hover:text-primary-dark">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {(dashboard?.recentTransactions || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Chưa có giao dịch nào</p>
            ) : (
              dashboard!.recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      t.type === 'INCOME' ? 'bg-success/10' : t.type === 'EXPENSE' ? 'bg-danger/10' : 'bg-primary/10'
                    }`}
                  >
                    <Wallet className={`w-5 h-5 ${t.type === 'INCOME' ? 'text-success' : t.type === 'EXPENSE' ? 'text-danger' : 'text-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {t.description || t.category?.nameVi || t.category?.name || 'Giao dịch'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t.userName} · {formatDate(t.transactionDate)}
                    </div>
                  </div>
                  <span
                    className={`font-medium whitespace-nowrap ${
                      t.type === 'INCOME' ? 'text-success' : t.type === 'EXPENSE' ? 'text-danger' : 'text-primary'
                    }`}
                  >
                    {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '-' : ''}
                    {formatCurrency(Number(t.amount))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Savings Goals */}
      {dashboard?.savingsGoals && dashboard.savingsGoals.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mục tiêu tiết kiệm</h2>
            <Link to="/goals" className="text-sm text-primary hover:text-primary-dark">
              Quản lý
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.savingsGoals.map((g) => (
              <div key={g.id} className="border border-gray-200 rounded-xl p-4">
                <div className="font-medium text-gray-900 mb-2">{g.name}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(Number(g.progressPercentage), 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{formatCurrency(Number(g.currentAmount))}</span>
                  <span>{formatCurrency(Number(g.targetAmount))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
