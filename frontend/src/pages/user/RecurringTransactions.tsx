// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  Clock,
  CalendarDays,
  History,
  Calendar,
  Play,
  Pause,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useSpaceStore } from '../../store/spaceStore';
import api from '../../lib/axios';
import {
  RecurringTransaction,
  RecurringTransactionLog,
  RecurringFrequency,
  Category,
  Wallet,
} from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import {
  differenceInDays,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addDays,
  addWeeks,
  addMonths,
  addQuarters,
  addYears,
  format,
  isToday,
  isBefore,
  getDay,
} from 'date-fns';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  DAILY: 'Hằng ngày',
  WEEKLY: 'Hằng tuần',
  MONTHLY: 'Hằng tháng',
  QUARTERLY: 'Hằng quý',
  YEARLY: 'Hằng năm',
};

const FREQUENCY_BADGE_COLOR: Record<RecurringFrequency, string> = {
  DAILY: 'bg-purple-100 text-purple-700',
  WEEKLY: 'bg-blue-100 text-blue-700',
  MONTHLY: 'bg-indigo-100 text-indigo-700',
  QUARTERLY: 'bg-orange-100 text-orange-700',
  YEARLY: 'bg-rose-100 text-rose-700',
};

const emptyForm = {
  type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
  categoryId: '',
  walletId: '',
  amount: '',
  description: '',
  frequency: 'MONTHLY' as RecurringFrequency,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
};

type Tab = 'list' | 'history' | 'calendar';

// ─────────────────────────────────────────────
// Helper: tính các ngày recurring trong tháng
// ─────────────────────────────────────────────
function getOccurrencesInMonth(
  item: RecurringTransaction,
  year: number,
  month: number // 0-indexed
): Date[] {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const start = parseISO(item.startDate);
  const end = item.endDate ? parseISO(item.endDate) : null;

  const occurrences: Date[] = [];
  let cursor = start;

  // Đẩy cursor đến gần đầu tháng nếu nó quá xa
  while (isBefore(cursor, monthStart)) {
    cursor = advance(cursor, item.frequency);
    if (end && isBefore(end, cursor)) break;
  }

  while (!isBefore(monthEnd, cursor)) {
    if (end && isBefore(end, cursor)) break;
    if (!isBefore(cursor, monthStart)) {
      occurrences.push(cursor);
    }
    cursor = advance(cursor, item.frequency);
  }

  return occurrences;
}

function advance(date: Date, frequency: RecurringFrequency): Date {
  switch (frequency) {
    case 'DAILY':     return addDays(date, 1);
    case 'WEEKLY':    return addWeeks(date, 1);
    case 'MONTHLY':   return addMonths(date, 1);
    case 'QUARTERLY': return addQuarters(date, 1);
    case 'YEARLY':    return addYears(date, 1);
  }
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export default function RecurringTransactions() {
  const { currentSpace } = useSpaceStore();

  // ── Data state ──
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<Tab>('list');

  // ── History state ──
  const [historyLogs, setHistoryLogs] = useState<RecurringTransactionLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RecurringTransaction | null>(null);

  // ── Calendar state ──
  const [calendarDate, setCalendarDate] = useState(new Date());

  // ─────────────────
  // Fetch data
  // ─────────────────
  const fetchItems = useCallback(async () => {
    if (!currentSpace) return;
    try {
      setLoading(true);
      const { data } = await api.get<RecurringTransaction[]>(
        `/recurring-transactions?spaceId=${currentSpace.id}`
      );
      setItems(data);
    } catch {
      toast.error('Không thể tải danh sách giao dịch định kỳ');
    } finally {
      setLoading(false);
    }
  }, [currentSpace]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch {
      // ignore
    }
  }, []);

  const fetchWallets = useCallback(async () => {
    if (!currentSpace) return;
    try {
      const { data } = await api.get<Wallet[]>(`/wallets?spaceId=${currentSpace.id}`);
      setWallets(data.filter((w) => w.isActive !== false));
    } catch {
      // ignore
    }
  }, [currentSpace]);

  useEffect(() => {
    if (currentSpace) {
      fetchItems();
      fetchCategories();
      fetchWallets();
    }
  }, [currentSpace, fetchItems, fetchCategories, fetchWallets]);

  // ─────────────────
  // CRUD
  // ─────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: RecurringTransaction) => {
    setEditing(item);
    setForm({
      type: item.type,
      categoryId: item.category?.id?.toString() || '',
      walletId: item.walletId?.toString() || '',
      amount: String(item.amount),
      description: item.description,
      frequency: item.frequency,
      startDate: item.startDate,
      endDate: item.endDate || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpace) return;
    if (!form.categoryId) { toast.error('Vui lòng chọn danh mục'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Số tiền không hợp lệ'); return; }
    if (!form.startDate) { toast.error('Vui lòng chọn ngày bắt đầu'); return; }
    if (form.endDate && form.endDate < form.startDate) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
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
        frequency: form.frequency,
        startDate: form.startDate,
        endDate: form.endDate || null,
      };

      if (editing) {
        await api.put(`/recurring-transactions/${editing.id}`, payload);
        toast.success('Đã cập nhật giao dịch định kỳ');
      } else {
        await api.post('/recurring-transactions', payload);
        toast.success('Đã tạo giao dịch định kỳ');
      }
      setShowForm(false);
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể lưu giao dịch định kỳ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch định kỳ này?')) return;
    try {
      await api.delete(`/recurring-transactions/${id}`);
      toast.success('Đã xóa giao dịch định kỳ');
      fetchItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa giao dịch định kỳ');
    }
  };

  // ─────────────────
  // Toggle ACTIVE / PAUSED (optimistic update)
  // ─────────────────
  const handleToggle = async (item: RecurringTransaction) => {
    if (item.status === 'CANCELLED' || item.status === 'COMPLETED') return;
    const newStatus = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    // Optimistic
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
    );
    try {
      await api.patch(`/recurring-transactions/${item.id}/toggle`);
    } catch {
      // Rollback
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: item.status } : i))
      );
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  // ─────────────────
  // History
  // ─────────────────
  const openHistory = async (item: RecurringTransaction) => {
    setSelectedItem(item);
    setActiveTab('history');
    setHistoryLoading(true);
    setHistoryLogs([]);
    try {
      const { data } = await api.get<RecurringTransactionLog[]>(
        `/recurring-transactions/${item.id}/logs`
      );
      setHistoryLogs(data);
    } catch {
      toast.error('Không thể tải lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ─────────────────
  // Helpers
  // ─────────────────
  const getDaysUntil = (nextRunDate: string) => {
    const diff = differenceInDays(parseISO(nextRunDate), new Date());
    return diff;
  };

  const filteredCategories = categories.filter((c) =>
    form.type === 'INCOME'
      ? c.type === 'INCOME' || c.type === 'BOTH'
      : c.type === 'EXPENSE' || c.type === 'BOTH'
  );

  // ─────────────────
  // Calendar data
  // ─────────────────
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth(); // 0-indexed
  const calendarDays = eachDayOfInterval({
    start: startOfMonth(calendarDate),
    end: endOfMonth(calendarDate),
  });
  const firstDayOfWeek = getDay(startOfMonth(calendarDate)); // 0=Sun
  const activeItems = items.filter((i) => i.status === 'ACTIVE');

  // Map: dateStr → occurrences[]
  const calendarOccurrences: Record<string, RecurringTransaction[]> = {};
  activeItems.forEach((item) => {
    const dates = getOccurrencesInMonth(item, calendarYear, calendarMonth);
    dates.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      calendarOccurrences[key] = [...(calendarOccurrences[key] || []), item];
    });
  });

  // ─────────────────────────────────────────────
  // Guard
  // ─────────────────────────────────────────────
  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Vui lòng chọn không gian tài chính</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Giao dịch định kỳ</h1>
          <p className="text-gray-500 mt-1">Quản lý các khoản thu chi tự động theo lịch</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Thêm định kỳ
        </button>
      </div>

      {/* ── Summary cards ── */}
      <SummaryCards items={items} />

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'list',     label: 'Danh sách',   icon: RefreshCw  },
          { key: 'history',  label: 'Lịch sử',     icon: History    },
          { key: 'calendar', label: 'Lịch tháng',  icon: Calendar   },
        ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          TAB: DANH SÁCH
      ══════════════════════════════════════ */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSkeleton />
          ) : items.length === 0 ? (
            <EmptyRecurring onAdd={openCreate} />
          ) : (
            items.map((item) => (
              <RecurringCard
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDelete={handleDelete}
                onHistory={openHistory}
                daysUntil={getDaysUntil(item.nextRunDate)}
              />
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: LỊCH SỬ
      ══════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="card">
          {!selectedItem ? (
            <div className="py-12 text-center">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Chọn một giao dịch định kỳ</p>
              <p className="text-gray-400 text-sm mt-1">
                Nhấn nút "Lịch sử" trên một giao dịch để xem timeline
              </p>
              <button
                onClick={() => setActiveTab('list')}
                className="btn btn-secondary mt-4 text-sm"
              >
                Quay lại danh sách
              </button>
            </div>
          ) : (
            <>
              {/* Header lịch sử */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setActiveTab('list'); setSelectedItem(null); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedItem.description}</h2>
                    <p className="text-sm text-gray-500">
                      {FREQUENCY_LABELS[selectedItem.frequency]} · {formatCurrency(selectedItem.amount)}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FREQUENCY_BADGE_COLOR[selectedItem.frequency]}`}>
                  {FREQUENCY_LABELS[selectedItem.frequency]}
                </span>
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>Chưa có lần chạy nào được ghi nhận</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {historyLogs.map((log, idx) => (
                      <HistoryLogItem key={log.id} log={log} isLast={idx === historyLogs.length - 1} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: LỊCH THÁNG
      ══════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <div className="card">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setCalendarDate((d) => addMonths(d, -1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              Tháng {calendarMonth + 1} / {calendarYear}
            </h2>
            <button
              onClick={() => setCalendarDate((d) => addMonths(d, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Leading empty cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days */}
            {calendarDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const occurrences = calendarOccurrences[key] || [];
              const todayClass = isToday(day);
              const hasEvents = occurrences.length > 0;

              return (
                <div
                  key={key}
                  className={`min-h-[72px] p-1.5 rounded-lg border transition-colors ${
                    todayClass
                      ? 'border-primary bg-primary/5'
                      : hasEvents
                      ? 'border-indigo-200 bg-indigo-50/50'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    todayClass ? 'text-primary' : 'text-gray-600'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {occurrences.slice(0, 2).map((item, i) => (
                      <div
                        key={i}
                        className={`text-[10px] font-medium px-1 py-0.5 rounded truncate ${
                          item.type === 'INCOME'
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}
                        title={`${item.description} · ${formatCurrency(item.amount)}`}
                      >
                        {item.description}
                      </div>
                    ))}
                    {occurrences.length > 2 && (
                      <div className="text-[10px] text-gray-400 px-1">
                        +{occurrences.length - 2} khác
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-success/20" />
              Thu nhập
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-danger/20" />
              Chi tiêu
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-primary bg-primary/5" />
              Hôm nay
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL: Tạo / Sửa
      ══════════════════════════════════════ */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Sửa giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Loại giao dịch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch</label>
            <div className="grid grid-cols-2 gap-3">
              {(['EXPENSE', 'INCOME'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t, categoryId: '' })}
                  className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.type === t
                      ? t === 'EXPENSE'
                        ? 'border-danger bg-danger/5 text-danger'
                        : 'border-success bg-success/5 text-success'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {t === 'EXPENSE'
                      ? <TrendingDown className="w-4 h-4" />
                      : <TrendingUp className="w-4 h-4" />}
                    {t === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên giao dịch <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="VD: Tiền thuê nhà, Lương tháng..."
              className="input"
              required
            />
          </div>

          {/* Số tiền */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số tiền <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                min="1"
                className="input pr-16"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                VNĐ
              </span>
            </div>
          </div>

          {/* 2 cột: Danh mục + Ví */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Danh mục <span className="text-danger">*</span>
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="input"
                required
              >
                <option value="">Chọn danh mục</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameVi || cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ví tiền</label>
              <select
                value={form.walletId}
                onChange={(e) => setForm({ ...form, walletId: e.target.value })}
                className="input"
              >
                <option value="">Không chọn ví</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tần suất */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tần suất lặp lại <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setForm({ ...form, frequency: freq })}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.frequency === freq
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {FREQUENCY_LABELS[freq]}
                </button>
              ))}
            </div>
          </div>

          {/* 2 cột: Ngày bắt đầu + Ngày kết thúc */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngày bắt đầu <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngày kết thúc <span className="text-gray-400 text-xs">(tùy chọn)</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="input"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Đang lưu...
                </span>
              ) : editing ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

// ── Summary Cards ──
function SummaryCards({ items }: { items: RecurringTransaction[] }) {
  const activeCount = items.filter((i) => i.status === 'ACTIVE').length;
  const pausedCount = items.filter((i) => i.status === 'PAUSED').length;
  const totalExpense = items
    .filter((i) => i.type === 'EXPENSE' && i.status === 'ACTIVE')
    .reduce((sum, i) => sum + i.amount, 0);
  const totalIncome = items
    .filter((i) => i.type === 'INCOME' && i.status === 'ACTIVE')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            <p className="text-xs text-gray-500">Tổng giao dịch</p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Play className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            <p className="text-xs text-gray-500">Đang hoạt động</p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="text-lg font-bold text-danger">{formatCurrency(totalExpense)}</p>
            <p className="text-xs text-gray-500">Chi tiêu / chu kỳ</p>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-lg font-bold text-success">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-gray-500">Thu nhập / chu kỳ</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recurring Card ──
function RecurringCard({
  item,
  onToggle,
  onEdit,
  onDelete,
  onHistory,
  daysUntil,
}: {
  item: RecurringTransaction;
  onToggle: (item: RecurringTransaction) => void;
  onEdit: (item: RecurringTransaction) => void;
  onDelete: (id: number) => void;
  onHistory: (item: RecurringTransaction) => void;
  daysUntil: number;
}) {
  const isActive = item.status === 'ACTIVE';
  const isPaused = item.status === 'PAUSED';
  const canToggle = item.status === 'ACTIVE' || item.status === 'PAUSED';

  return (
    <div className={`card transition-all hover:shadow-md ${!isActive ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          item.type === 'INCOME' ? 'bg-success/10' : 'bg-danger/10'
        }`}>
          {item.type === 'INCOME'
            ? <TrendingUp className="w-6 h-6 text-success" />
            : <TrendingDown className="w-6 h-6 text-danger" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">{item.description}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FREQUENCY_BADGE_COLOR[item.frequency]}`}>
              {FREQUENCY_LABELS[item.frequency]}
            </span>
            {item.status === 'PAUSED' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                Tạm dừng
              </span>
            )}
            {(item.status === 'CANCELLED' || item.status === 'COMPLETED') && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {item.status === 'CANCELLED' ? 'Đã hủy' : 'Hoàn thành'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 flex-wrap">
            {item.category && (
              <span>{item.category.nameVi || item.category.name}</span>
            )}
            {item.walletName && (
              <span>· {item.walletName}</span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Chạy tiếp: {formatDate(item.nextRunDate)}
            </span>
            {item.endDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Kết thúc: {formatDate(item.endDate)}
              </span>
            )}
          </div>

          {/* Countdown */}
          {isActive && (
            <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              daysUntil === 0
                ? 'bg-orange-100 text-orange-700'
                : daysUntil < 0
                ? 'bg-red-100 text-red-700'
                : daysUntil <= 3
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <Clock className="w-3 h-3" />
              {daysUntil < 0
                ? `Quá hạn ${Math.abs(daysUntil)} ngày`
                : daysUntil === 0
                ? 'Sẽ chạy hôm nay'
                : `Sẽ chạy sau ${daysUntil} ngày`}
            </div>
          )}
        </div>

        {/* Amount + Actions */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <span className={`text-lg font-bold ${
            item.type === 'INCOME' ? 'text-success' : 'text-danger'
          }`}>
            {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
          </span>

          <div className="flex items-center gap-1">
            {/* Toggle switch */}
            {canToggle && (
              <button
                onClick={() => onToggle(item)}
                title={isActive ? 'Tạm dừng' : 'Kích hoạt'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive ? 'bg-success' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={isActive}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            )}

            {/* History */}
            <button
              onClick={() => onHistory(item)}
              title="Xem lịch sử"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Edit */}
            <button
              onClick={() => onEdit(item)}
              title="Sửa"
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={() => onDelete(item.id)}
              title="Xóa"
              className="p-1.5 rounded-lg hover:bg-danger/10 text-danger"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── History Log Item (timeline) ──
function HistoryLogItem({
  log,
  isLast,
}: {
  log: RecurringTransactionLog;
  isLast: boolean;
}) {
  const statusConfig = {
    SUCCESS: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Thành công' },
    FAILED:  { icon: XCircle,      color: 'text-danger',  bg: 'bg-danger/10',  label: 'Thất bại' },
    SKIPPED: { icon: AlertCircle,  color: 'text-warning',  bg: 'bg-warning/10', label: 'Bỏ qua' },
  }[log.status];
  const Icon = statusConfig.icon;

  return (
    <div className="flex gap-4 pl-2">
      {/* Dot on timeline */}
      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${statusConfig.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
      </div>

      <div className={`flex-1 pb-4 ${isLast ? '' : 'border-b border-gray-100'}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {log.note && <span className="text-xs text-gray-400">{log.note}</span>}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date(log.executedAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            {formatCurrency(log.amount)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ──
function EmptyRecurring({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card py-16 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <RefreshCw className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có giao dịch định kỳ</h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
        Tự động hóa các khoản thu chi lặp lại như tiền thuê nhà, lương, hóa đơn...
      </p>
      <button onClick={onAdd} className="btn btn-primary inline-flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Thêm giao dịch định kỳ đầu tiên
      </button>
    </div>
  );
}

// ── Loading Skeleton ──
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
            <div className="w-24 h-6 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
