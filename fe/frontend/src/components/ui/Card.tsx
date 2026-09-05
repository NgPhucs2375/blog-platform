import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Card — khối nội dung chuẩn: rounded-2xl + border + backdrop-blur.
// ---------------------------------------------------------------------------

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "sm" | "md" | "lg";
}

const CARD_PADDING = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

export function Card({ children, padding = "lg", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-zinc-950/60 shadow-[0_0_50px_-10px_rgba(255,255,255,0.06)] backdrop-blur-xl",
        CARD_PADDING[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("text-lg font-semibold text-white", className)} {...props}>
      {children}
    </div>
  );
}

export function CardDescription({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("mt-1 text-sm text-zinc-400", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }: CardProps) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("mt-6 flex items-center gap-3", className)} {...props}>
      {children}
    </div>
  );
}
