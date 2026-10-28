// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
import { useEffect, useState } from 'react';
import { Home, Plus, LogIn, Copy, UserPlus, LogOut, Trash2, Users } from 'lucide-react';
import { useSpaceStore } from '../../store/spaceStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';
import { FinancialSpace, FamilyMember } from '../../types';
import { formatDateTime } from '../../lib/utils';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Chủ sở hữu',
  ADMIN: 'Quản trị viên',
  MEMBER: 'Thành viên',
  VIEWER: 'Chỉ xem',
};

export default function Family() {
  const { setSpaces, setCurrentSpace } = useSpaceStore();
  const { user } = useAuthStore();
  const [spaces, setLocalSpaces] = useState<FinancialSpace[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const [selectedSpace, setSelectedSpace] = useState<FinancialSpace | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteForm, setInviteForm] = useState({ usernameOrEmail: '', role: 'MEMBER' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<FinancialSpace[]>('/spaces');
      setLocalSpaces(data);
      setSpaces(data);
    } catch {
      toast.error('Không thể tải không gian tài chính');
    } finally {
      setLoading(false);
    }
  };

  const familySpaces = spaces.filter((s) => s.type === 'FAMILY');
  const personalSpaces = spaces.filter((s) => s.type === 'PERSONAL');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      toast.error('Vui lòng nhập tên không gian');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post<FinancialSpace>('/spaces', {
        name: createForm.name,
        description: createForm.description,
        type: 'FAMILY',
        currency: 'VND',
      });
      toast.success('Đã tạo không gian gia đình');
      setShowCreate(false);
      setCreateForm({ name: '', description: '' });
      fetchSpaces();
      setCurrentSpace(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo không gian');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error('Vui lòng nhập mã mời');
      return;
    }
    setJoining(true);
    try {
      const { data } = await api.post<FinancialSpace>(
        `/spaces/join?inviteCode=${encodeURIComponent(joinCode.trim())}`
      );
      toast.success(`Đã tham gia "${data.name}"`);
      setShowJoin(false);
      setJoinCode('');
      fetchSpaces();
      setCurrentSpace(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã mời không hợp lệ');
    } finally {
      setJoining(false);
    }
  };

  const openMembers = async (space: FinancialSpace) => {
    setSelectedSpace(space);
    try {
      setLoadingMembers(true);
      const { data } = await api.get<FamilyMember[]>(`/spaces/${space.id}/members`);
      setMembers(data);
    } catch {
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !inviteForm.usernameOrEmail.trim()) {
      toast.error('Vui lòng nhập username hoặc email');
      return;
    }
    setInviting(true);
    try {
      await api.post(`/spaces/${selectedSpace.id}/members`, {
        usernameOrEmail: inviteForm.usernameOrEmail.trim(),
        role: inviteForm.role,
      });
      toast.success('Đã thêm thành viên');
      setInviteForm({ usernameOrEmail: '', role: 'MEMBER' });
      const { data } = await api.get<FamilyMember[]>(`/spaces/${selectedSpace.id}/members`);
      setMembers(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thêm thành viên');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (member: FamilyMember) => {
    if (!selectedSpace) return;
    if (!confirm(`Xóa ${member.fullName} khỏi không gian?`)) return;
    try {
      await api.delete(`/spaces/${selectedSpace.id}/members/${member.userId}`);
      toast.success('Đã xóa thành viên');
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa thành viên');
    }
  };

  const handleLeave = async (space: FinancialSpace) => {
    if (!confirm(`Rời khỏi "${space.name}"?`)) return;
    try {
      await api.post(`/spaces/${space.id}/leave`);
      toast.success('Đã rời khỏi không gian');
      fetchSpaces();
      if (selectedSpace?.id === space.id) setSelectedSpace(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể rời khỏi không gian');
    }
  };

  const handleDeleteSpace = async (space: FinancialSpace) => {
    if (!confirm(`Xóa (vô hiệu hóa) "${space.name}"?`)) return;
    try {
      await api.delete(`/spaces/${space.id}`);
      toast.success('Đã xóa không gian');
      fetchSpaces();
      if (selectedSpace?.id === space.id) setSelectedSpace(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa không gian');
    }
  };

  const copyInviteCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã mời');
  };

  const isOwner = (space: FinancialSpace) => space.ownerId === user?.id;

  const renderSpaceCard = (space: FinancialSpace) => (
    <div key={space.id} className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{space.name}</h3>
            <p className="text-xs text-gray-500">
              {space.type === 'FAMILY' ? 'Gia đình' : 'Cá nhân'} · Chủ: {space.ownerName || '—'}
            </p>
          </div>
        </div>
      </div>
      {space.description && (
        <p className="text-sm text-gray-600 mb-3">{space.description}</p>
      )}
      {space.type === 'FAMILY' && space.inviteCode && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
          <span className="text-xs text-gray-500 flex-1">Mã mời:</span>
          <code className="text-sm font-mono font-semibold text-primary">{space.inviteCode}</code>
          <button
            onClick={() => copyInviteCode(space.inviteCode)}
            className="p-1 rounded hover:bg-gray-200 text-gray-500"
            title="Sao chép"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
        <button onClick={() => openMembers(space)} className="btn btn-secondary flex-1 flex items-center justify-center gap-1">
          <Users className="w-4 h-4" />
          Thành viên
        </button>
        {space.type === 'FAMILY' && !isOwner(space) && (
          <button
            onClick={() => handleLeave(space)}
            className="btn btn-secondary flex items-center justify-center gap-1 text-warning"
          >
            <LogOut className="w-4 h-4" />
            Rời nhóm
          </button>
        )}
        {isOwner(space) && (
          <button
            onClick={() => handleDeleteSpace(space)}
            className="btn btn-secondary px-3 text-danger"
            title="Xóa không gian"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gia đình</h1>
          <p className="text-gray-500 mt-1">Quản lý không gian tài chính chung với gia đình</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowJoin(true)} className="btn btn-secondary flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Nhập mã mời
          </button>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Tạo nhóm gia đình
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nhóm gia đình</h2>
            {familySpaces.length === 0 ? (
              <div className="card text-center py-10">
                <Home className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Chưa có nhóm gia đình nào</p>
                <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                  Tạo nhóm đầu tiên
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {familySpaces.map(renderSpaceCard)}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Không gian cá nhân</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalSpaces.map(renderSpaceCard)}
            </div>
          </div>
        </>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Tạo nhóm gia đình">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên nhóm *</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="input"
              placeholder="Gia đình Nguyễn Văn A"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="input"
              rows={2}
              maxLength={500}
              placeholder="Chi tiêu chung của cả nhà..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={creating} className="btn btn-primary flex-1">
              {creating ? 'Đang tạo...' : 'Tạo nhóm'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary flex-1">
              Hủy
            </button>
          </div>
        </form>
      </Modal>

      {/* Join modal */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Tham gia bằng mã mời">
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mã mời *</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input font-mono text-center"
              placeholder="FAM-XXXXXXXX"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nhập mã được chia sẻ bởi chủ nhóm gia đình
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={joining} className="btn btn-primary flex-1">
              {joining ? 'Đang tham gia...' : 'Tham gia'}
            </button>
            <button type="button" onClick={() => setShowJoin(false)} className="btn btn-secondary flex-1">
              Hủy
            </button>
          </div>
        </form>
      </Modal>

      {/* Members modal */}
      <Modal
        open={!!selectedSpace}
        onClose={() => setSelectedSpace(null)}
        title={`Thành viên — ${selectedSpace?.name || ''}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {/* Invite */}
          {selectedSpace && selectedSpace.type === 'FAMILY' && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="text"
                value={inviteForm.usernameOrEmail}
                onChange={(e) => setInviteForm({ ...inviteForm, usernameOrEmail: e.target.value })}
                className="input flex-1"
                placeholder="Username hoặc email"
              />
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className="input w-36"
              >
                <option value="MEMBER">Thành viên</option>
                <option value="ADMIN">Quản trị</option>
                <option value="VIEWER">Chỉ xem</option>
              </select>
              <button type="submit" disabled={inviting} className="btn btn-primary flex items-center gap-1">
                <UserPlus className="w-4 h-4" />
                Thêm
              </button>
            </form>
          )}

          {/* Member list */}
          {loadingMembers ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {m.fullName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{m.fullName}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {m.username} · {m.email}
                    </div>
                  </div>
                  <span className="badge badge-primary shrink-0">{ROLE_LABELS[m.role] || m.role}</span>
                  {selectedSpace &&
                    m.role !== 'OWNER' &&
                    isOwner(selectedSpace) &&
                    m.userId !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(m)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-danger shrink-0"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}

          {members.length > 0 && (
            <p className="text-xs text-gray-400">
              Tham gia từ: {members[0].joinedAt ? formatDateTime(members[0].joinedAt) : '—'}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
