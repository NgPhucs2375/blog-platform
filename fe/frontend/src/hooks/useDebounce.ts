"use client";

import { useEffect, useState } from "react";

/** Trì hoãn giá trị (dùng cho ô search để bớt gọi API). */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
