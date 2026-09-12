"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/services/adminApi";
import type { Pagination as PaginationType, User } from "@/types/auth";

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  sort: string;
  includeDeleted: boolean;
}

interface UseUsersOptions {
  page: number;
  limit?: number;
  filters: UserFilters;
  /** Tăng để ép refetch sau lock/unlock/delete (fix bug set cùng giá trị). */
  reloadKey: number;
}

function getErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as { response?: { data?: { message?: string } } };
  return axiosErr?.response?.data?.message || fallback;
}

/**
 * Hook dùng chung cho trang admin/users: fetch list + phân trang + lỗi.
 * Tách khỏi page để list/detail tái sử dụng, dễ test.
 */
export function useUsers({ page, limit = 10, filters, reloadKey }: UseUsersOptions) {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminApi.getUsers({
          page,
          limit,
          search: filters.search || undefined,
          role: filters.role || undefined,
          status: filters.status || undefined,
          sort: filters.sort || undefined,
          includeDeleted: filters.includeDeleted || undefined,
        });
        if (!cancelled) {
          setUsers(res.users);
          setPagination(res.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setUsers([]);
          setError(getErrorMessage(err, "Không tải được danh sách người dùng."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, limit, filters.search, filters.role, filters.status, filters.sort, filters.includeDeleted, reloadKey]);

  return { users, pagination, loading, error };
}
