// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Plus, TrendingUp, Pencil, Trash2 } from 'lucide-react';
import { useSpaceStore } from '../../store/spaceStore';
import api from '../../lib/axios';
import { Budget as BudgetType, Category } from '../../types';
import { formatCurrency } from '../../lib/utils';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const emptyForm = {
  categoryId: '',
  amount: '',
  warningThreshold: '80',
};

export default function Budget() {
  const { currentSpace } = useSpaceStore();
  const [budgets, setBudgets] = useState<BudgetType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BudgetType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentSpace) {
      fetchBudgets();
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpace, month, year]);

  const fetchBudgets = async () => {
    if (!currentSpace) return;
    try {
      setLoading(true);
      const { data } = await api.get<BudgetType[]>(
        `/budgets?spaceId=${currentSpace.id}&month=${month}&year=${year}`
      );
      setBudgets(data);
    } catch {
      toast.error('Không thể tải danh sách ngân sách');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get<Category[]>('/categories?type=EXPENSE');
      setCategories(data);
    } catch {
      // ignore
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (b: BudgetType) => {
    setEditing(b);
    setForm({
      categoryId: b.category?.id?.toString() || '',
      amount: String(b.amount),
      warningThreshold: String(b.warningThreshold ?? 80),
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpace) return;
    if (!form.categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Ngân sách phải lớn hơn 0');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        spaceId: currentSpace.id,
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
        month,
        year,
        warningThreshold: Number(form.warningThreshold) || 80,
      };
      if (editing) {
        await api.put(`/budgets/${editing.id}`, payload);
        toast.success('Đã cập nhật ngân sách');
      } else {
        await api.post('/budgets', payload);
        toast.success('Đã tạo ngân sách');
      }
      setShowForm(false);
      fetchBudgets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu ngân sách');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa ngân sách này?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Đã xóa ngân sách');
      fetchBudgets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa ngân sách');
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'EXCEEDED') return 'text-danger bg-danger/10';
    if (status === 'WARNING') return 'text-warning bg-warning/10';
    return 'text-success bg-success/10';
  };

  const getProgressColor = (status: string) => {
    if (status === 'EXCEEDED') return 'bg-danger';
    if (status === 'WARNING') return 'bg-warning';
    return 'bg-success';
  };

  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Vui lòng chọn không gian tài chính</p>
      </div>
    );
  }

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);

  const usedCategoryIds = budgets.map((b) => b.category?.id);
  const availableCategories = categories.filter((c) => !usedCategoryIds.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ngân sách</h1>
          <p className="text-gray-500 mt-1">Quản lý ngân sách theo danh mục</p>
        </div>
        <div className="flex gap-3">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="input">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="input">
            {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Thêm ngân sách
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Tổng ngân sách</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-danger/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-danger" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Đã chi tiêu</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Còn lại</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalBudget - totalSpent)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : budgets.length === 0 ? (
          <div className="col-span-2 text-center py-12 card">
            <p className="text-gray-500 mb-4">Chưa có ngân sách nào cho tháng này</p>
            <button onClick={openCreate} className="btn btn-primary">
              Tạo ngân sách
            </button>
          </div>
        ) : (
          budgets.map((budget) => {
            const percent = Number(budget.usagePercentage);
            return (
              <div key={budget.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-xl">{budget.category?.icon || '💰'}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {budget.category?.nameVi || budget.category?.name || 'Danh mục'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Tháng {budget.month}/{budget.year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(budget.status)}`}>
                      {percent}%
                    </span>
                    <button
                      onClick={() => openEdit(budget)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      title="Sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-danger"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đã chi</span>
                    <span className="font-medium text-gray-900">{formatCurrency(Number(budget.spent))}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${getProgressColor(budget.status)}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ngân sách</span>
                    <span className="font-medium text-gray-900">{formatCurrency(Number(budget.amount))}</span>
                  </div>
                </div>

                {percent >= 80 && (
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      percent >= 100 ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {percent >= 100 ? '⚠️ Đã vượt ngân sách!' : '⚠️ Sắp vượt ngân sách'}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Sửa ngân sách' : 'Thêm ngân sách'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="input"
              disabled={!!editing}
            >
              <option value="">Chọn danh mục chi tiêu</option>
              {(editing
                ? categories
                : availableCategories
              ).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameVi || c.name}
                </option>
              ))}
            </select>
            {editing && <p className="text-xs text-gray-500 mt-1">Không thể đổi danh mục</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số tiền ngân sách * (tháng {month}/{year})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngưỡng cảnh báo (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={form.warningThreshold}
              onChange={(e) => setForm({ ...form, warningThreshold: e.target.value })}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Từ 50% đến 100%</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
