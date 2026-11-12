// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wallet, ArrowLeftRight, Pencil, Archive, Banknote, CreditCard, Smartphone, TrendingUp } from 'lucide-react';
import { useSpaceStore } from '../../store/spaceStore';
import api from '../../lib/axios';
import { Wallet as WalletType, Category } from '../../types';
import { formatCurrency } from '../../lib/utils';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const WALLET_TYPE_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK: 'Ngân hàng',
  E_WALLET: 'Ví điện tử',
};

const WALLET_TYPE_ICONS: Record<string, typeof Wallet> = {
  CASH: Banknote,
  BANK: CreditCard,
  E_WALLET: Smartphone,
};

const emptyForm = {
  name: '',
  walletType: 'CASH',
  currency: 'VND',
  initialBalance: '',
};

const emptyTransfer = {
  fromWalletId: '',
  toWalletId: '',
  amount: '',
  fee: '0',
  note: '',
};

export default function Wallets() {
  const { currentSpace } = useSpaceStore();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WalletType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transfer, setTransfer] = useState(emptyTransfer);
  const [transferring, setTransferring] = useState(false);

  // Income transaction modal
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showIncome, setShowIncome] = useState<WalletType | null>(null);
  const [incomeForm, setIncomeForm] = useState({
    categoryId: '',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [addingIncome, setAddingIncome] = useState(false);

  useEffect(() => {
    fetchWallets();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpace]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const params = currentSpace ? `?spaceId=${currentSpace.id}` : '';
      const { data } = await api.get<WalletType[]>(`/wallets${params}`);
      setWallets(data);
    } catch {
      toast.error('Không thể tải danh sách ví');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get<Category[]>('/categories?type=INCOME');
      setCategories(data);
    } catch {
      // ignore
    }
  };

  const openIncome = (w: WalletType) => {
    setShowIncome(w);
    setIncomeForm({
      categoryId: '',
      amount: '',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      note: '',
    });
  };

  const handleIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showIncome || !currentSpace) return;
    if (!incomeForm.categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    if (!incomeForm.transactionDate) {
      toast.error('Vui lòng chọn ngày giao dịch');
      return;
    }
    setAddingIncome(true);
    try {
      await api.post('/transactions', {
        spaceId: currentSpace.id,
        walletId: showIncome.id,
        categoryId: Number(incomeForm.categoryId),
        type: 'INCOME',
        amount: Number(incomeForm.amount),
        description: incomeForm.description,
        transactionDate: incomeForm.transactionDate,
        note: incomeForm.note,
      });
      toast.success(`Đã ghi thu nhập vào ví "${showIncome.name}"`);
      setShowIncome(null);
      fetchWallets();
      navigate('/transactions?new=1');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể ghi thu nhập');
    } finally {
      setAddingIncome(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (w: WalletType) => {
    setEditing(w);
    setForm({
      name: w.name,
      walletType: w.walletType,
      currency: w.currency,
      initialBalance: '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên ví');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/wallets/${editing.id}`, {
          name: form.name,
          walletType: form.walletType,
          currency: form.currency,
          initialBalance: 0,
          spaceId: editing.spaceId ?? currentSpace?.id,
          isShared: editing.isShared,
        });
        toast.success('Đã cập nhật ví');
      } else {
        await api.post('/wallets', {
          name: form.name,
          walletType: form.walletType,
          currency: form.currency,
          initialBalance: form.initialBalance ? Number(form.initialBalance) : 0,
          spaceId: currentSpace?.id,
          isShared: false,
        });
        toast.success('Đã tạo ví');
      }
      setShowForm(false);
      fetchWallets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu ví');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (w: WalletType) => {
    if (!confirm(`Lưu trữ ví "${w.name}"?`)) return;
    try {
      await api.patch(`/wallets/${w.id}/archive`);
      toast.success('Đã lưu trữ ví');
      fetchWallets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu trữ ví');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer.fromWalletId || !transfer.toWalletId) {
      toast.error('Vui lòng chọn ví nguồn và ví đích');
      return;
    }
    if (transfer.fromWalletId === transfer.toWalletId) {
      toast.error('Ví nguồn và ví đích phải khác nhau');
      return;
    }
    if (!transfer.amount || Number(transfer.amount) <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    setTransferring(true);
    try {
      await api.post('/wallets/transfer', {
        fromWalletId: Number(transfer.fromWalletId),
        toWalletId: Number(transfer.toWalletId),
        amount: Number(transfer.amount),
        fee: transfer.fee ? Number(transfer.fee) : 0,
        note: transfer.note,
        spaceId: currentSpace?.id,
      });
      toast.success('Chuyển tiền thành công');
      setShowTransfer(false);
      setTransfer(emptyTransfer);
      fetchWallets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Chuyển tiền thất bại');
    } finally {
      setTransferring(false);
    }
  };

  const totalBalance = wallets.filter((w) => w.isActive !== false).reduce((s, w) => s + Number(w.balance), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ví tiền</h1>
          <p className="text-gray-500 mt-1">
            Quản lý tiền mặt, ngân hàng và ví điện tử
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTransfer(true)}
            disabled={wallets.filter((w) => w.isActive !== false).length < 2}
            className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Chuyển tiền
          </button>
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Thêm ví
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="card bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="text-sm opacity-90 mb-1">Tổng số dư</div>
        <div className="text-3xl font-bold">{formatCurrency(totalBalance)}</div>
        <div className="text-sm opacity-75 mt-1">
          {wallets.filter((w) => w.isActive !== false).length} ví đang hoạt động
        </div>
      </div>

      {/* Wallet list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : wallets.length === 0 ? (
        <div className="card text-center py-12">
          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Chưa có ví nào</p>
          <button onClick={openCreate} className="btn btn-primary">
            Tạo ví đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((w) => {
            const Icon = WALLET_TYPE_ICONS[w.walletType] || Wallet;
            const archived = w.isActive === false;
            return (
              <div
                key={w.id}
                className={`card relative ${archived ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{w.name}</h3>
                      <p className="text-xs text-gray-500">
                        {WALLET_TYPE_LABELS[w.walletType]} · {w.currency}
                      </p>
                    </div>
                  </div>
                  {!archived && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(w)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchive(w)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                        title="Lưu trữ"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(Number(w.balance))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>{w.isShared ? 'Ví chung' : 'Ví cá nhân'}</span>
                  {archived && <span className="badge badge-secondary">Đã lưu trữ</span>}
                </div>
                {!archived && (
                  <button
                    onClick={() => openIncome(w)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success text-white font-semibold text-sm hover:bg-success/90 active:scale-95 transition-all shadow-sm"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Ghi thu nhập
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Sửa ví' : 'Thêm ví'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên ví *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Ví tiền mặt"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại ví *</label>
            <select
              value={form.walletType}
              onChange={(e) => setForm({ ...form, walletType: e.target.value })}
              className="input"
            >
              <option value="CASH">Tiền mặt</option>
              <option value="BANK">Ngân hàng</option>
              <option value="E_WALLET">Ví điện tử</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiền tệ</label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
              className="input"
              maxLength={3}
            />
          </div>
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số dư ban đầu</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.initialBalance}
                onChange={(e) => setForm({ ...form, initialBalance: e.target.value })}
                className="input"
                placeholder="0"
              />
            </div>
          )}
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

      {/* Transfer modal */}
      <Modal open={showTransfer} onClose={() => setShowTransfer(false)} title="Chuyển tiền giữa các ví">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ví nguồn *</label>
            <select
              value={transfer.fromWalletId}
              onChange={(e) => setTransfer({ ...transfer, fromWalletId: e.target.value })}
              className="input"
            >
              <option value="">Chọn ví nguồn</option>
              {wallets
                .filter((w) => w.isActive !== false)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(Number(w.balance))})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ví đích *</label>
            <select
              value={transfer.toWalletId}
              onChange={(e) => setTransfer({ ...transfer, toWalletId: e.target.value })}
              className="input"
            >
              <option value="">Chọn ví đích</option>
              {wallets
                .filter((w) => w.isActive !== false)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={transfer.amount}
              onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phí giao dịch</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={transfer.fee}
              onChange={(e) => setTransfer({ ...transfer, fee: e.target.value })}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
            <input
              type="text"
              value={transfer.note}
              onChange={(e) => setTransfer({ ...transfer, note: e.target.value })}
              className="input"
              placeholder="Chuyển tiền..."
              maxLength={500}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={transferring} className="btn btn-primary flex-1">
              {transferring ? 'Đang xử lý...' : 'Chuyển tiền'}
            </button>
            <button type="button" onClick={() => setShowTransfer(false)} className="btn btn-secondary flex-1">
              Hủy
            </button>
          </div>
        </form>
      </Modal>

      {/* Income transaction modal */}
      <Modal
        open={!!showIncome}
        onClose={() => setShowIncome(null)}
        title={`Ghi thu nhập — ${showIncome?.name || ''}`}
      >
        <form onSubmit={handleIncome} className="space-y-4">
          {/* Wallet info */}
          <div className="bg-success/10 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Số dư hiện tại</span>
            <span className="font-bold text-success text-lg">
              {formatCurrency(Number(showIncome?.balance ?? 0))}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
            <select
              value={incomeForm.categoryId}
              onChange={(e) => setIncomeForm({ ...incomeForm, categoryId: e.target.value })}
              className="input"
              required
              autoFocus
            >
              <option value="">-- Chọn danh mục thu nhập --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameVi || c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              className="input"
              placeholder="0"
              required
            />
            {incomeForm.amount && Number(incomeForm.amount) > 0 && (
              <p className="text-xs text-success mt-1">
                Số dư sau khi cộng:{' '}
                <strong>
                  {formatCurrency(Number(showIncome?.balance ?? 0) + Number(incomeForm.amount))}
                </strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <input
              type="text"
              value={incomeForm.description}
              onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
              className="input"
              placeholder="Lương tháng, thưởng..."
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày giao dịch *</label>
            <input
              type="date"
              value={incomeForm.transactionDate}
              onChange={(e) => setIncomeForm({ ...incomeForm, transactionDate: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
            <textarea
              value={incomeForm.note}
              onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })}
              className="input"
              rows={2}
              maxLength={1000}
              placeholder="Ghi chú thêm..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={addingIncome}
              className="btn flex-1 flex items-center justify-center gap-2 bg-success text-white hover:bg-success/90 disabled:opacity-50"
            >
              <TrendingUp className="w-4 h-4" />
              {addingIncome ? 'Đang lưu...' : 'Ghi thu nhập'}
            </button>
            <button
              type="button"
              onClick={() => setShowIncome(null)}
              className="btn btn-secondary flex-1"
            >
              Hủy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
