import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Heading, Text } from "@/components/ui/Typography";
import { Box, Center, Inline, Stack } from "@/components/ui/Layout";
import { Card } from "@/components/ui/Card";

// ---------------------------------------------------------------------------
// Auth primitives — header / card / footer chuẩn cho login & register.
// ---------------------------------------------------------------------------

export function AuthIconBadge({ children }: { children: ReactNode }) {
  return (
    <Center
      className={cn(
        "mb-6 h-16 w-16 rounded-2xl border border-white/10 backdrop-blur-sm",
        "bg-gradient-to-br from-white/15 to-white/5",
      )}
    >
      {children}
    </Center>
  );
}

interface AuthHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthHeader({ icon, title, subtitle }: AuthHeaderProps) {
  return (
    <Stack gap="sm" align="center" className="mb-8 text-center">
      <AuthIconBadge>{icon}</AuthIconBadge>
      <Heading level={1} size="xl" align="center">
        {title}
      </Heading>
      <Text variant="muted" align="center">
        {subtitle}
      </Text>
    </Stack>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Card
      padding="lg"
      className="border-white/10 bg-white/[0.03] shadow-[0_0_50px_-12px_rgba(255,255,255,0.08)]"
    >
      {children}
    </Card>
  );
}

interface AuthFooterProps {
  prompt: string;
  linkHref: string;
  linkLabel: string;
}

export function AuthFooter({ prompt, linkHref, linkLabel }: AuthFooterProps) {
  return (
    <Box className="mt-6 text-center">
      <Text variant="muted" as="span">
        {prompt}{" "}
      </Text>
      <Link
        href={linkHref}
        className="text-sm font-medium text-white transition-colors hover:text-zinc-300"
      >
        {linkLabel}
      </Link>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Admin primitives — shell + sidebar chuẩn cho khu vực quản trị.
// ---------------------------------------------------------------------------

export interface AdminNavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

interface SidebarLinkProps {
  item: AdminNavItem;
  active: boolean;
}

export function SidebarLink({ item, active }: SidebarLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}

interface AdminShellProps {
  children: ReactNode;
  brand: ReactNode;
  nav: ReactNode;
  footerNav?: ReactNode;
}

export function AdminShell({ children, brand, nav, footerNav }: AdminShellProps) {
  return (
    <Box className="flex min-h-screen">
      <Box className="min-h-screen w-64 shrink-0 border-r border-white/10 bg-white/[0.02] p-4">
        <Stack gap="lg">
          {brand}
          <Box>{nav}</Box>
          {footerNav ? (
            <Box className="mt-8 border-t border-white/10 pt-4">{footerNav}</Box>
          ) : null}
        </Stack>
      </Box>
      <Box className="flex-1 overflow-auto p-8">{children}</Box>
    </Box>
  );
}

interface AdminBrandProps {
  href: string;
  icon: ReactNode;
  title: string;
}

export function AdminBrand({ href, icon, title }: AdminBrandProps) {
  return (
    <Link href={href} className="mb-6 flex items-center gap-2 px-3 py-2">
      <Center className="h-8 w-8 rounded-lg border border-white/10 bg-gradient-to-br from-white/15 to-white/5">
        {icon}
      </Center>
      <Text variant="small" as="span" className="font-bold text-white">
        {title}
      </Text>
    </Link>
  );
}

interface AdminActionRowProps {
  title: string;
  description: string;
  actions: ReactNode;
  tone?: "default" | "danger";
}

/** Hàng cài đặt trong trang detail (Phân quyền / Khóa / Xóa). */
export function AdminActionRow({ title, description, actions, tone = "default" }: AdminActionRowProps) {
  return (
    <Inline
      justify="between"
      align="center"
      className={cn(
        "rounded-xl border p-4",
        tone === "danger"
          ? "border-red-500/10 bg-red-500/[0.03]"
          : "border-white/5 bg-white/[0.02]",
      )}
    >
      <Stack gap="xs">
        <Text
          variant="small"
          as="div"
          className={cn("font-medium", tone === "danger" ? "text-red-400" : "text-white")}
        >
          {title}
        </Text>
        <Text variant="muted" as="div" className="text-xs">
          {description}
        </Text>
      </Stack>
      <Inline gap="sm">{actions}</Inline>
    </Inline>
  );
}
