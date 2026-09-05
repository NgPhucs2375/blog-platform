import type { ReactNode } from "react";
import { AuthShell } from "@/components/ui";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
