"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "@/components/ui/Input";

export interface PasswordInputProps extends Omit<InputProps, "type" | "onToggle"> {
  visible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

/** Ô mật khẩu có nút hiện/ẩn tích hợp (không cần viết button + svg ở page). */
export function PasswordInput({
  hasError = false,
  className,
  visible: controlledVisible,
  onVisibilityChange,
  ...props
}: PasswordInputProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const visible = controlledVisible ?? internalVisible;

  const toggle = () => {
    const next = !visible;
    if (onVisibilityChange) onVisibilityChange(next);
    else setInternalVisible(next);
  };

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        hasError={hasError}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-gray-500 transition-colors hover:text-white"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
