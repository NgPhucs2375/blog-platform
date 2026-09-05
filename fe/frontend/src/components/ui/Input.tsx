import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Input primitives — tầng duy nhất render <input> / <select> / <option>.
// Pages truyền props + options, không viết tag form thô.
// ---------------------------------------------------------------------------

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const INPUT_BASE =
  "w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-gray-600 transition-all duration-300 outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError = false, className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        INPUT_BASE,
        hasError
          ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30"
          : "border-white/10 focus:border-white/40 focus:ring-white/10",
        className,
      )}
      {...props}
    />
  );
});

// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ options, placeholder, className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition outline-none focus:border-transparent focus:ring-2 focus:ring-white/15",
        className,
      )}
      {...props}
    >
      {placeholder ? (
        <option value="" className="bg-gray-900">
          {placeholder}
        </option>
      ) : null}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-gray-900">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
