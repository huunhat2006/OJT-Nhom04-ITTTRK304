// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Plus, Target, TrendingUp, Pencil, Trash2, Wallet, XCircle } from 'lucide-react';
import { useSpaceStore } from '../../store/spaceStore';
import api from '../../lib/axios';
import { SavingsGoal } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '',
  description: '',
  targetAmount: '',
  initialAmount: '',
  startDate: new Date().toISOString().split('T')[0],
  deadline: '',
};

export default function Goals() {
  const { currentSpace } = useSpaceStore();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [showAddAmount, setShowAddAmount] = useState<SavingsGoal | null>(null);
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    if (currentSpace) fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpace]);

  const fetchGoals = async () => {
    if (!currentSpace) return;
    try {
      setLoading(true);
      const { data } = await api.get<SavingsGoal[]>(`/savings-goals?spaceId=${currentSpace.id}`);
      setGoals(data);
    } catch {
      toast.error('Không thể tải danh sách mục tiêu');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Đã đạt';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return 'Đang thực hiện';
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    setForm({
      name: g.name,
      description: g.description || '',
      targetAmount: String(g.targetAmount),
      initialAmount: '',
      startDate: g.startDate || new Date().toISOString().split('T')[0],
      deadline: g.deadline || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpace) return;
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên mục tiêu');
      return;
    }
    if (!form.targetAmount || Number(form.targetAmount) <= 0) {
      toast.error('Số tiền mục tiêu phải lớn hơn 0');
      return;
    }
    if (!form.startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        spaceId: currentSpace.id,
        name: form.name,
        description: form.description,
        targetAmount: Number(form.targetAmount),
        initialAmount: form.initialAmount ? Number(form.initialAmount) : undefined,
        startDate: form.startDate,
        deadline: form.deadline || undefined,
      };
      if (editing) {
        await api.put(`/savings-goals/${editing.id}`, payload);
        toast.success('Đã cập nhật mục tiêu');
      } else {
        await api.post('/savings-goals', payload);
        toast.success('Đã tạo mục tiêu');
      }
      setShowForm(false);
      fetchGoals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu mục tiêu');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddAmount) return;
    if (!addAmount || Number(addAmount) <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    try {
      await api.patch(`/savings-goals/${showAddAmount.id}/amount`, {
        amount: Number(addAmount),
      });
      toast.success('Đã cập nhật số tiền tiết kiệm');
      setShowAddAmount(null);
      setAddAmount('');
      fetchGoals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật');
    }
  };

  const handleCancel = async (g: SavingsGoal) => {
    if (!confirm('Hủy mục tiêu này?')) return;
    try {
      await api.patch(`/savings-goals/${g.id}/cancel`);
      toast.success('Đã hủy mục tiêu');
      fetchGoals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể hủy');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa mục tiêu này?')) return;
    try {
      await api.delete(`/savings-goals/${id}`);
      toast.success('Đã xóa mục tiêu');
      fetchGoals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa');
    }
  };

  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Vui lòng chọn không gian tài chính</p>
      </div>
    );
  }

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount), 0);
  const activeGoals = goals.filter((g) => g.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mục tiêu tiết kiệm</h1>
          <p className="text-gray-500 mt-1">Theo dõi và quản lý mục tiêu tiết kiệm</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Thêm mục tiêu
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Mục tiêu đang thực hiện</div>
              <div className="text-2xl font-bold text-gray-900">{activeGoals}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Tổng đã tiết kiệm</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalSaved)}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-warning" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Tổng mục tiêu</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalTarget)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Goals list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="col-span-full text-center py-12 card">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có mục tiêu tiết kiệm nào</p>
            <button onClick={openCreate} className="btn btn-primary mt-4">
              Tạo mục tiêu đầu tiên
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = Number(goal.progressPercentage);
            return (
              <div key={goal.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{goal.name}</h3>
                    {goal.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{goal.description}</p>
                    )}
                  </div>
                  <span className={`badge ${getStatusColor(goal.status)}`}>
                    {getStatusText(goal.status)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đã tiết kiệm</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(Number(goal.currentAmount))}
                    </span>
                  </div>

                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-success h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-gray-700">
                      {progress}%
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mục tiêu</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(Number(goal.targetAmount))}
                    </span>
                  </div>

                  {goal.deadline && (
                    <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                      <span className="text-gray-600">Hạn chót</span>
                      <span className="font-medium text-gray-900">{formatDate(goal.deadline)}</span>
                    </div>
                  )}
                </div>

                {goal.status === 'IN_PROGRESS' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setShowAddAmount(goal);
                        setAddAmount('');
                      }}
                      className="btn btn-primary flex-1 flex items-center justify-center gap-1"
                    >
                      <Wallet className="w-4 h-4" />
                      Thêm tiền
                    </button>
                    <button
                      onClick={() => openEdit(goal)}
                      className="btn btn-secondary px-3"
                      title="Sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCancel(goal)}
                      className="btn btn-secondary px-3"
                      title="Hủy mục tiêu"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="btn btn-secondary px-3 text-danger"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {goal.status !== 'IN_PROGRESS' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-sm text-danger hover:text-danger-dark flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Sửa mục tiêu' : 'Thêm mục tiêu'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên mục tiêu *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Mua xe, du lịch..."
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
              rows={2}
              maxLength={500}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền mục tiêu *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              className="input"
              placeholder="0"
            />
          </div>
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền ban đầu</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.initialAmount}
                onChange={(e) => setForm({ ...form, initialAmount: e.target.value })}
                className="input"
                placeholder="0"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hạn chót</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="input"
              />
            </div>
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

      {/* Add amount modal */}
      <Modal
        open={!!showAddAmount}
        onClose={() => setShowAddAmount(null)}
        title={`Thêm tiền — ${showAddAmount?.name || ''}`}
      >
        <form onSubmit={handleAddAmount} className="space-y-4">
          <div className="text-sm text-gray-600">
            Hiện tại: <strong>{formatCurrency(Number(showAddAmount?.currentAmount || 0))}</strong> /{' '}
            {formatCurrency(Number(showAddAmount?.targetAmount || 0))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="input"
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1">
              Cập nhật
            </button>
            <button type="button" onClick={() => setShowAddAmount(null)} className="btn btn-secondary flex-1">
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
