import type { FormHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FormLabel, Text } from "@/components/ui/Typography";
import { Box } from "@/components/ui/Layout";

// ---------------------------------------------------------------------------
// Form primitives — <form> / <label> / error / hint tập trung tại đây.
// ---------------------------------------------------------------------------

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
}

export function Form({ children, className, ...props }: FormProps) {
  return (
    <form className={cn("space-y-5", className)} {...props}>
      {children}
    </form>
  );
}

export function Field({ children, className }: { children: ReactNode; className?: string }) {
  return <Box className={cn(className)}>{children}</Box>;
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return <FormLabel htmlFor={htmlFor}>{children}</FormLabel>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text variant="error" className="mt-1.5">{message}</Text>;
}

export function FieldHint({ children }: { children: ReactNode }) {
  return (
    <Text variant="muted" className="mt-1.5 text-xs">
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// PasswordChecklist — hiển thị tiến độ đạt rule mật khẩu (register).
// ---------------------------------------------------------------------------

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export function PasswordChecklist({
  rules,
  value,
}: {
  rules: readonly PasswordRule[];
  value: string;
}) {
  if (value.length === 0) return null;
  return (
    <Box className="mt-2 space-y-1">
      {rules.map((rule) => {
        const passed = rule.test(value);
        return (
          <Text
            key={rule.id}
            as="div"
            variant="small"
            className={cn(
              "flex items-center gap-1.5 text-xs",
              passed ? "text-white" : "text-gray-600",
            )}
          >
            {passed ? "✓" : "○"} {rule.label}
          </Text>
        );
      })}
    </Box>
  );
}
