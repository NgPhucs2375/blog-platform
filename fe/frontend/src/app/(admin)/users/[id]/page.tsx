"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminApi } from "@/services/adminApi";
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
  Stack,
  StatusDot,
  Text,
} from "@/components/ui";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await adminApi.getUser(Number(id));
        setUser(res);
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const backToList = () => router.push("/users");

  const handleRoleChange = async (newRole: "Admin" | "User") => {
    if (!user) return;
    setActionLoading(true);
    setSuccess("");
    try {
      const updated = await adminApi.updateRole(user.id, { role: newRole });
      setUser(updated);
      setSuccess("Cập nhật role thành công.");
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  const handleLock = async () => {
    if (!user) return;
    setActionLoading(true);
    setSuccess("");
    try {
      const updated = await adminApi.lockUser(user.id);
      setUser(updated);
      setSuccess("Đã khóa tài khoản.");
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!user) return;
    setActionLoading(true);
    setSuccess("");
    try {
      const updated = await adminApi.unlockUser(user.id);
      setUser(updated);
      setSuccess("Đã mở khóa tài khoản.");
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Bạn có chắc muốn xóa "${user.userName}"? Hành động này không thể hoàn tác.`))
      return;
    setActionLoading(true);
    try {
      await adminApi.deleteUser(user.id);
      router.push("/users");
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Đang tải..." />;

  if (!user) {
    return (
      <EmptyState
        message="Không tìm thấy người dùng."
        action={
          <Button variant="ghost" size="sm" onClick={backToList}>
            Quay lại danh sách
          </Button>
        }
      />
    );
  }

  const isActive = user.status === "Active";
  const isAdmin = user.role === "Admin";

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
                <Badge variant={isActive ? "outline" : "red"}>
                  <StatusDot tone={isActive ? "white" : "red"} />
                  <Text variant="small" as="span" className="text-xs font-medium">
                    {isActive ? "Hoạt động" : "Đã khóa"}
                  </Text>
                </Badge>
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
                  {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
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
                description="Thay đổi vai trò người dùng"
                actions={
                  <>
                    <Button
                      variant={user.role === "User" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleRoleChange("User")}
                      disabled={actionLoading || user.role === "User"}
                    >
                      User
                    </Button>
                    <Button
                      variant={isAdmin ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleRoleChange("Admin")}
                      disabled={actionLoading || isAdmin}
                    >
                      Admin
                    </Button>
                  </>
                }
              />
              <AdminActionRow
                title="Trạng thái tài khoản"
                description={
                  isActive ? "Khóa tài khoản để ngăn đăng nhập" : "Mở khóa để cho phép đăng nhập"
                }
                actions={
                  isActive ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleLock}
                      disabled={actionLoading || isAdmin}
                    >
                      Khóa tài khoản
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={handleUnlock} disabled={actionLoading}>
                      Mở khóa
                    </Button>
                  )
                }
              />
              <AdminActionRow
                title="Xóa người dùng"
                description="Xóa vĩnh viễn tài khoản này"
                tone="danger"
                actions={
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={actionLoading || isAdmin}
                  >
                    Xóa
                  </Button>
                }
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
