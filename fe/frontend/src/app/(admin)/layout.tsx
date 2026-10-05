import type { ReactNode } from "react";
import AdminShell from "@/components/layout/AdminShell";

// Khu quản trị dùng shell riêng (sidebar + topbar + tabs),
// tách biệt hoàn toàn với header/footer của khu công khai.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
