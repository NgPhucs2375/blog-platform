import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/Typography";
import { Center, Stack } from "@/components/ui/Layout";

// ---------------------------------------------------------------------------
// Feedback — Spinner / LoadingState / EmptyState dùng chung toàn app.
// ---------------------------------------------------------------------------

export function Spinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" } as const;
  return <LoaderCircle aria-hidden className={cn("animate-spin", sizes[size], className)} />;
}

export function LoadingState({ message = "Đang tải..." }: { message?: string }) {
  return (
    <Center className="py-20">
      <Stack gap="sm" align="center">
        <Spinner size="lg" className="text-zinc-500" />
        <Text variant="muted">{message}</Text>
      </Stack>
    </Center>
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <Center className="py-20">
      <Stack gap="md" align="center">
        <Text variant="muted" align="center">
          {message}
        </Text>
        {action}
      </Stack>
    </Center>
  );
}
