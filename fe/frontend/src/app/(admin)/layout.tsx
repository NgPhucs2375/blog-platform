"use client";

import { usePathname } from "next/navigation";
import { ArrowLeft, Settings, Users } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  AdminBrand,
  AdminShell,
  Box,
  SidebarLink,
  Stack,
  type AdminNavItem,
} from "@/components/ui";

const NAV_ITEMS: readonly AdminNavItem[] = [
  { label: "Quản lý người dùng", href: "/users", icon: Users },
];

const HOME_ITEM: AdminNavItem = { label: "Về trang chủ", href: "/", icon: ArrowLeft };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute requiredRole="Admin">
      <AdminShell
        brand={
          <AdminBrand
            href="/users"
            title="Admin Panel"
            icon={<Settings className="h-4 w-4 text-white" />}
          />
        }
        nav={
          <Stack gap="xs">
            {NAV_ITEMS.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
              />
            ))}
          </Stack>
        }
        footerNav={
          <Box>
            <SidebarLink item={HOME_ITEM} active={false} />
          </Box>
        }
      >
        {children}
      </AdminShell>
    </ProtectedRoute>
  );
}
