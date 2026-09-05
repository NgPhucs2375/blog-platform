import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "success" | "error" | "info";

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const ALERT_STYLES: Record<AlertVariant, string> = {
  success: "border-white/15 bg-white/5 text-zinc-100",
  error: "border-red-500/25 bg-red-500/10 text-red-400",
  info: "border-white/15 bg-white/5 text-zinc-200",
};

const ALERT_ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
} as const;

export function Alert({ variant = "info", children, className }: AlertProps) {
  const Icon = ALERT_ICONS[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm",
        ALERT_STYLES[variant],
        className,
      )}
    >
      <Icon aria-hidden className="h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
