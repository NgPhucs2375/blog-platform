import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/5 text-zinc-400",
        solid: "border-white bg-white text-black",
        outline: "border-white/25 bg-transparent text-zinc-100",
        red: "border-red-500/25 bg-red-500/10 text-red-400",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}

// Chấm trạng thái (thay cho <span class="rounded-full ..."/> viết tay).
export function StatusDot({
  tone = "white",
  pulse = false,
  className,
}: {
  tone?: "white" | "zinc" | "red";
  pulse?: boolean;
  className?: string;
}) {
  const tones = {
    white: "bg-white",
    zinc: "bg-zinc-500",
    red: "bg-red-400",
  } as const;
  return (
    <span
      aria-hidden
      className={cn("h-1.5 w-1.5 rounded-full", tones[tone], pulse && "animate-pulse", className)}
    />
  );
}

export { badgeVariants };
