"use client";

import { useMemo, useState, type FormEvent } from "react";
import { adminApi } from "@/services/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/hooks/useUsers";
import {
  Alert,
  Badge,
  Box,
  Button,
  ColumnHeader,
  Form,
  Inline,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableLink,
  TableRow,
  TableShell,
  TableStateRow,
  Text,
} from "@/components/ui";

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "User", label: "User" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Hoạt động" },
  { value: "Locked", label: "Đã khóa" },
];

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Mới nhất" },
  { value: "created_at_asc", label: "Cũ nhất" },
  { value: "username_asc", label: "Tên A→Z" },
  { value: "username_desc", label: "Tên Z→A" },
];

const TABLE_COLUMNS = 8;

function apiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

type PendingAction =
  | { kind: "delete"; id: number; name: string }
  | { kind: "bulk-delete"; ids: number[] }
  | { kind: "bulk-lock"; ids: number[] }
  | { kind: "bulk-unlock"; ids: number[] }
  | null;

export default function UsersPage() {
  const { user: me } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [sortInput, setSortInput] = useState("created_at_desc");
  const [showDeletedInput, setShowDeletedInput] = useState(false);

  const [applied, setApplied] = useState({
    search: "",
    role: "",
    status: "",
    sort: "created_at_desc",
    includeDeleted: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionLoading, setActionLoading] = useState<number | "bulk" | "create" | null>(null);
  const [notice, setNotice] = useState("");
  const [pageError, setPageError] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [pending, setPending] = useState<PendingAction>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    userName: "",
    email: "",
    password: "",
    role: "User",
    status: "Active",
  });
  const [createError, setCreateError] = useState("");

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
    () => users.filter((u) => u.id !== me?.id && u.role !== "Admin").map((u) => u.id),
    [users, me?.id]
  );
  const allChecked = selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id));

  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () =>
    setSelected((prev) => (allChecked ? prev.filter((id) => !selectableIds.includes(id)) : [...new Set([...prev, ...selectableIds])]));

  const runSingle = async (id: number, fn: (id: number) => Promise<unknown>, okMsg: string) => {
    setActionLoading(id);
    setNotice("");
    setPageError("");
    try {
      await fn(id);
      setNotice(okMsg);
      refresh();
    } catch (err) {
      setPageError(apiError(err, "Thao tác thất bại."));
    } finally {
      setActionLoading(null);
    }
  };

  const runBulk = async (ids: number[], fn: (ids: number[]) => Promise<{ success: number[]; failed: Array<{ id: number; reason: string }> }>) => {
    setActionLoading("bulk");
    setNotice("");
    setPageError("");
    try {
      const res = await fn(ids);
      setNotice(`Thành công ${res.success.length}/${ids.length}.` + (res.failed.length > 0 ? ` Thất bại: ${res.failed.map((f) => f.id).join(", ")}.` : ""));
      refresh();
    } catch (err) {
      setPageError(apiError(err, "Thao tác hàng loạt thất bại."));
    } finally {
      setActionLoading(null);
      setPending(null);
    }
  };

  const confirmPending = async () => {
    if (!pending) return;
    if (pending.kind === "delete") {
      setActionLoading(pending.id);
      try {
        await adminApi.deleteUser(pending.id);
        setNotice(`Đã xóa "${pending.name}".`);
        refresh();
      } catch (err) {
        setPageError(apiError(err, "Xóa thất bại."));
      } finally {
        setActionLoading(null);
        setPending(null);
      }
      return;
    }
    if (pending.kind === "bulk-delete") await runBulk(pending.ids, (ids) => adminApi.bulkDelete(ids));
    if (pending.kind === "bulk-lock") await runBulk(pending.ids, (ids) => adminApi.bulkLock(ids));
    if (pending.kind === "bulk-unlock") await runBulk(pending.ids, (ids) => adminApi.bulkUnlock(ids));
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
    setCreateError("");
    setActionLoading("create");
    try {
      await adminApi.createUser({
        userName: createForm.userName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role as "Admin" | "User",
        status: createForm.status as "Active" | "Locked",
      });
      setCreateOpen(false);
      setCreateForm({ userName: "", email: "", password: "", role: "User", status: "Active" });
      setNotice("Tạo người dùng thành công.");
      refresh();
    } catch (err) {
      setCreateError(apiError(err, "Tạo người dùng thất bại."));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Quản lý người dùng"
        description={`${pagination.total} người dùng tổng cộng`}
      />

      {notice ? <Alert variant="success">{notice}</Alert> : null}
      {pageError ? <Alert variant="error">{pageError}</Alert> : null}
      {error && !loading ? <Alert variant="error">{error}</Alert> : null}

      <Inline justify="between" gap="sm" className="mb-4 flex-wrap">
        <Text variant="muted">
          {selected.length > 0 ? `Đã chọn ${selected.length} tài khoản` : "Chọn nhiều tài khoản để khóa / xóa hàng loạt"}
        </Text>
        <Inline gap="xs" className="flex-wrap">
          <Button
            variant="outline"
            size="sm"
            disabled={selected.length === 0 || actionLoading === "bulk"}
            onClick={() => setPending({ kind: "bulk-lock", ids: selected })}
          >
            Khóa đã chọn
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selected.length === 0 || actionLoading === "bulk"}
            onClick={() => setPending({ kind: "bulk-unlock", ids: selected })}
          >
            Mở khóa đã chọn
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={selected.length === 0 || actionLoading === "bulk"}
            onClick={() => setPending({ kind: "bulk-delete", ids: selected })}
          >
            Xóa đã chọn
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            + Tạo người dùng
          </Button>
        </Inline>
      </Inline>

      <Form onSubmit={handleSearch} className="mb-6">
        <Inline gap="sm" className="flex-wrap">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            aria-label="Tìm theo tên hoặc email"
            className="max-w-md flex-1 py-2.5"
          />
          <Select
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            options={ROLE_OPTIONS}
            placeholder="Tất cả role"
            aria-label="Lọc theo role"
          />
          <Select
            value={statusInput}
            onChange={(e) => setStatusInput(e.target.value)}
            options={STATUS_OPTIONS}
            placeholder="Tất cả trạng thái"
            aria-label="Lọc theo trạng thái"
          />
          <Select
            value={sortInput}
            onChange={(e) => setSortInput(e.target.value)}
            options={SORT_OPTIONS}
            aria-label="Sắp xếp"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={showDeletedInput}
              onChange={(e) => setShowDeletedInput(e.target.checked)}
              className="h-4 w-4 accent-white"
            />
            Hiện đã xóa
          </label>
          <Button type="submit" variant="secondary" size="sm" className="px-5 py-2.5">
            Tìm
          </Button>
        </Inline>
      </Form>

      <TableShell>
        <Table>
          <TableHead>
            <ColumnHeader>
              <input
                type="checkbox"
                aria-label="Chọn tất cả"
                checked={allChecked}
                onChange={toggleAll}
                className="h-4 w-4 accent-white"
              />
            </ColumnHeader>
            <ColumnHeader>ID</ColumnHeader>
            <ColumnHeader>Tên người dùng</ColumnHeader>
            <ColumnHeader>Email</ColumnHeader>
            <ColumnHeader>Role</ColumnHeader>
            <ColumnHeader>Trạng thái</ColumnHeader>
            <ColumnHeader>Ngày tạo</ColumnHeader>
            <ColumnHeader align="right">Hành động</ColumnHeader>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableStateRow colSpan={TABLE_COLUMNS} message="Đang tải..." />
            ) : users.length === 0 ? (
              <TableStateRow
                colSpan={TABLE_COLUMNS}
                message={error ? error : "Không tìm thấy người dùng nào."}
              />
            ) : (
              users.map((user) => {
                const isSelf = user.id === me?.id;
                const isAdmin = user.role === "Admin";
                const isDeleted = !!user.isDeleted;
                const busy = actionLoading === user.id;
                return (
                  <TableRow key={user.id} hoverable>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${user.userName}`}
                        checked={selected.includes(user.id)}
                        disabled={isSelf || isAdmin || isDeleted}
                        onChange={() => toggleOne(user.id)}
                        className="h-4 w-4 accent-white disabled:opacity-30"
                      />
                    </TableCell>
                    <TableCell>{user.id}</TableCell>
                    <TableCell tone="default">
                      <TableLink href={`/users/${user.id}`}>{user.userName}</TableLink>
                      {isSelf ? (
                        <Text variant="caption" as="span" className="ml-2">
                          (bạn)
                        </Text>
                      ) : null}
                    </TableCell>
                    <TableCell tone="muted">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "Admin" ? "solid" : "default"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {isDeleted ? (
                        <Badge variant="red">Đã xóa</Badge>
                      ) : (
                        <Badge variant={user.status === "Active" ? "outline" : "red"}>
                          <StatusDot tone={user.status === "Active" ? "white" : "red"} />
                          <Text variant="small" as="span" className="text-xs font-medium">
                            {user.status === "Active" ? "Hoạt động" : "Đã khóa"}
                          </Text>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell tone="faint">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell align="right">
                      <Inline justify="end" gap="xs">
                        <Button variant="outline" size="xs" href={`/users/${user.id}`}>
                          Chi tiết
                        </Button>
                        {user.status === "Active" && !isDeleted ? (
                          <Button
                            variant="danger"
                            size="xs"
                            onClick={() => runSingle(user.id, (id) => adminApi.lockUser(id), "Đã khóa tài khoản.")}
                            disabled={busy || isAdmin || isSelf}
                            title={isSelf ? "Không thể tự khóa chính mình" : undefined}
                          >
                            Khóa
                          </Button>
                        ) : !isDeleted ? (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => runSingle(user.id, (id) => adminApi.unlockUser(id), "Đã mở khóa tài khoản.")}
                            disabled={busy}
                          >
                            Mở khóa
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => runSingle(user.id, (id) => adminApi.restoreUser(id), "Đã khôi phục tài khoản.")}
                            disabled={busy}
                          >
                            Khôi phục
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => setPending({ kind: "delete", id: user.id, name: user.userName })}
                          disabled={busy || isAdmin || isSelf || isDeleted}
                          title={isSelf ? "Không thể tự xóa chính mình" : undefined}
                        >
                          Xóa
                        </Button>
                      </Inline>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableShell>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setCurrentPage} />

      <Modal
        open={pending !== null}
        title={
          pending?.kind === "delete"
            ? `Xóa "${pending.name}"?`
            : pending?.kind === "bulk-delete"
              ? `Xóa ${pending.ids.length} tài khoản?`
              : pending?.kind === "bulk-lock"
                ? `Khóa ${pending.ids.length} tài khoản?`
                : `Mở khóa ${pending?.kind === "bulk-unlock" ? pending.ids.length : 0} tài khoản?`
        }
        description={
          pending?.kind === "delete"
            ? "Tài khoản bị xóa mềm, có thể khôi phục. Phiên đăng nhập của user này sẽ bị thu hồi ngay."
            : "Hành động áp dụng cho tất cả tài khoản đã chọn (bỏ qua Admin / chính bạn / đã xóa)."
        }
        confirmLabel={pending?.kind === "bulk-unlock" ? "Mở khóa" : pending?.kind === "delete" || pending?.kind === "bulk-delete" ? "Xóa" : "Khóa"}
        tone={pending?.kind === "bulk-unlock" ? "default" : "danger"}
        loading={actionLoading === "bulk" || typeof actionLoading === "number"}
        onConfirm={confirmPending}
        onClose={() => setPending(null)}
      />

      <Modal
        open={createOpen}
        title="Tạo người dùng"
        description="Admin tạo tài khoản trực tiếp (mật khẩu ≥ 8 ký tự, hoa + thường + số + ký tự đặc biệt)."
        confirmLabel="Tạo"
        loading={actionLoading === "create"}
        onConfirm={() => document.getElementById("admin-create-submit")?.click()}
        onClose={() => setCreateOpen(false)}
      >
        <Form onSubmit={handleCreate}>
          {createError ? <Alert variant="error">{createError}</Alert> : null}
          <Input
            value={createForm.userName}
            onChange={(e) => setCreateForm((f) => ({ ...f, userName: e.target.value }))}
            placeholder="Tên người dùng"
            aria-label="Tên người dùng"
            required
            minLength={3}
            maxLength={50}
          />
          <Box className="h-3" />
          <Input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="Email"
            aria-label="Email"
            required
          />
          <Box className="h-3" />
          <Input
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Mật khẩu"
            aria-label="Mật khẩu"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Box className="h-3" />
          <Inline gap="sm">
            <Select
              value={createForm.role}
              onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value }))}
              options={ROLE_OPTIONS}
              aria-label="Role"
            />
            <Select
              value={createForm.status}
              onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
              options={STATUS_OPTIONS}
              aria-label="Trạng thái"
            />
          </Inline>
          <button id="admin-create-submit" type="submit" className="hidden" aria-hidden tabIndex={-1} />
        </Form>
      </Modal>
    </Box>
  );
}
