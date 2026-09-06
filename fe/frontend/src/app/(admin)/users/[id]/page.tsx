"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminApi } from "@/services/adminApi";
import { useAuth } from "@/contexts/AuthContext";
import type { User } from "@/types/auth";
import {
  AdminActionRow,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
  EmptyState,
  Grid,
  Heading,
  Inline,
  LoadingState,
  Modal,
  Stack,
  StatusDot,
  Text,
} from "@/components/ui";

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

  if (loading) return <LoadingState message="Đang tải..." />;

  if (!user) {
    return (
      <Container size="lg">
        <Stack gap="md">
          {loadError ? <Alert variant="error">{loadError}</Alert> : null}
          <EmptyState
            message="Không tìm thấy người dùng."
            action={
              <Button variant="ghost" size="sm" onClick={backToList}>
                Quay lại danh sách
              </Button>
            }
          />
        </Stack>
      </Container>
    );
  }

  const isActive = user.status === "Active";
  const isAdmin = user.role === "Admin";
  const isSelf = me?.id === user.id;
  const isDeleted = !!user.isDeleted;

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Box>
          <Button variant="ghost" size="sm" onClick={backToList}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Box>

        {success ? <Alert variant="success">{success}</Alert> : null}
        {error ? <Alert variant="error">{error}</Alert> : null}
        {isSelf ? <Alert variant="info">Đây là tài khoản của bạn — các hành động tự khóa / tự xóa / tự hạ quyền bị chặn.</Alert> : null}
        {isDeleted ? <Alert variant="error">Tài khoản đã bị xóa mềm{user.deletedAt ? ` lúc ${fmtDate(user.deletedAt)}` : ""}. Hãy khôi phục trước khi đổi role / khóa.</Alert> : null}

        <Card padding="md">
          <CardHeader>
            <Inline justify="between" align="center">
              <Inline gap="md" align="center">
                <Avatar name={user.userName} size="md" />
                <Stack gap="xs">
                  <Heading level={1} size="md">
                    {user.userName}
                  </Heading>
                  <Text variant="muted">{user.email}</Text>
                </Stack>
              </Inline>
              <Inline gap="xs">
                {isDeleted ? (
                  <Badge variant="red">Đã xóa</Badge>
                ) : (
                  <Badge variant={isActive ? "outline" : "red"}>
                    <StatusDot tone={isActive ? "white" : "red"} />
                    <Text variant="small" as="span" className="text-xs font-medium">
                      {isActive ? "Hoạt động" : "Đã khóa"}
                    </Text>
                  </Badge>
                )}
                <Badge variant={isAdmin ? "solid" : "default"}>{user.role}</Badge>
              </Inline>
            </Inline>
          </CardHeader>
          <CardContent>
            <Grid columns={2}>
              <Stack gap="xs">
                <Text variant="caption">ID</Text>
                <Text variant="small" className="font-mono text-white">
                  {user.id}
                </Text>
              </Stack>
              <Stack gap="xs">
                <Text variant="caption">Ngày tạo</Text>
                <Text variant="small" className="text-white">
                  {fmtDate(user.createdAt)}
                </Text>
              </Stack>
              <Stack gap="xs">
                <Text variant="caption">Cập nhật lúc</Text>
                <Text variant="small" className="text-white">
                  {fmtDate(user.updatedAt)}
                </Text>
              </Stack>
              <Stack gap="xs">
                <Text variant="caption">Người tạo / sửa</Text>
                <Text variant="small" className="text-white">
                  {user.createdBy ?? "—"} / {user.updatedBy ?? "—"}
                </Text>
              </Stack>
            </Grid>
          </CardContent>
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Hành động</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack gap="md">
              <AdminActionRow
                title="Phân quyền"
                description={isSelf ? "Không thể tự hạ quyền chính mình" : "Thay đổi vai trò người dùng"}
                actions={
                  <>
                    <Button
                      variant={user.role === "User" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => mutate((u) => adminApi.updateRole(u.id, { role: "User" }), "Đã chuyển về User.")}
                      disabled={actionLoading || user.role === "User" || isDeleted || (isSelf && isAdmin)}
                      title={isSelf && isAdmin ? "Không thể tự hạ quyền chính mình" : undefined}
                    >
                      User
                    </Button>
                    <Button
                      variant={isAdmin ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => mutate((u) => adminApi.updateRole(u.id, { role: "Admin" }), "Đã nâng lên Admin.")}
                      disabled={actionLoading || isAdmin || isDeleted}
                    >
                      Admin
                    </Button>
                  </>
                }
              />
              <AdminActionRow
                title="Trạng thái tài khoản"
                description={
                  isDeleted
                    ? "Khôi phục để cho phép đăng nhập lại"
                    : isActive
                      ? "Khóa tài khoản để ngăn đăng nhập (thu hồi phiên ngay)"
                      : "Mở khóa để cho phép đăng nhập"
                }
                actions={
                  isDeleted ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => mutate((u) => adminApi.restoreUser(u.id), "Đã khôi phục tài khoản.")}
                      disabled={actionLoading}
                    >
                      Khôi phục
                    </Button>
                  ) : isActive ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => mutate((u) => adminApi.lockUser(u.id), "Đã khóa tài khoản (đã thu hồi phiên).")}
                      disabled={actionLoading || isAdmin || isSelf}
                      title={isSelf ? "Không thể tự khóa chính mình" : isAdmin ? "Không thể khóa Admin" : undefined}
                    >
                      Khóa tài khoản
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => mutate((u) => adminApi.unlockUser(u.id), "Đã mở khóa tài khoản.")}
                      disabled={actionLoading}
                    >
                      Mở khóa
                    </Button>
                  )
                }
              />
              <AdminActionRow
                title="Xóa người dùng"
                description="Xóa mềm (khôi phục được) hoặc xóa vĩnh viễn"
                tone="danger"
                actions={
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    disabled={actionLoading || isAdmin || isSelf || isDeleted}
                    title={isSelf ? "Không thể tự xóa chính mình" : undefined}
                  >
                    Xóa
                  </Button>
                }
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Modal
        open={deleteOpen}
        title={`Xóa "${user.userName}"?`}
        description="Xóa mềm có thể khôi phục sau. Xóa vĩnh viễn không thể hoàn tác. Phiên đăng nhập của user bị thu hồi ngay."
        confirmLabel={permanent ? "Xóa vĩnh viễn" : "Xóa mềm"}
        tone="danger"
        loading={actionLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      >
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={permanent}
            onChange={(e) => setPermanent(e.target.checked)}
            className="h-4 w-4 accent-red-500"
          />
          Xóa vĩnh viễn (không khôi phục được)
        </label>
      </Modal>
    </Container>
  );
}
