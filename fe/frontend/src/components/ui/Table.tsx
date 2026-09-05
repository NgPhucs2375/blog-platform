import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/Typography";

// ---------------------------------------------------------------------------
// Table primitives — tầng duy nhất render table / thead / tbody / tr / th / td.
// ---------------------------------------------------------------------------

export function TableShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full text-sm">{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-white/10">{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  hoverable = false,
}: {
  children: ReactNode;
  hoverable?: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-b border-white/5 transition last:border-0",
        hoverable && "hover:bg-white/[0.02]",
      )}
    >
      {children}
    </tr>
  );
}

export function ColumnHeader({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-6 py-4 font-medium text-gray-400",
        align === "left" && "text-left",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  align = "left",
  tone = "default",
}: {
  children: ReactNode;
  align?: "left" | "right" | "center";
  tone?: "default" | "muted" | "faint";
}) {
  const tones = {
    default: "text-gray-300",
    muted: "text-gray-400",
    faint: "text-gray-500",
  } as const;
  return (
    <td
      className={cn(
        "px-6 py-4",
        tones[tone],
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </td>
  );
}

/** Hàng trạng thái (loading / empty) chiếm toàn bộ bảng. */
export function TableStateRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <Text variant="muted" align="center">
          {message}
        </Text>
      </td>
    </tr>
  );
}

/** Link trong ô bảng (tên user -> trang chi tiết). */
export function TableLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
    >
      {children}
    </Link>
  );
}
