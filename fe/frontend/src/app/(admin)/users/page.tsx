'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  Search,
  Plus,
  Lock,
  Unlock,
  Trash2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  User as UserIcon,
  AlertCircle,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'User', label: 'User' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Hoạt động' },
  { value: 'Locked', label: 'Đã khóa' },
];

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Mới nhất' },
  { value: 'created_at_asc', label: 'Cũ nhất' },
  { value: 'username_asc', label: 'Tên A→Z' },
  { value: 'username_desc', label: 'Tên Z→A' },
];

function apiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

type PendingAction =
  | { kind: 'delete'; id: number; name: string }
  | { kind: 'bulk-delete'; ids: number[] }
  | { kind: 'bulk-lock'; ids: number[] }
  | { kind: 'bulk-unlock'; ids: number[] }
  | null;

export default function UsersPage() {
  const { user: me } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [sortInput, setSortInput] = useState('created_at_desc');
  const [showDeletedInput, setShowDeletedInput] = useState(false);

  const [applied, setApplied] = useState({
    search: '',
    role: '',
    status: '',
    sort: 'created_at_desc',
    includeDeleted: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | 'bulk' | 'create' | null>(null);
  const [notice, setNotice] = useState('');
  const [pageError, setPageError] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [pending, setPending] = useState<PendingAction>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    userName: '',
    email: '',
    password: '',
    role: 'User',
    status: 'Active',
  });
  const [createError, setCreateError] = useState('');

  const { users, pagination, loading, error } = useUsers({
    page: currentPage,
    limit: 10,
    filters: applied,
    reloadKey,
  });

  const refresh = () => {
    setReloadKey((k) => k + 1);
    setSelected([]);
  };

  const selectableIds = useMemo(
    () => users.filter((u) => u.id !== me?.id && u.role !== 'Admin').map((u) => u.id),
    [users, me?.id]
  );
  const allChecked = selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));

  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) =>
      allChecked ? prev.filter((id) => !selectableIds.includes(id)) : [...new Set([...prev, ...selectableIds])]
    );

  const runSingle = async (id: number, fn: (id: number) => Promise<unknown>, okMsg: string) => {
    setActionLoading(id);
    setNotice('');
    setPageError('');
    try {
      await fn(id);
      setNotice(okMsg);
      refresh();
    } catch (err) {
      setPageError(apiError(err, 'Thao tác thất bại.'));
    } finally {
      setActionLoading(null);
    }
  };

  const runBulk = async (
    ids: number[],
    fn: (ids: number[]) => Promise<{ success: number[]; failed: Array<{ id: number; reason: string }> }>
  ) => {
    setActionLoading('bulk');
    setNotice('');
    setPageError('');
    try {
      const res = await fn(ids);
      setNotice(
        `Thành công ${res.success.length}/${ids.length}.` +
          (res.failed.length > 0 ? ` Thất bại: ${res.failed.map((f) => f.id).join(', ')}.` : '')
      );
      refresh();
    } catch (err) {
      setPageError(apiError(err, 'Thao tác hàng loạt thất bại.'));
    } finally {
      setActionLoading(null);
      setPending(null);
    }
  };

  const confirmPending = async () => {
    if (!pending) return;
    if (pending.kind === 'delete') {
      setActionLoading(pending.id);
      try {
        await adminApi.deleteUser(pending.id);
        setNotice(`Đã xóa "${pending.name}".`);
        refresh();
      } catch (err) {
        setPageError(apiError(err, 'Xóa thất bại.'));
      } finally {
        setActionLoading(null);
        setPending(null);
      }
      return;
    }
    if (pending.kind === 'bulk-delete') await runBulk(pending.ids, (ids) => adminApi.bulkDelete(ids));
    if (pending.kind === 'bulk-lock') await runBulk(pending.ids, (ids) => adminApi.bulkLock(ids));
    if (pending.kind === 'bulk-unlock') await runBulk(pending.ids, (ids) => adminApi.bulkUnlock(ids));
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setApplied({
      search: searchInput.trim(),
      role: roleInput,
      status: statusInput,
      sort: sortInput,
      includeDeleted: showDeletedInput,
    });
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setActionLoading('create');
    try {
      await adminApi.createUser({
        userName: createForm.userName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role as 'Admin' | 'User',
        status: createForm.status as 'Active' | 'Locked',
      });
      setCreateOpen(false);
      setCreateForm({ userName: '', email: '', password: '', role: 'User', status: 'Active' });
      setNotice('Tạo người dùng thành công.');
      refresh();
    } catch (err) {
      setCreateError(apiError(err, 'Tạo người dùng thất bại.'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#06080e] dark:text-zinc-100 transition-colors duration-200 pb-20">
      
      {/* Soft Ambient Glow */}
      <div className="absolute inset-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header Quản trị */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-white/[0.08] pb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-red-50 dark:border-accent/30 dark:bg-accent/10 px-3 py-1 text-xs font-bold text-accent dark:text-rose-600">
              <Shield className="h-3.5 w-3.5" /> HỆ THỐNG PHÂN QUYỀN & TÀI KHOẢN
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Quản lý người dùng
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Tổng số <span className="font-semibold text-zinc-950 dark:text-white">{pagination.total}</span> tài khoản thành viên trong hệ thống OpenBlog
            </p>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-accent/25 hover:bg-accent-hover active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            Tạo người dùng
          </button>
        </div>

        {/* Thông báo thao tác (Alert Notices) */}
        {notice && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{notice}</span>
            </div>
            <button onClick={() => setNotice('')}><X className="h-4 w-4 text-zinc-400 hover:text-zinc-600" /></button>
          </div>
        )}

        {(pageError || (error && !loading)) && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-xs font-medium text-accent dark:bg-rose-500/10 dark:text-rose-300 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span>{pageError || error}</span>
            </div>
            <button onClick={() => setPageError('')}><X className="h-4 w-4 text-zinc-400 hover:text-zinc-600" /></button>
          </div>
        )}

        {/* Thanh Tác vụ hàng loạt & Bộ lọc dữ liệu */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-zinc-600 dark:text-zinc-400">
              {selected.length > 0 ? (
                <span>Đã chọn <strong className="font-bold text-zinc-950 dark:text-white">{selected.length}</strong> tài khoản</span>
              ) : (
                <span>Chọn nhiều tài khoản để khóa hoặc xóa hàng loạt</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={selected.length === 0 || actionLoading === 'bulk'}
                onClick={() => setPending({ kind: 'bulk-lock', ids: selected })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06] transition"
              >
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                Khóa đã chọn
              </button>
              <button
                disabled={selected.length === 0 || actionLoading === 'bulk'}
                onClick={() => setPending({ kind: 'bulk-unlock', ids: selected })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06] transition"
              >
                <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                Mở khóa đã chọn
              </button>
              <button
                disabled={selected.length === 0 || actionLoading === 'bulk'}
                onClick={() => setPending({ kind: 'bulk-delete', ids: selected })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa đã chọn
              </button>
            </div>
          </div>

          {/* Form tìm kiếm & Bộ lọc Dropdowns */}
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row items-stretch md:items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3.5 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/70"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên hoặc email người dùng..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2 text-xs text-zinc-950 placeholder-zinc-400 focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 focus:border-accent focus:outline-none dark:border-white/10 dark:bg-[#0c101a] dark:text-zinc-200"
              >
                <option value="">Tất cả role</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 focus:border-accent focus:outline-none dark:border-white/10 dark:bg-[#0c101a] dark:text-zinc-200"
              >
                <option value="">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <select
                value={sortInput}
                onChange={(e) => setSortInput(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 focus:border-accent focus:outline-none dark:border-white/10 dark:bg-[#0c101a] dark:text-zinc-200"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 px-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDeletedInput}
                  onChange={(e) => setShowDeletedInput(e.target.checked)}
                  className="rounded text-accent focus:ring-rose-800"
                />
                Hiện đã xóa
              </label>

              <button
                type="submit"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition"
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>

        {/* Bảng Quản trị Người dùng */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/70">
          {loading ? (
            <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
              <Loader2 className="h-7 w-7 animate-spin text-accent dark:text-rose-600" />
              <p className="text-xs">Đang đồng bộ danh sách người dùng...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center">
              <UserIcon className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-600 mb-3" />
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">Không tìm thấy người dùng nào</h3>
              <p className="text-xs text-zinc-500 mt-1">
                {error ? error : 'Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-400">
                    <th className="py-3.5 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        className="rounded text-accent focus:ring-rose-800"
                      />
                    </th>
                    <th className="py-3.5 px-4 w-16">ID</th>
                    <th className="py-3.5 px-4">TÊN NGƯỜI DÙNG</th>
                    <th className="py-3.5 px-4">EMAIL</th>
                    <th className="py-3.5 px-4">ROLE</th>
                    <th className="py-3.5 px-4">TRẠNG THÁI</th>
                    <th className="py-3.5 px-4">NGÀY TẠO</th>
                    <th className="py-3.5 px-4 text-right">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.04] text-xs">
                  {users.map((user) => {
                    const isSelf = user.id === me?.id;
                    const isAdmin = user.role === 'Admin';
                    const isDeleted = !!user.isDeleted;
                    const busy = actionLoading === user.id;
                    const isSelected = selected.includes(user.id);

                    return (
                      <tr
                        key={user.id}
                        className={`hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition ${
                          isSelected ? 'bg-red-50/40 dark:bg-accent/[0.05]' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isSelf || isAdmin || isDeleted}
                            onChange={() => toggleOne(user.id)}
                            className="rounded text-accent focus:ring-rose-800 disabled:opacity-30"
                          />
                        </td>

                        {/* ID */}
                        <td className="py-4 px-4 font-mono text-zinc-400 dark:text-zinc-500">
                          {user.id}
                        </td>

                        {/* Tên người dùng */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/users/${user.id}`}
                              className="font-bold text-zinc-950 dark:text-white hover:text-accent dark:hover:text-rose-600 transition"
                            >
                              {user.userName}
                            </Link>
                            {isSelf && (
                              <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                                BẠN
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 text-zinc-600 dark:text-zinc-400">
                          {user.email}
                        </td>

                        {/* Role */}
                        <td className="py-4 px-4">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300">
                              <ShieldCheck className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                              <UserIcon className="h-3 w-3" /> User
                            </span>
                          )}
                        </td>

                        {/* Trạng thái */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isDeleted ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Đã xóa
                            </span>
                          ) : user.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Đã khóa
                            </span>
                          )}
                        </td>

                        {/* Ngày tạo */}
                        <td className="py-4 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </td>

                        {/* Hành động */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/users/${user.id}`}
                              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06] transition"
                            >
                              Chi tiết
                            </Link>

                            {user.status === 'Active' && !isDeleted ? (
                              <button
                                onClick={() => runSingle(user.id, (id) => adminApi.lockUser(id), 'Đã khóa tài khoản.')}
                                disabled={busy || isAdmin || isSelf}
                                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 transition"
                              >
                                Khóa
                              </button>
                            ) : !isDeleted ? (
                              <button
                                onClick={() => runSingle(user.id, (id) => adminApi.unlockUser(id), 'Đã mở khóa tài khoản.')}
                                disabled={busy}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 transition"
                              >
                                Mở khóa
                              </button>
                            ) : (
                              <button
                                onClick={() => runSingle(user.id, (id) => adminApi.restoreUser(id), 'Đã khôi phục tài khoản.')}
                                disabled={busy}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-accent hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-accent/30 dark:bg-accent/10 dark:text-rose-600 transition"
                              >
                                Khôi phục
                              </button>
                            )}

                            <button
                              onClick={() => setPending({ kind: 'delete', id: user.id, name: user.userName })}
                              disabled={busy || isAdmin || isSelf || isDeleted}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 transition"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Phân trang (Pagination) */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs border-t border-zinc-200/80 dark:border-white/[0.08] pt-4">
            <span className="text-zinc-500 dark:text-zinc-400">
              Trang <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 disabled:opacity-30 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Trước
              </button>
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 disabled:opacity-30 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 transition"
              >
                Sau <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal Xác nhận Thao tác */}
      {pending !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0c101a] text-zinc-900 dark:text-white">
            <h3 className="text-base font-bold">
              {pending.kind === 'delete'
                ? `Xác nhận xóa tài khoản "${pending.name}"?`
                : pending.kind === 'bulk-delete'
                ? `Xác nhận xóa ${pending.ids.length} tài khoản?`
                : pending.kind === 'bulk-lock'
                ? `Khóa ${pending.ids.length} tài khoản?`
                : `Mở khóa ${pending.ids.length} tài khoản?`}
            </h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {pending.kind === 'delete' || pending.kind === 'bulk-delete'
                ? 'Tài khoản sẽ được chuyển sang trạng thái xóa mềm và có thể khôi phục sau này. Toàn bộ phiên đăng nhập của người dùng sẽ bị thu hồi ngay lập tức.'
                : 'Thao tác sẽ được áp dụng cho toàn bộ các tài khoản đã được chọn (tự động bỏ qua Admin và tài khoản hiện tại của bạn).'}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmPending}
                disabled={actionLoading === 'bulk' || typeof actionLoading === 'number'}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition ${
                  pending.kind === 'bulk-unlock'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {(actionLoading === 'bulk' || typeof actionLoading === 'number') && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {pending.kind === 'bulk-unlock' ? 'Mở khóa' : pending.kind === 'bulk-lock' ? 'Khóa' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Người Dùng */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0c101a] text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
              <h3 className="text-base font-bold">Tạo tài khoản người dùng mới</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Tên người dùng
                </label>
                <input
                  type="text"
                  value={createForm.userName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, userName: e.target.value }))}
                  placeholder="nguyenvana"
                  required
                  minLength={3}
                  maxLength={50}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="vana@example.com"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Tối thiểu 8 ký tự"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-accent focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Vai trò
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 focus:border-accent focus:outline-none dark:border-white/10 dark:bg-[#0c101a] dark:text-zinc-200"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 focus:border-accent focus:outline-none dark:border-white/10 dark:bg-[#0c101a] dark:text-zinc-200"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25 hover:bg-accent-hover active:scale-95 disabled:opacity-50 transition"
                >
                  {actionLoading === 'create' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}