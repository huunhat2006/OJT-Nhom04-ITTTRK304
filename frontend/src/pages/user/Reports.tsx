// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSpaceStore } from '../../store/spaceStore';
import api from '../../lib/axios';
import { ReportData } from '../../types';
import { formatCurrency, getMonthName } from '../../lib/utils';
import toast from 'react-hot-toast';

const COLORS = ['#5B4FFF', '#2DD4BF', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#F97316'];

export default function Reports() {
  const { currentSpace } = useSpaceStore();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (currentSpace && startDate && endDate) fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpace, startDate, endDate]);

  const fetchReport = async () => {
    if (!currentSpace) return;
    try {
      setLoading(true);
      const response = await api.get<ReportData>(
        `/reports?spaceId=${currentSpace.id}&startDate=${startDate}&endDate=${endDate}`
      );
      setReportData(response.data);
    } catch {
      toast.error('Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!currentSpace) return;
    try {
      const { data } = await api.get(
        `/reports/export-excel?spaceId=${currentSpace.id}&startDate=${startDate}&endDate=${endDate}`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(
        new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `BaoCaoThuChi_${startDate}_${endDate}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất file Excel');
    } catch {
      toast.error('Không thể xuất Excel');
    }
  };

  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Vui lòng chọn không gian tài chính</p>
      </div>
    );
  }

  const netSavings = (reportData?.totalBalance ?? 0) || ((reportData?.totalIncome || 0) - (reportData?.totalExpense || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Báo cáo tài chính</h1>
          <p className="text-gray-500 mt-1">Phân tích chi tiết tình hình tài chính</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tổng thu nhập</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(Number(reportData?.totalIncome || 0))}
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-danger/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-danger" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tổng chi tiêu</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(Number(reportData?.totalExpense || 0))}
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tiết kiệm ròng</div>
                  <div
                    className={`text-2xl font-bold ${netSavings >= 0 ? 'text-success' : 'text-danger'}`}
                  >
                    {formatCurrency(netSavings)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Chi tiêu theo danh mục</h2>
              {(reportData?.expenseByCategory || []).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-16">Không có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData!.expenseByCategory}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => entry.categoryName}
                    >
                      {reportData!.expenseByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Xu hướng theo kỳ</h2>
              {(reportData?.trends || []).length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-16">Không có dữ liệu</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData!.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="income" fill="#2DD4BF" name="Thu nhập" />
                    <Bar dataKey="expense" fill="#EF4444" name="Chi tiêu" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Monthly summary table */}
          {reportData?.monthlySummaries && reportData.monthlySummaries.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tổng hợp theo tháng</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Tháng</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Thu nhập</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Chi tiêu</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Số dư</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlySummaries.map((m, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {getMonthName(m.month)}/{m.year}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-success font-medium">
                          {formatCurrency(Number(m.income))}
                        </td>
                        <td className="py-3 px-4 text-right text-sm text-danger font-medium">
                          {formatCurrency(Number(m.expense))}
                        </td>
                        <td
                          className={`py-3 px-4 text-right text-sm font-medium ${
                            Number(m.balance) >= 0 ? 'text-success' : 'text-danger'
                          }`}
                        >
                          {formatCurrency(Number(m.balance))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Category details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết theo danh mục chi</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Danh mục</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Số tiền</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">% Tổng chi</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportData?.expenseByCategory || []).map((cat, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-4 flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-900">
                          {cat.categoryNameVi || cat.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(Number(cat.amount))}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {Number(cat.percentage).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                  {(reportData?.expenseByCategory || []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
