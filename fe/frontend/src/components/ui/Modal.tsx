"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/Typography";
import { Inline, Stack } from "@/components/ui/Layout";

// ---------------------------------------------------------------------------
// Modal — hộp thoại xác nhận dùng chung (thay confirm() native).
// - Đóng bằng ESC / click backdrop / nút Hủy.
// - Khóa scroll body khi mở.
// ---------------------------------------------------------------------------

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export function Modal({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  tone = "default",
  loading = false,
  children,
  onConfirm,
  onClose,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
      >
        <Stack gap="md">
          <Stack gap="xs">
            <Heading level={2} size="md">
              {title}
            </Heading>
            {description ? <Text variant="muted">{description}</Text> : null}
          </Stack>
          {children}
          <Inline justify="end" gap="sm">
            <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              size="sm"
              onClick={onConfirm}
              loading={loading}
              className={cn(tone === "default" && "px-5")}
            >
              {confirmLabel}
            </Button>
          </Inline>
        </Stack>
      </div>
    </div>
  );
}
