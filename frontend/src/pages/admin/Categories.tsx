// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState, useMemo } from 'react';
import { Plus, ToggleLeft, ToggleRight, Pencil, Search } from 'lucide-react';
import { CategoryIcon } from '../../lib/categoryIcons';
import api from '../../lib/axios';
import { Category } from '../../types';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/apiError';

interface CategoryFormState {
  name: string;
  nameVi: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
  icon: string;
  color: string;
}

const emptyForm: CategoryFormState = {
  name: '',
  nameVi: '',
  type: 'EXPENSE',
  icon: '',
  color: '#5B4FFF',
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get<Category[]>('/admin/categories');
      setCategories(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api.patch(`/admin/categories/${id}/toggle`);
      toast.success('Đã cập nhật trạng thái danh mục');
      fetchCategories();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name || '',
      nameVi: category.nameVi || '',
      type: category.type || 'EXPENSE',
      icon: category.icon || '',
      color: category.color || '#5B4FFF',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        nameVi: form.nameVi.trim() || undefined,
        type: form.type,
        icon: form.icon.trim() || undefined,
        color: form.color,
      };

      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, payload);
        toast.success('Đã cập nhật danh mục hệ thống');
      } else {
        await api.post('/admin/categories', payload);
        toast.success('Đã thêm danh mục hệ thống mới');
      }

      setShowModal(false);
      fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể lưu danh mục'));
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nameVi && c.nameVi.toLowerCase().includes(q))
    );
  }, [categories, search]);

  const incomeCategories = useMemo(
    () => filteredCategories.filter((c) => c.type === 'INCOME' || c.type === 'BOTH'),
    [filteredCategories]
  );

  const expenseCategories = useMemo(
    () => filteredCategories.filter((c) => c.type === 'EXPENSE' || c.type === 'BOTH'),
    [filteredCategories]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-500 mt-1">Quản lý danh mục hệ thống</p>
        </div>
        <button
          onClick={openCreate}
          type="button"
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm danh mục
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm danh mục theo tên..."
            className="input pl-9"
          />
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-3">
          <span>Tổng số: <strong className="text-gray-900">{categories.length}</strong> danh mục</span>
          <span>•</span>
          <span>Đang hoạt động: <strong className="text-success">{categories.filter(c => c.isActive !== false).length}</strong></span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Categories */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success"></span>
              Thu nhập
            </span>
            <span className="text-xs font-normal text-gray-500">
              {incomeCategories.length} danh mục
            </span>
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : incomeCategories.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Không có danh mục thu nhập nào</p>
          ) : (
            <div className="space-y-3">
              {incomeCategories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    category.isActive !== false
                      ? 'border-gray-200 hover:bg-gray-50'
                      : 'border-dashed border-gray-300 bg-gray-50/60 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: category.color || '#10B981' }}
                    >
                      <CategoryIcon icon={category.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                        <span>{category.nameVi || category.name}</span>
                        {category.isActive === false && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-200 text-gray-600">
                            Đã tắt
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {category.nameVi ? `${category.name} · ` : ''}
                        {category.type === 'BOTH' ? 'Cả hai · ' : ''}
                        {category.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => openEdit(category)}
                      className="p-1.5 rounded-lg hover:bg-gray-200/70 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Chỉnh sửa danh mục"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(category.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        category.isActive !== false ? 'text-success hover:opacity-80' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={category.isActive !== false ? 'Đang hoạt động (Bấm để vô hiệu hóa)' : 'Đã tắt (Bấm để kích hoạt)'}
                    >
                      {category.isActive !== false ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Categories */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-danger"></span>
              Chi tiêu
            </span>
            <span className="text-xs font-normal text-gray-500">
              {expenseCategories.length} danh mục
            </span>
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : expenseCategories.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Không có danh mục chi tiêu nào</p>
          ) : (
            <div className="space-y-3">
              {expenseCategories.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    category.isActive !== false
                      ? 'border-gray-200 hover:bg-gray-50'
                      : 'border-dashed border-gray-300 bg-gray-50/60 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: category.color || '#EF4444' }}
                    >
                      <CategoryIcon icon={category.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                        <span>{category.nameVi || category.name}</span>
                        {category.isActive === false && (
                          <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-200 text-gray-600">
                            Đã tắt
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {category.nameVi ? `${category.name} · ` : ''}
                        {category.type === 'BOTH' ? 'Cả hai · ' : ''}
                        {category.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => openEdit(category)}
                      className="p-1.5 rounded-lg hover:bg-gray-200/70 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Chỉnh sửa danh mục"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(category.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        category.isActive !== false ? 'text-success hover:opacity-80' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={category.isActive !== false ? 'Đang hoạt động (Bấm để vô hiệu hóa)' : 'Đã tắt (Bấm để kích hoạt)'}
                    >
                      {category.isActive !== false ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Sửa danh mục hệ thống' : 'Thêm danh mục hệ thống'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên danh mục (tiếng Anh) <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="VD: Groceries, Utilities, Salary..."
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên tiếng Việt
            </label>
            <input
              type="text"
              value={form.nameVi}
              onChange={(e) => setForm({ ...form, nameVi: e.target.value })}
              className="input"
              placeholder="VD: Thực phẩm, Điện nước, Tiền lương..."
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại danh mục <span className="text-danger">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as 'INCOME' | 'EXPENSE' | 'BOTH' })
              }
              className="input"
            >
              <option value="EXPENSE">Chi tiêu (Expense)</option>
              <option value="INCOME">Thu nhập (Income)</option>
              <option value="BOTH">Cả hai (Both)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon (emoji hoặc keyword)
              </label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="input"
                placeholder="🍔 hoặc food, wallet, car..."
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã màu
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="input h-10 w-14 p-1 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="input flex-1 font-mono text-sm"
                  placeholder="#5B4FFF"
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white"
              style={{ backgroundColor: form.color || '#5B4FFF' }}
            >
              <CategoryIcon icon={form.icon} className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-gray-400 font-medium">Xem trước hiển thị:</div>
              <div className="font-medium text-gray-900 truncate">
                {form.nameVi || form.name || 'Tên danh mục'}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {form.name ? `${form.name} · ` : ''}
                {form.type === 'INCOME' ? 'Thu nhập' : form.type === 'EXPENSE' ? 'Chi tiêu' : 'Cả hai'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm mới'}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
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
