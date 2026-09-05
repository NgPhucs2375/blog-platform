"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Alert,
  AuthCard,
  AuthFooter,
  AuthHeader,
  Button,
  Field,
  FieldLabel,
  Form,
  Input,
  PasswordInput,
} from "@/components/ui";

function RegisteredNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("registered") !== "1") return null;
  return <Alert variant="success">Đăng ký thành công! Mời bạn đăng nhập.</Alert>;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      router.push("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr?.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeader
        icon={<KeyRound className="h-8 w-8 text-white" />}
        title="Chào mừng trở lại"
        subtitle="Đăng nhập để tiếp tục"
      />
      <AuthCard>
        <Suspense fallback={null}>
          <RegisteredNotice />
        </Suspense>
        {error ? <Alert variant="error">{error}</Alert> : null}
        <Form onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" variant="primary" size="lg" loading={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </Form>
      </AuthCard>
      <AuthFooter prompt="Chưa có tài khoản?" linkHref="/register" linkLabel="Đăng ký ngay" />
    </>
  );
}
