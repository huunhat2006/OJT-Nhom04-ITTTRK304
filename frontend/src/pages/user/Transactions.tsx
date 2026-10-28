// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Plus, Download, Search, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { useSpaceStore } from '../../store/spaceStore';
import api from '../../lib/axios';
import { Transaction, PageResponse, Category, Wallet } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const emptyForm = {
  type: 'EXPENSE',
  categoryId: '',
  walletId: '',
  amount: '',
  description: '',
  transactionDate: new Date().toISOString().split('T')[0],
  note: '',
  receiptUrl: '',
};

export default function Transactions() {
  const { currentSpace } = useSpaceStore();
  const [transactions, setTransactions] = useState<PageResponse<Transaction> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    keyword: '',
    page: 0,
    size: 20,
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentSpace) {
      fetchTransactions();
      fetchCategories();
      fetchWallets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpace, filters]);

  const fetchTransactions = async () => {
    if (!currentSpace) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        spaceId: currentSpace.id.toString(),
        page: filters.page.toString(),
        size: filters.size.toString(),
        ...(filters.type && { type: filters.type }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.keyword && { keyword: filters.keyword }),
      });
      const response = await api.get<PageResponse<Transaction>>(`/transactions?${params.toString()}`);
      setTransactions(response.data);
    } catch {
      toast.error('Không thể tải danh sách giao dịch');
    } finally {
      setLoading(false);
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

  const fetchWallets = async () => {
    if (!currentSpace) return;
    try {
      const { data } = await api.get<Wallet[]>(`/wallets?spaceId=${currentSpace.id}`);
      setWallets(data.filter((w) => w.isActive !== false));
    } catch {
      // ignore
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setForm({
      type: t.type === 'TRANSFER' ? 'EXPENSE' : t.type,
      categoryId: t.category?.id?.toString() || '',
      walletId: '',
      amount: String(t.amount),
      description: t.description || '',
      transactionDate: t.transactionDate,
      note: t.note || '',
      receiptUrl: t.receiptUrl || '',
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
      toast.error('Số tiền không hợp lệ');
      return;
    }
    if (!form.transactionDate) {
      toast.error('Vui lòng chọn ngày giao dịch');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        spaceId: currentSpace.id,
        walletId: form.walletId ? Number(form.walletId) : null,
        categoryId: Number(form.categoryId),
        type: form.type,
        amount: Number(form.amount),
        description: form.description,
        transactionDate: form.transactionDate,
        note: form.note,
        receiptUrl: form.receiptUrl || null,
      };
      if (editing) {
        await api.put(`/transactions/${editing.id}`, payload);
        toast.success('Đã cập nhật giao dịch');
      } else {
        await api.post('/transactions', payload);
        toast.success('Đã thêm giao dịch');
      }
      setShowForm(false);
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu giao dịch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Đã xóa giao dịch');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa giao dịch');
    }
  };

  const handleExport = async () => {
    if (!currentSpace) return;
    try {
      const { data } = await axiosBlobGet(
        `/reports/export-excel?spaceId=${currentSpace.id}`
      );
      const url = URL.createObjectURL(new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `BaoCaoThuChi_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất file Excel');
    } catch {
      toast.error('Không thể xuất Excel');
    }
  };

  const axiosBlobGet = (url: string) =>
    api.get(url, { responseType: 'blob' });

  const filteredCategories = categories.filter((c) =>
    form.type === 'INCOME' ? c.type === 'INCOME' || c.type === 'BOTH' : c.type === 'EXPENSE' || c.type === 'BOTH'
  );

  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Vui lòng chọn không gian tài chính</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Giao dịch</h1>
          <p className="text-gray-500 mt-1">Quản lý tất cả các giao dịch thu chi</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Thêm giao dịch
          </button>
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
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value, page: 0 })}
              className="input pl-10"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 0 })}
            className="input"
          >
            <option value="">Tất cả loại</option>
            <option value="INCOME">Thu nhập</option>
            <option value="EXPENSE">Chi tiêu</option>
            <option value="TRANSFER">Chuyển khoản</option>
          </select>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters({ ...filters, categoryId: e.target.value, page: 0 })}
            className="input"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameVi || cat.name}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            {transactions?.totalElements ?? 0} giao dịch
          </div>
        </div>
      </div>

      {/* Table */}
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Giao dịch</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ngày</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Danh mục</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Ví</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Loại</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Số tiền</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions?.content.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        Không có giao dịch nào
                      </td>
                    </tr>
                  )}
                  {transactions?.content.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              transaction.type === 'INCOME'
                                ? 'bg-success/10'
                                : transaction.type === 'EXPENSE'
                                ? 'bg-danger/10'
                                : 'bg-primary/10'
                            }`}
                          >
                            {transaction.receiptUrl ? (
                              <ImageIcon className="w-4 h-4 text-gray-500" />
                            ) : (
                              <span>💰</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              {transaction.description ||
                                transaction.category?.nameVi ||
                                transaction.category?.name ||
                                'Giao dịch'}
                            </div>
                            <div className="text-xs text-gray-500">{transaction.userName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(transaction.transactionDate)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {transaction.category
                          ? transaction.category.nameVi || transaction.category.name
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {transaction.walletName || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`badge ${
                            transaction.type === 'INCOME'
                              ? 'badge-success'
                              : transaction.type === 'EXPENSE'
                              ? 'badge-danger'
                              : 'badge-primary'
                          }`}
                        >
                          {transaction.type === 'INCOME'
                            ? 'Thu nhập'
                            : transaction.type === 'EXPENSE'
                            ? 'Chi tiêu'
                            : 'Chuyển khoản'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-medium ${
                            transaction.type === 'INCOME'
                              ? 'text-success'
                              : transaction.type === 'EXPENSE'
                              ? 'text-danger'
                              : 'text-primary'
                          }`}
                        >
                          {transaction.type === 'INCOME' ? '+' : transaction.type === 'EXPENSE' ? '-' : ''}
                          {formatCurrency(Number(transaction.amount))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(transaction)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-1.5 rounded-lg hover:bg-danger/10 text-danger"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions && transactions.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Trang {transactions.pageNumber + 1}/{transactions.totalPages} —{' '}
                  {transactions.totalElements} giao dịch
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(0, filters.page - 1) })}
                    disabled={transactions.pageNumber === 0}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() =>
                      setFilters({
                        ...filters,
                        page: Math.min(transactions.totalPages - 1, filters.page + 1),
                      })
                    }
                    disabled={transactions.pageNumber >= transactions.totalPages - 1}
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

      {/* Create/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Sửa giao dịch' : 'Thêm giao dịch'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'EXPENSE', categoryId: '' })}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === 'EXPENSE'
                    ? 'bg-danger text-white border-danger'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'INCOME', categoryId: '' })}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.type === 'INCOME'
                    ? 'bg-success text-white border-success'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Thu nhập
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="input"
            >
              <option value="">Chọn danh mục</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameVi || c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ví</label>
            <select
              value={form.walletId}
              onChange={(e) => setForm({ ...form, walletId: e.target.value })}
              className="input"
            >
              <option value="">Không gắn ví</option>
              {wallets.map((w) => (
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
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
              placeholder="Ăn trưa, lương..."
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày giao dịch *</label>
            <input
              type="date"
              value={form.transactionDate}
              onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL hóa đơn (ảnh)</label>
            <input
              type="url"
              value={form.receiptUrl}
              onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
              className="input"
              placeholder="https://..."
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input"
              rows={2}
              maxLength={1000}
            />
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
