import { getErrorMessage } from '../../lib/apiError';
// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { CategoryIcon } from '../../lib/categoryIcons';
import api from '../../lib/axios';
import { Category } from '../../types';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '',
  nameVi: '',
  type: 'EXPENSE',
  icon: '',
  color: '#5B4FFF',
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch {
      toast.error('Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      nameVi: c.nameVi || '',
      type: c.type,
      icon: c.icon || '',
      color: c.color || '#5B4FFF',
    });
    setShowForm(true);
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
        name: form.name,
        nameVi: form.nameVi || undefined,
        type: form.type,
        icon: form.icon || undefined,
        color: form.color,
      };
      if (editing) {
        await api.put(`/categories/${editing.id}`, payload);
        toast.success('Đã cập nhật danh mục');
      } else {
        await api.post('/categories', payload);
        toast.success('Đã tạo danh mục');
      }
      setShowForm(false);
      fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể lưu danh mục'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Category) => {
    if (c.isSystem) {
      toast.error('Không thể xóa danh mục hệ thống');
      return;
    }
    if (!confirm(`Xóa danh mục "${c.name}"?`)) return;
    try {
      await api.delete(`/categories/${c.id}`);
      toast.success('Đã xóa danh mục');
      fetchCategories();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa danh mục'));
    }
  };

  const systemCategories = categories.filter((c) => c.isSystem);
  const customCategories = categories.filter((c) => !c.isSystem);

  const renderGrid = (list: Category[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((c) => (
        <div key={c.id} className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: c.color || '#5B4FFF' }}
          >
            <CategoryIcon icon={c.icon} className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{c.nameVi || c.name}</div>
            <div className="text-xs text-gray-500">
              {c.type === 'INCOME' ? 'Thu nhập' : c.type === 'EXPENSE' ? 'Chi tiêu' : 'Cả hai'}
              {c.isSystem && ' · Hệ thống'}
            </div>
          </div>
          <div className="flex gap-1">
            {!c.isSystem && (
              <>
                <button
                  onClick={() => openEdit(c)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                  title="Sửa"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="p-1.5 rounded-lg hover:bg-danger/10 text-danger"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            {c.isSystem && <Lock className="w-4 h-4 text-gray-300" />}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Danh mục</h1>
          <p className="text-gray-500 mt-1">Quản lý danh mục giao dịch của bạn</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Thêm danh mục
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh mục của tôi</h2>
            {customCategories.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có danh mục tùy chỉnh nào</p>
            ) : (
              renderGrid(customCategories)
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh mục hệ thống</h2>
            {renderGrid(systemCategories)}
          </div>
        </>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên (tiếng Anh) *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="Groceries"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên tiếng Việt</label>
            <input
              type="text"
              value={form.nameVi}
              onChange={(e) => setForm({ ...form, nameVi: e.target.value })}
              className="input"
              placeholder="Thực phẩm"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="input"
              disabled={!!editing}
            >
              <option value="EXPENSE">Chi tiêu</option>
              <option value="INCOME">Thu nhập</option>
              <option value="BOTH">Cả hai</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon (emoji)</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="input"
                placeholder="🍔"
                maxLength={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Màu</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="input h-10 p-1"
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
    </div>
  );
}
