import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Feedback";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-white text-black shadow-[0_0_20px_-3px_rgba(255,255,255,0.35)] hover:bg-zinc-200",
        secondary:
          "border border-white/10 bg-white/5 text-white hover:border-white/25 hover:bg-white/10",
        outline:
          "border border-white/15 bg-transparent text-zinc-300 hover:border-white/30 hover:text-white",
        ghost: "bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white",
        danger:
          "border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20",
      },
      size: {
        xs: "px-3 py-1.5 text-xs",
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-2.5 text-sm",
        lg: "w-full py-3 text-sm font-semibold",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  href?: string;
  loading?: boolean;
}

export function Button({
  children,
  variant,
  size,
  href,
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled ?? loading} {...props}>
      {loading ? (
        <>
          <Spinner size="sm" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export { buttonVariants };
