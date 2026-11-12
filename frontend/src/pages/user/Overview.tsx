// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { TouchEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSpaceStore } from '../../store/spaceStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';
import { CategoryExpense, DashboardResponse, PageResponse, ReportData, Transaction } from '../../types';
import { formatCurrency, formatDate, getMonthName } from '../../lib/utils';
import { CategoryIcon } from '../../lib/categoryIcons';
import toast from 'react-hot-toast';

const COLORS = ['#5B4FFF', '#2DD4BF', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#F97316'];
const CHART_HEIGHT = 280;

interface DailyExpense {
  date: string;
  label: string;
  amount: number;
}

function useAnimatedValue(value: number) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const duration = 800;

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setAnimatedValue(value * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return animatedValue;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} aria-hidden="true" />;
}

function MetricCard({
  title,
  value,
  format,
  change,
  changeLabel,
  favorableWhenPositive = true,
}: {
  title: string;
  value: number;
  format: (value: number) => string;
  change: number | null;
  changeLabel: string;
  favorableWhenPositive?: boolean;
}) {
  const animatedValue = useAnimatedValue(value);
  const isPositive = change === null || change >= 0;
  const isFavorable = isPositive === favorableWhenPositive;
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="card p-4 sm:p-6">
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className="text-2xl sm:text-3xl font-bold text-gray-900">{format(animatedValue)}</div>
      <div className={`mt-4 flex items-center gap-1 text-sm ${isFavorable ? 'text-success' : 'text-danger'}`}>
        <ChangeIcon className="w-4 h-4 shrink-0" />
        <span className="font-medium">
          {change === null ? 'Mới' : `${Math.abs(change).toFixed(1)}${changeLabel}`}
        </span>
        <span className="text-gray-500">so với tháng trước</span>
      </div>
    </div>
  );
}

export default function Overview() {
  const { currentSpace, spaces } = useSpaceStore();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [previousDashboard, setPreviousDashboard] = useState<DashboardResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<ReportData['monthlySummaries']>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryExpense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const touchStartY = useRef<number | null>(null);
  const [year, month] = selectedMonth.split('-').map(Number);
  const hasCurrentSpace = !!currentSpace && spaces.some((space) => space.id === currentSpace.id);

  const fetchDashboard = useCallback(async (isRefresh = false, signal?: AbortSignal) => {
    if (!currentSpace) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setChartsLoading(true);
    }

    const previousDate = new Date(year, month - 2, 1);
    const previousMonth = previousDate.getMonth() + 1;
    const previousYear = previousDate.getFullYear();
    const monthlyStart = new Date(year, month - 6, 1);
    const monthlyEnd = new Date(year, month, 0);
    const dailyStart = new Date(monthlyEnd);
    dailyStart.setDate(dailyStart.getDate() - 29);
    const toDateParam = (date: Date) => {
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return localDate.toISOString().split('T')[0];
    };
    const dashboardParams = (selectedYear: number, selectedMonth: number) =>
      new URLSearchParams({
        spaceId: currentSpace.id.toString(),
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });

    try {
      const [currentResponse, previousResponse] = await Promise.all([
        api.get<DashboardResponse>(`/reports/dashboard?${dashboardParams(year, month)}`, { signal }),
        api.get<DashboardResponse>(`/reports/dashboard?${dashboardParams(previousYear, previousMonth)}`, { signal }),
      ]);
      setDashboard(currentResponse.data);
      setPreviousDashboard(previousResponse.data);
      setSelectedCategory(null);
    } catch {
      if (!signal?.aborted) toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }

    if (signal?.aborted) return;

    try {
      const monthlyParams = new URLSearchParams({
        spaceId: currentSpace.id.toString(),
        startDate: toDateParam(monthlyStart),
        endDate: toDateParam(monthlyEnd),
      });
      const dailyParams = new URLSearchParams({
        spaceId: currentSpace.id.toString(),
        type: 'EXPENSE',
        startDate: toDateParam(dailyStart),
        endDate: toDateParam(monthlyEnd),
        page: '0',
        size: '500',
      });
      const [reportResponse, transactionsResponse] = await Promise.all([
        api.get<ReportData>(`/reports?${monthlyParams}`, { signal }),
        api.get<PageResponse<Transaction>>(`/transactions?${dailyParams}`, { signal }),
      ]);
      const summaries = new Map(
        reportResponse.data.monthlySummaries.map((summary) => [
          `${summary.year}-${summary.month}`,
          summary,
        ])
      );
      setMonthlyData(
        Array.from({ length: 6 }, (_, index) => {
          const date = new Date(year, month - 6 + index, 1);
          const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          return summaries.get(key) || {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            income: 0,
            expense: 0,
            balance: 0,
          };
        })
      );

      const expensesByDay = new Map<string, number>();
      for (const transaction of transactionsResponse.data.content) {
        expensesByDay.set(
          transaction.transactionDate,
          (expensesByDay.get(transaction.transactionDate) || 0) + Number(transaction.amount)
        );
      }
      setDailyExpenses(
        Array.from({ length: 30 }, (_, index) => {
          const date = new Date(dailyStart);
          date.setDate(dailyStart.getDate() + index);
          const key = toDateParam(date);
          return {
            date: key,
            label: new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date),
            amount: expensesByDay.get(key) || 0,
          };
        })
      );
    } catch {
      if (!signal?.aborted) {
        setMonthlyData([]);
        setDailyExpenses([]);
        toast.error('Không thể tải dữ liệu biểu đồ');
      }
    } finally {
      if (!signal?.aborted) {
        setChartsLoading(false);
        setRefreshing(false);
      }
    }
  }, [currentSpace, month, year]);

  useEffect(() => {
    if (!hasCurrentSpace) {
      setDashboard(null);
      setLoading(false);
      setChartsLoading(false);
      return;
    }

    const controller = new AbortController();
    void fetchDashboard(false, controller.signal);
    return () => controller.abort();
  }, [fetchDashboard, hasCurrentSpace]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const scrollContainer = event.currentTarget.closest('main');
    touchStartY.current =
      window.innerWidth < 768 && scrollContainer?.scrollTop === 0
        ? event.touches[0].clientY
        : null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startY = touchStartY.current;
    touchStartY.current = null;
    const scrollContainer = event.currentTarget.closest('main');
    if (
      startY !== null &&
      window.innerWidth < 768 &&
      scrollContainer?.scrollTop === 0 &&
      event.changedTouches[0].clientY - startY > 64
    ) {
      void fetchDashboard(true);
    }
  };

  if (!hasCurrentSpace) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Vui lòng chọn không gian tài chính</p>
      </div>
    );
  }

  const pieData = (dashboard?.expenseByCategory || []).map((category) => ({
    ...category,
    name: category.categoryNameVi || category.categoryName,
    value: Number(category.amount),
  }));
  const totalIncome = Number(dashboard?.totalIncome || 0);
  const totalExpense = Number(dashboard?.totalExpense || 0);
  const previousIncome = Number(previousDashboard?.totalIncome || 0);
  const previousExpense = Number(previousDashboard?.totalExpense || 0);
  const balance = totalIncome - totalExpense;
  const previousBalance = previousIncome - previousExpense;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  const previousSavingsRate = previousIncome > 0 ? (previousBalance / previousIncome) * 100 : 0;
  const percentageChange = (current: number, previous: number) =>
    previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / Math.abs(previous)) * 100;
  const topCategories = [...pieData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const expenseTotal = pieData.reduce((sum, category) => sum + category.value, 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1)
  );

  return (
    <div className="space-y-5 sm:space-y-6" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {refreshing && (
        <div className="flex items-center justify-center gap-2 text-sm text-primary" role="status">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Đang làm mới...
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm sm:text-base font-medium text-primary">{greeting}, {user?.fullName || 'bạn'}!</p>
          <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
          <p className="text-gray-500 mt-1">{monthLabel} — {currentSpace.name}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="sr-only" htmlFor="dashboard-month">Chọn tháng</label>
          <input
            id="dashboard-month"
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              if (event.target.value) setSelectedMonth(event.target.value);
            }}
            className="input min-w-0 py-2"
            aria-label="Chọn tháng xem dashboard"
          />
          <Link to="/budget?action=create" className="btn btn-secondary flex items-center justify-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Đặt ngân sách
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {loading ? (
          Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="card p-4 sm:p-6 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))
        ) : (
          <>
            <MetricCard
              title="Tổng thu nhập"
              value={totalIncome}
              format={formatCurrency}
              change={percentageChange(totalIncome, previousIncome)}
              changeLabel="%"
            />
            <MetricCard
              title="Tổng chi tiêu"
              value={totalExpense}
              format={formatCurrency}
              change={percentageChange(totalExpense, previousExpense)}
              changeLabel="%"
              favorableWhenPositive={false}
            />
            <MetricCard
              title="Số dư ròng"
              value={balance}
              format={formatCurrency}
              change={percentageChange(balance, previousBalance)}
              changeLabel="%"
            />
            <MetricCard
              title="Tỷ lệ tiết kiệm"
              value={savingsRate}
              format={(value) => `${value.toFixed(1)}%`}
              change={savingsRate - previousSavingsRate}
              changeLabel=" điểm %"
            />
          </>
        )}
      </div>

      {/* Budget Warnings */}
      {loading ? (
        <div className="card space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ) : dashboard?.budgetWarnings && dashboard.budgetWarnings.length > 0 && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiêu theo danh mục</h2>
          {chartsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : pieData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có chi tiêu trong tháng</p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      isAnimationActive
                      animationDuration={800}
                      onClick={(entry: { payload?: CategoryExpense }) => {
                        if (entry.payload) setSelectedCategory(entry.payload);
                      }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.categoryId}
                          fill={entry.color || COLORS[index % COLORS.length]}
                          stroke={selectedCategory?.categoryId === entry.categoryId ? '#111827' : '#fff'}
                          strokeWidth={selectedCategory?.categoryId === entry.categoryId ? 3 : 1}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name, item) => [
                        formatCurrency(value),
                        item.payload?.categoryNameVi || item.payload?.categoryName || 'Chi tiêu',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {selectedCategory && (
                <div className="mt-2 rounded-lg bg-gray-50 p-3" role="status">
                  <div className="font-medium text-gray-900">
                    {selectedCategory.categoryNameVi || selectedCategory.categoryName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(Number(selectedCategory.amount))} · {Number(selectedCategory.percentage).toFixed(1)}% tổng chi
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Thu và chi 6 tháng</h2>
          {chartsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(value, index) => getMonthName(monthlyData[index]?.month || value)} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} width={48} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="#2DD4BF" name="Thu nhập" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
                <Bar dataKey="expense" fill="#EF4444" name="Chi tiêu" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Xu hướng chi tiêu 30 ngày</h2>
          {chartsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <LineChart data={dailyExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={6} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} width={48} />
                <Tooltip
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
                  formatter={(value: number) => [formatCurrency(value), 'Chi tiêu']}
                />
                <Line type="monotone" dataKey="amount" name="Chi tiêu" stroke="#5B4FFF" strokeWidth={2} dot={false} activeDot={{ r: 5 }} isAnimationActive animationDuration={800} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 chi tiêu</h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
            </div>
          ) : topCategories.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có chi tiêu trong tháng</p>
          ) : (
            <div className="space-y-4">
              {topCategories.map((category, index) => {
                const share = expenseTotal > 0 ? (category.value / expenseTotal) * 100 : 0;
                return (
                  <div key={category.categoryId} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                    >
                      <CategoryIcon icon={category.icon} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-gray-800">{category.name}</span>
                        <span className="shrink-0 text-gray-600">{formatCurrency(category.value)}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${share}%`,
                            backgroundColor: category.color || COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card md:col-span-1 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Giao dịch gần đây</h2>
            <Link to="/transactions" className="text-sm text-primary hover:text-primary-dark">
              Xem tất cả
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-10 w-10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (dashboard?.recentTransactions || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Chưa có giao dịch nào</p>
            ) : (
              <div className="space-y-3">
              {dashboard!.recentTransactions.slice(0, 5).map((t) => (
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
              ))}
              </div>
            )}
        </div>
      </div>

      {/* Savings Goals */}
      {loading ? (
        <div className="card space-y-4">
          <Skeleton className="h-5 w-44" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-3 rounded-xl border border-gray-100 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : dashboard?.savingsGoals && dashboard.savingsGoals.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Mục tiêu tiết kiệm</h2>
            <Link to="/goals" className="text-sm text-primary hover:text-primary-dark">
              Quản lý
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
