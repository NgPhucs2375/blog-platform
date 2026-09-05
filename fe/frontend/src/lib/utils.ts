import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge classNames với tailwind-merge. Dùng cho toàn bộ UI kit. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
