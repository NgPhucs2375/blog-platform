"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Unlock, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { adminApi } from "@/services/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types/auth";

function apiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" });
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user: me } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [permanent, setPermanent] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoadError("");
      try {
        const res = await adminApi.getUser(Number(id));
        setUser(res);
      } catch (err) {
        setLoadError(apiError(err, "Không tải được thông tin người dùng."));
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const backToList = () => router.push("/users");

  const mutate = async (fn: (u: User) => Promise<User>, okMsg: string) => {
    if (!user) return;
    setActionLoading(true);
    setSuccess("");
    setError("");
    try {
      const updated = await fn(user);
      setUser(updated);
      setSuccess(okMsg);
    } catch (err) {
      setError(apiError(err, "Thao tác thất bại."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setActionLoading(true);
    setError("");
    try {
      await adminApi.deleteUser(user.id, permanent);
      router.push("/users");
    } catch (err) {
      setError(apiError(err, "Xóa thất bại."));
      setActionLoading(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-xs font-medium">Đang tải thông tin thành viên...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-16 text-center">
        {loadError ? (
          <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-50 p-4 text-xs font-medium text-accent dark:bg-rose-500/10 dark:text-rose-300">
            {loadError}
          </div>
        ) : null}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/80">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-3" />
          <h3 className="text-base font-bold text-zinc-950 dark:text-white">Không tìm thấy người dùng</h3>
          <button
            onClick={backToList}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-hover transition shadow-md"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const isActive = user.status === "Active";
  const isAdmin = user.role === "Admin";
  const isSelf = me?.id === user.id;
  const isDeleted = !!user.isDeleted;
  const initial = (user.userName || 'U').charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20 px-4 sm:px-6">
      {/* Nút quay lại */}
      <button
        onClick={backToList}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Quay lại danh sách</span>
      </button>

      {/* Thông báo trạng thái */}
      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-xs font-medium text-accent dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {isSelf && (
        <div className="flex items-center gap-2 rounded-2xl border border-accent/30 bg-red-50 px-4 py-3 text-xs font-medium text-red-800 dark:bg-accent/10 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Đây là tài khoản của bạn — các hành động tự khóa / tự xóa / tự hạ quyền bị chặn.</span>
        </div>
      )}
      {isDeleted && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-xs font-medium text-accent dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Tài khoản đã bị xóa mềm{user.deletedAt ? ` lúc ${fmtDate(user.deletedAt)}` : ""}. Hãy khôi phục trước khi thao tác.</span>
        </div>
      )}

      {/* Thẻ thông tin thành viên */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/80 space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-white/[0.06] pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-black text-white shadow-md shadow-accent/20">
              {initial}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-zinc-950 dark:text-white">{user.userName}</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDeleted ? (
              <span className="rounded-full border border-rose-500/20 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                Đã xóa
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                  ? 'border border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'border border-rose-500/20 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isActive ? "Hoạt động" : "Đã khóa"}
              </span>
            )}

            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              {user.role}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">ID NGƯỜI DÙNG</span>
            <p className="font-semibold font-mono text-zinc-900 dark:text-white mt-1">#{user.id}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">NGÀY TẠO</span>
            <p className="font-semibold text-zinc-900 dark:text-white mt-1">{fmtDate(user.createdAt)}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">CẬP NHẬT LÚC</span>
            <p className="font-semibold text-zinc-900 dark:text-white mt-1">{fmtDate(user.updatedAt)}</p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">NGƯỜI TẠO / SỬA</span>
            <p className="font-semibold text-zinc-900 dark:text-white mt-1">
              {user.createdBy ?? "—"} / {user.updatedBy ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Thẻ hành động quản trị */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/80 space-y-6 transition-colors">
        <h2 className="text-base font-bold text-zinc-950 dark:text-white">Hành động quản trị</h2>

        <div className="space-y-4 divide-y divide-zinc-100 dark:divide-white/[0.04] text-xs">
          {/* Phân quyền */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">Phân quyền tài khoản</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                {isSelf ? "Không thể tự hạ quyền chính mình" : "Thay đổi vai trò người dùng hệ thống."}
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                disabled={actionLoading || user.role === "User" || isDeleted || (isSelf && isAdmin)}
                onClick={() => mutate((u) => adminApi.updateRole(u.id, { role: "User" }), "Đã chuyển về User.")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  user.role === "User"
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-white/10 dark:text-white"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                User
              </button>
              <button
                type="button"
                disabled={actionLoading || isAdmin || isDeleted}
                onClick={() => mutate((u) => adminApi.updateRole(u.id, { role: "Admin" }), "Đã nâng lên Admin.")}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  isAdmin
                    ? "bg-accent text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Trạng thái tài khoản */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div>
              <p className="font-bold text-zinc-900 dark:text-white">Trạng thái tài khoản</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                {isDeleted
                  ? "Khôi phục để cho phép đăng nhập lại"
                  : isActive
                    ? "Khóa tài khoản để ngăn đăng nhập (thu hồi phiên ngay)"
                    : "Mở khóa để cho phép đăng nhập"}
              </p>
            </div>
            <div>
              {isDeleted ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => mutate((u) => adminApi.restoreUser(u.id), "Đã khôi phục tài khoản.")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 transition"
                >
                  Khôi phục
                </button>
              ) : isActive ? (
                <button
                  type="button"
                  disabled={actionLoading || isAdmin || isSelf}
                  onClick={() => mutate((u) => adminApi.lockUser(u.id), "Đã khóa tài khoản (đã thu hồi phiên).")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 shadow-sm hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 transition disabled:opacity-50"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Khóa tài khoản</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => mutate((u) => adminApi.unlockUser(u.id), "Đã mở khóa tài khoản.")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 transition"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Mở khóa</span>
                </button>
              )}
            </div>
          </div>

          {/* Xóa người dùng */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div>
              <p className="font-bold text-rose-600 dark:text-rose-400">Xóa người dùng</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">Xóa mềm (khôi phục được) hoặc xóa vĩnh viễn</p>
            </div>
            <button
              type="button"
              disabled={actionLoading || isAdmin || isSelf || isDeleted}
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal xác nhận xóa */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-white/10 dark:bg-[#0c101a] text-zinc-900 dark:text-white space-y-4">
            <h3 className="text-base font-bold">Xóa thành viên &quot;{user.userName}&quot;?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Xóa mềm có thể khôi phục sau. Xóa vĩnh viễn không thể hoàn tác. Phiên đăng nhập của user sẽ bị thu hồi ngay lập tức.
            </p>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 pt-2">
              <input
                type="checkbox"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Xóa vĩnh viễn (không thể khôi phục)
            </label>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 active:scale-95 disabled:opacity-50 transition"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {permanent ? "Xóa vĩnh viễn" : "Xóa mềm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}