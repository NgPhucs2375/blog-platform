import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Typography — tầng duy nhất được phép render h1-h4 / p / span / label.
// Pages chỉ dùng các component này, không viết tag HTML thô.
// ---------------------------------------------------------------------------

type HeadingLevel = 1 | 2 | 3 | 4;

interface HeadingProps {
  children: ReactNode;
  level?: HeadingLevel;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "hero";
  align?: "left" | "center" | "right";
  tone?: "white" | "muted" | "default";
  gradient?: boolean;
  className?: string;
}

const HEADING_TAGS = { 1: "h1", 2: "h2", 3: "h3", 4: "h4" } as const;

const HEADING_SIZES: Record<NonNullable<HeadingProps["size"]>, string> = {
  sm: "text-lg font-semibold tracking-tight",
  md: "text-xl font-bold tracking-tight",
  lg: "text-2xl font-bold tracking-tight",
  xl: "text-3xl font-bold tracking-tight",
  "2xl": "text-4xl font-extrabold tracking-tight",
  hero: "text-5xl font-extrabold tracking-tight sm:text-6xl",
};

const HEADING_ALIGN = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

const HEADING_TONE = {
  white: "text-white",
  muted: "text-zinc-400",
  default: "text-zinc-100",
} as const;

export function Heading({
  children,
  level = 1,
  size = "lg",
  align = "left",
  tone = "white",
  gradient = false,
  className,
}: HeadingProps) {
  const Tag = HEADING_TAGS[level];
  return (
    <Tag
      className={cn(
        HEADING_SIZES[size],
        HEADING_ALIGN[align],
        gradient
          ? "bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent"
          : HEADING_TONE[tone],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------

interface TextProps {
  children: ReactNode;
  variant?: "body" | "muted" | "small" | "caption" | "error";
  as?: "p" | "span" | "div";
  align?: "left" | "center" | "right";
  className?: string;
}

const TEXT_VARIANTS = {
  body: "text-base text-zinc-200 leading-relaxed",
  muted: "text-sm text-zinc-400 leading-relaxed",
  small: "text-sm text-zinc-300",
  caption: "text-xs uppercase tracking-wider text-zinc-400",
  error: "text-xs text-red-400",
} as const;

export function Text({
  children,
  variant = "body",
  as = "p",
  align = "left",
  className,
}: TextProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        TEXT_VARIANTS[variant],
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

// ---------------------------------------------------------------------------

interface FormLabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

export function FormLabel({ children, htmlFor, className }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-sm font-medium text-zinc-400", className)}
    >
      {children}
    </label>
  );
}
