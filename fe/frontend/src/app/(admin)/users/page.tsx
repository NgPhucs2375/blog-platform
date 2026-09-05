"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminApi } from "@/services/adminApi";
import type { Pagination as PaginationType, User } from "@/types/auth";
import {
  Badge,
  Box,
  Button,
  ColumnHeader,
  Form,
  Inline,
  Input,
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

const TABLE_COLUMNS = 7;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminApi.getUsers({
          page: currentPage,
          limit: 10,
          search: searchQuery || undefined,
          role: roleQuery || undefined,
        });
        if (!cancelled) {
          setUsers(res.users);
          setPagination(res.pagination);
        }
      } catch {
        // API not available yet
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentPage, searchQuery, roleQuery]);

  const refresh = () => setCurrentPage((p) => p);

  const handleLock = async (id: number) => {
    setActionLoading(id);
    try {
      await adminApi.lockUser(id);
      refresh();
    } catch {
      // handle error
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async (id: number) => {
    setActionLoading(id);
    try {
      await adminApi.unlockUser(id);
      refresh();
    } catch {
      // handle error
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${name}"?`)) return;
    setActionLoading(id);
    try {
      await adminApi.deleteUser(id);
      refresh();
    } catch {
      // handle error
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearchQuery(search);
    setRoleQuery(roleFilter);
  };

  return (
    <Box>
      <PageHeader
        title="Quản lý người dùng"
        description={`${pagination.total} người dùng tổng cộng`}
      />

      <Form onSubmit={handleSearch} className="mb-6">
        <Inline gap="sm">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            aria-label="Tìm theo tên hoặc email"
            className="max-w-md flex-1 py-2.5"
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={ROLE_OPTIONS}
            placeholder="Tất cả role"
            aria-label="Lọc theo role"
          />
          <Button type="submit" variant="secondary" size="sm" className="px-5 py-2.5">
            Tìm
          </Button>
        </Inline>
      </Form>

      <TableShell>
        <Table>
          <TableHead>
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
              <TableStateRow colSpan={TABLE_COLUMNS} message="Không tìm thấy người dùng nào." />
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hoverable>
                  <TableCell>{user.id}</TableCell>
                  <TableCell tone="default">
                    <TableLink href={`/users/${user.id}`}>{user.userName}</TableLink>
                  </TableCell>
                  <TableCell tone="muted">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "Admin" ? "solid" : "default"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "Active" ? "outline" : "red"}>
                      <StatusDot tone={user.status === "Active" ? "white" : "red"} />
                      <Text variant="small" as="span" className="text-xs font-medium">
                        {user.status === "Active" ? "Hoạt động" : "Đã khóa"}
                      </Text>
                    </Badge>
                  </TableCell>
                  <TableCell tone="faint">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell align="right">
                    <Inline justify="end" gap="xs">
                      <Button variant="outline" size="xs" href={`/users/${user.id}`}>
                        Chi tiết
                      </Button>
                      {user.status === "Active" ? (
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => handleLock(user.id)}
                          disabled={actionLoading === user.id}
                        >
                          Khóa
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleUnlock(user.id)}
                          disabled={actionLoading === user.id}
                        >
                          Mở khóa
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleDelete(user.id, user.userName)}
                        disabled={actionLoading === user.id || user.role === "Admin"}
                      >
                        Xóa
                      </Button>
                    </Inline>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableShell>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setCurrentPage} />
    </Box>
  );
}
