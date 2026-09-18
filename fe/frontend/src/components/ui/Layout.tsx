import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { Heading, Text } from "@/components/ui/Typography";

// ---------------------------------------------------------------------------
// Layout primitives — tầng duy nhất được phép render div / section / main.
// Pages compose các component này thay vì viết <div> thủ công.
// ---------------------------------------------------------------------------

type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

const GAP_CLASS: Record<Gap, string> = {
  none: "gap-0",
  xs: "gap-1.5",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
};

interface BoxProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

export function Box({ children, className, style, id }: BoxProps) {
  return (
    <div className={cn(className)} style={style} id={id}>
      {children}
    </div>
  );
}

interface StackProps extends BoxProps {
  gap?: Gap;
  align?: "start" | "center" | "end" | "stretch";
  className?: string;
}

const STACK_ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;

/** Cột dọc (flex-col). */
export function Stack({ children, gap = "md", align = "stretch", className, style }: StackProps) {
  return (
    <div className={cn("flex flex-col", GAP_CLASS[gap], STACK_ALIGN[align], className)} style={style}>
      {children}
    </div>
  );
}

interface InlineProps extends StackProps {
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
}

const INLINE_JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
} as const;

/** Hàng ngang (flex-row). */
export function Inline({
  children,
  gap = "sm",
  align = "center",
  justify = "start",
  wrap = false,
  className,
  style,
}: InlineProps) {
  return (
    <div
      className={cn(
        "flex flex-row",
        GAP_CLASS[gap],
        STACK_ALIGN[align],
        INLINE_JUSTIFY[justify],
        wrap && "flex-wrap",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function Center({ children, className, style }: BoxProps) {
  return (
    <div className={cn("flex items-center justify-center", className)} style={style}>
      {children}
    </div>
  );
}

interface ContainerProps extends BoxProps {
  size?: "sm" | "md" | "lg" | "xl";
}

const CONTAINER_SIZE = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-6xl",
} as const;

export function Container({ children, size = "md", className, style }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full", CONTAINER_SIZE[size], className)} style={style}>
      {children}
    </div>
  );
}

interface GridProps extends BoxProps {
  columns?: 1 | 2 | 3 | 4;
  gap?: Gap;
}

const GRID_COLUMNS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const;

export function Grid({ children, columns = 2, gap = "md", className, style }: GridProps) {
  return (
    <div className={cn("grid", GRID_COLUMNS[columns], GAP_CLASS[gap], className)} style={style}>
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div aria-hidden className={cn("border-t border-white/10", className)} />;
}

// ---------------------------------------------------------------------------
// Page-level shells
// ---------------------------------------------------------------------------

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/** Khung trang public full-screen, căn giữa + nền ambient. */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <main className={cn("relative flex min-h-screen flex-col overflow-hidden px-6", className)}>
      <AmbientBackground />
      <Center className="relative z-10 min-h-screen w-full py-12">{children}</Center>
    </main>
  );
}

interface AuthShellProps {
  children: ReactNode;
  className?: string;
}

/** Khung layout cho các trang auth (login / register):
    panel biên tập bên trái (cố định tông ink cả 2 theme) + form bên phải. */
export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <div className={cn("bg-canvas", className)}>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#a4161a] via-[#7a0f18] to-[#4f060e] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div
            aria-hidden
            className="animate-float pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/15 blur-[110px]"
          />
          <div
            aria-hidden
            className="animate-float pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-amber-300/25 blur-[110px]"
            style={{ animationDelay: '1.8s' }}
          />

          <p className="relative font-serif text-2xl font-bold tracking-tight">
            Blog Platform<span className="text-amber-200">.</span>
          </p>

          <div className="relative">
            <span aria-hidden className="font-serif text-7xl leading-none text-white/60">
              &ldquo;
            </span>
            <p className="mt-2 max-w-md font-serif text-3xl font-bold leading-snug xl:text-4xl">
              Mỗi câu chuyện đều xứng đáng được <em className="italic text-amber-200">kể đúng cách</em>.
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/75">
              Tham gia cộng đồng tác giả của Blog Platform: nơi tri thức, trải nghiệm
              và góc nhìn cá nhân được xuất bản với chuẩn biên tập của một tạp chí.
            </p>
          </div>

          <dl className="relative grid grid-cols-3 gap-4 text-xs">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <dt className="text-white/70">Xuất bản</dt>
              <dd className="mt-1 font-bold">Tự do, đa lĩnh vực</dd>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <dt className="text-white/70">Biên tập</dt>
              <dd className="mt-1 font-bold">Kiểm duyệt kịp thời</dd>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <dt className="text-white/70">Cộng đồng</dt>
              <dd className="mt-1 font-bold">Thảo luận trực tiếp</dd>
            </div>
          </dl>
        </aside>

        <main className="flex items-center justify-center px-4 py-12 sm:px-8">
          <div className="relative z-10 w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Tiêu đề chuẩn cho trang (admin / dashboard). */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <Inline justify="between" align="center" className={cn("mb-8", className)}>
      <Stack gap="xs">
        <Heading level={1} size="lg">
          {title}
        </Heading>
        {description ? <Text variant="muted">{description}</Text> : null}
      </Stack>
      {actions ? <Inline gap="sm">{actions}</Inline> : null}
    </Inline>
  );
}
