import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Avatar — vòng tròn chữ cái đầu, dùng cho user card / admin.
// ---------------------------------------------------------------------------

const AVATAR_SIZES = {
  sm: "h-8 w-8 text-sm",
  md: "h-14 w-14 text-xl",
  lg: "h-16 w-16 text-2xl",
} as const;

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/15 to-white/5",
        AVATAR_SIZES[size],
        className,
      )}
    >
      <span className="font-bold text-white">{initial}</span>
    </div>
  );
}
