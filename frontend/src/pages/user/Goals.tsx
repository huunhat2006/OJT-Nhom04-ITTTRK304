// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Plus, Target, TrendingUp, Pencil, Trash2, Wallet, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useSpaceStore } from '../../store/spaceStore';
import api from '../../lib/axios';
import { SavingsGoal, Wallet as WalletType, Category, RecurringTransaction, RecurringFrequency } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: 'Hằng ngày',
  WEEKLY: 'Hằng tuần',
  MONTHLY: 'Hằng tháng',
  QUARTERLY: 'Hằng quý',
  YEARLY: 'Hằng năm',
};

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

  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);

  const [showAddAmount, setShowAddAmount] = useState<SavingsGoal | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [addWalletId, setAddWalletId] = useState('');

  // Tự động tích lũy định kỳ modal state
  const [showAutoRecurring, setShowAutoRecurring] = useState<SavingsGoal | null>(null);
  const [autoAmount, setAutoAmount] = useState('');
  const [autoWalletId, setAutoWalletId] = useState('');
  const [autoFrequency, setAutoFrequency] = useState<RecurringFrequency>('MONTHLY');
  const [autoStartDate, setAutoStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingAuto, setSavingAuto] = useState(false);

  useEffect(() => {
    if (currentSpace) {
      fetchGoals();
      fetchWallets();
      fetchCategories();
      fetchRecurring();
    }
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

  const fetchWallets = async () => {
    if (!currentSpace) return;
    try {
      const { data } = await api.get<WalletType[]>(`/wallets?spaceId=${currentSpace.id}`);
      setWallets(data.filter((w) => w.isActive !== false));
    } catch {
      // ignore
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch {
      // ignore
    }
  };

  const fetchRecurring = async () => {
    if (!currentSpace) return;
    try {
      const { data } = await api.get<RecurringTransaction[]>(
        `/recurring-transactions?spaceId=${currentSpace.id}`
      );
      setRecurringList(data);
    } catch {
      // ignore
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
    if (!showAddAmount || !currentSpace) return;
    if (!addAmount || Number(addAmount) <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    if (!addWalletId) {
      toast.error('Vui lòng chọn ví để trừ tiền');
      return;
    }
    const selectedWallet = wallets.find((w) => w.id === Number(addWalletId));
    if (selectedWallet && Number(addAmount) > selectedWallet.balance) {
      toast.error(`Số dư ví "${selectedWallet.name}" không đủ`);
      return;
    }

    // Find the "Savings" category
    const savingsCategory = categories.find(
      (c) => c.name === 'Savings' || c.nameVi === 'Tiết kiệm'
    );
    if (!savingsCategory) {
      toast.error('Không tìm thấy danh mục Tiết kiệm trong hệ thống');
      return;
    }

    try {
      // 1. Update savings goal amount
      await api.patch(`/savings-goals/${showAddAmount.id}/amount`, {
        amount: Number(addAmount),
      });

      // 2. Create an EXPENSE transaction to deduct from the selected wallet
      await api.post('/transactions', {
        spaceId: currentSpace.id,
        walletId: Number(addWalletId),
        categoryId: savingsCategory.id,
        type: 'EXPENSE',
        amount: Number(addAmount),
        description: `Tiết kiệm: ${showAddAmount.name}`,
        transactionDate: new Date().toISOString().split('T')[0],
        note: `Đóng góp vào mục tiêu "${showAddAmount.name}"`,
      });

      toast.success('Đã cập nhật tiết kiệm và tạo giao dịch');
      setShowAddAmount(null);
      setAddAmount('');
      setAddWalletId('');
      fetchGoals();
      fetchWallets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật');
    }
  };

  const openAutoRecurringModal = (g: SavingsGoal) => {
    setShowAutoRecurring(g);
    setAutoAmount('');
    setAutoWalletId(wallets.length > 0 ? String(wallets[0].id) : '');
    setAutoFrequency('MONTHLY');
    setAutoStartDate(new Date().toISOString().split('T')[0]);
  };

  const handleCreateAutoRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAutoRecurring || !currentSpace) return;
    if (!autoAmount || Number(autoAmount) <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!autoWalletId) {
      toast.error('Vui lòng chọn ví để trích tiền');
      return;
    }

    const savingsCat = categories.find(
      (c) => c.name === 'Savings' || c.nameVi === 'Tiết kiệm'
    );

    setSavingAuto(true);
    try {
      await api.post('/recurring-transactions', {
        spaceId: currentSpace.id,
        savingsGoalId: showAutoRecurring.id,
        walletId: Number(autoWalletId),
        categoryId: savingsCat ? savingsCat.id : undefined,
        amount: Number(autoAmount),
        frequency: autoFrequency,
        startDate: autoStartDate,
        type: 'EXPENSE',
        description: `Tích lũy: ${showAutoRecurring.name}`,
      });
      toast.success(`Đã kích hoạt tự động tích lũy định kỳ cho "${showAutoRecurring.name}"!`);
      setShowAutoRecurring(null);
      fetchRecurring();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thiết lập tự động nạp');
    } finally {
      setSavingAuto(false);
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
            const activeAuto = recurringList.filter(
              (r) => r.savingsGoalId === goal.id && r.status === 'ACTIVE'
            );
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

                  {activeAuto.length > 0 && (
                    <div className="pt-2">
                      <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-800">
                        <div className="flex items-center gap-1.5 font-medium">
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Tự động:</span>
                          <span className="font-bold text-emerald-950">{formatCurrency(activeAuto[0].amount)}</span>
                          <span>/ {FREQUENCY_LABELS[activeAuto[0].frequency]}</span>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-mono">
                          {formatDate(activeAuto[0].nextRunDate)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {goal.status === 'IN_PROGRESS' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setShowAddAmount(goal);
                        setAddAmount('');
                        setAddWalletId('');
                      }}
                      className="btn btn-primary flex-1 flex items-center justify-center gap-1 text-xs py-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Nạp tiền
                    </button>
                    <button
                      onClick={() => openAutoRecurringModal(goal)}
                      className="btn btn-secondary flex items-center justify-center gap-1 text-xs py-2 px-2.5 text-primary hover:bg-primary/10"
                      title="Thiết lập tự động nạp định kỳ vào mục tiêu này"
                    >
                      <Clock className="w-4 h-4 text-primary" />
                      Tự động nạp
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
        onClose={() => { setShowAddAmount(null); setAddWalletId(''); }}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ví *</label>
            <select
              value={addWalletId}
              onChange={(e) => setAddWalletId(e.target.value)}
              className="input"
              required
            >
              <option value="">-- Chọn ví --</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {formatCurrency(w.balance)}
                </option>
              ))}
            </select>
            {addWalletId && (() => {
              const wallet = wallets.find((w) => w.id === Number(addWalletId));
              const amount = Number(addAmount) || 0;
              if (!wallet) return null;
              const insufficient = amount > wallet.balance;
              return (
                <p className={`text-xs mt-1 ${insufficient ? 'text-danger' : 'text-gray-500'}`}>
                  Số dư sau khi trừ:{' '}
                  <strong>{formatCurrency(wallet.balance - amount)}</strong>
                  {insufficient && ' — Số dư không đủ!'}
                </p>
              );
            })()}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1">
              Cập nhật
            </button>
            <button type="button" onClick={() => { setShowAddAmount(null); setAddWalletId(''); }} className="btn btn-secondary flex-1">
              Hủy
            </button>
          </div>
        </form>
      </Modal>

      {/* Auto Recurring modal */}
      <Modal
        open={!!showAutoRecurring}
        onClose={() => setShowAutoRecurring(null)}
        title={`Tự động tích lũy định kỳ — ${showAutoRecurring?.name || ''}`}
      >
        <form onSubmit={handleCreateAutoRecurring} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền mỗi kỳ (VNĐ) *
            </label>
            <input
              type="number"
              value={autoAmount}
              onChange={(e) => setAutoAmount(e.target.value)}
              className="input"
              placeholder="VD: 5000000"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trích tiền từ ví *
            </label>
            <select
              value={autoWalletId}
              onChange={(e) => setAutoWalletId(e.target.value)}
              className="input"
              required
            >
              <option value="">-- Chọn ví nguồn --</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatCurrency(w.balance)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chu kỳ tích lũy *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as RecurringFrequency[]).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setAutoFrequency(freq)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    autoFrequency === freq
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {FREQUENCY_LABELS[freq]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày bắt đầu tự động *
            </label>
            <input
              type="date"
              value={autoStartDate}
              onChange={(e) => setAutoStartDate(e.target.value)}
              className="input"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            Hệ thống sẽ tự động trừ số tiền này từ ví đã chọn và cộng trực tiếp vào mục tiêu khi đến hạn.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={savingAuto}
              className="btn btn-primary flex-1 py-2.5 flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${savingAuto ? 'animate-spin' : ''}`} />
              {savingAuto ? 'Đang kích hoạt...' : 'Kích hoạt tự động'}
            </button>
            <button
              type="button"
              onClick={() => setShowAutoRecurring(null)}
              className="btn btn-secondary flex-1 py-2.5"
            >
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
