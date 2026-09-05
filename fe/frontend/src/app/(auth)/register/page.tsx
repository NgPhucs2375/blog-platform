"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Alert,
  AuthCard,
  AuthFooter,
  AuthHeader,
  Button,
  Field,
  FieldError,
  FieldLabel,
  Form,
  Input,
  PasswordChecklist,
  PasswordInput,
  type PasswordRule,
} from "@/components/ui";

// Chuẩn mật khẩu enterprise (mirror với BE):
// >= 8 ký tự + chữ hoa + chữ thường + số + ký tự đặc biệt.
const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: "length", label: "Ít nhất 8 ký tự", test: (v: string) => v.length >= 8 },
  { id: "lower", label: "Có chữ thường (a-z)", test: (v: string) => /[a-z]/.test(v) },
  { id: "upper", label: "Có chữ hoa (A-Z)", test: (v: string) => /[A-Z]/.test(v) },
  { id: "digit", label: "Có chữ số (0-9)", test: (v: string) => /[0-9]/.test(v) },
  {
    id: "special",
    label: "Có ký tự đặc biệt (!@#...)",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
];

const USERNAME_RE = /^[A-Za-z0-9._-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterFieldErrors {
  userName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface RegisterValues {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function validate(values: RegisterValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const userName = values.userName.trim();
  const email = values.email.trim();

  if (!userName) {
    errors.userName = "Vui lòng nhập tên người dùng.";
  } else if (userName.length < 3 || userName.length > 50) {
    errors.userName = "Tên người dùng phải từ 3–50 ký tự.";
  } else if (!USERNAME_RE.test(userName)) {
    errors.userName = "Chỉ dùng chữ, số và . _ -";
  }

  if (!email) {
    errors.email = "Vui lòng nhập email.";
  } else if (email.length > 255) {
    errors.email = "Email quá dài (tối đa 255 ký tự).";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Địa chỉ email không hợp lệ.";
  }

  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else {
    const failed = PASSWORD_RULES.filter((r) => !r.test(values.password));
    if (failed.length > 0) {
      errors.password = `Mật khẩu chưa đạt: ${failed.map((r) => r.label).join(", ")}.`;
    }
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearField = (field: keyof RegisterFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    const errors = validate({ userName, email, password, confirmPassword });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await register({ userName: userName.trim(), email: email.trim(), password });
      router.push("/login?registered=1");
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string; errors?: Record<string, string> };
        };
      };
      const data = axiosErr?.response?.data;
      if (data?.errors && typeof data.errors === "object") {
        setFieldErrors(data.errors as RegisterFieldErrors);
      } else if (axiosErr?.response?.status === 409) {
        if (data?.message?.toLowerCase().includes("email")) {
          setFieldErrors({ email: data.message });
        } else if (
          data?.message?.toLowerCase().includes("người dùng") ||
          data?.message?.toLowerCase().includes("username")
        ) {
          setFieldErrors({ userName: data.message });
        } else {
          setGeneralError(data?.message || "Thông tin đã được sử dụng.");
        }
      } else {
        setGeneralError(data?.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthHeader
        icon={<UserPlus className="h-8 w-8 text-white" />}
        title="Tạo tài khoản"
        subtitle="Bắt đầu hành trình của bạn"
      />
      <AuthCard>
        {generalError ? <Alert variant="error">{generalError}</Alert> : null}
        <Form onSubmit={handleSubmit} noValidate>
          <Field>
            <FieldLabel htmlFor="userName">Tên người dùng</FieldLabel>
            <Input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                clearField("userName");
              }}
              autoFocus
              hasError={Boolean(fieldErrors.userName)}
              placeholder="NguyenVanA"
            />
            <FieldError message={fieldErrors.userName} />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearField("email");
              }}
              autoComplete="email"
              hasError={Boolean(fieldErrors.email)}
              placeholder="you@example.com"
            />
            <FieldError message={fieldErrors.email} />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
            <PasswordInput
              id="password"
              value={password}
              visible={showPassword}
              onVisibilityChange={setShowPassword}
              onChange={(e) => {
                setPassword(e.target.value);
                clearField("password");
                clearField("confirmPassword");
              }}
              autoComplete="new-password"
              hasError={Boolean(fieldErrors.password)}
              placeholder="Ít nhất 8 ký tự, đủ 4 nhóm"
            />
            <FieldError message={fieldErrors.password} />
            <PasswordChecklist rules={PASSWORD_RULES} value={password} />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu</FieldLabel>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              visible={showConfirm}
              onVisibilityChange={setShowConfirm}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearField("confirmPassword");
              }}
              autoComplete="new-password"
              hasError={Boolean(fieldErrors.confirmPassword)}
              placeholder="Nhập lại mật khẩu"
            />
            <FieldError message={fieldErrors.confirmPassword} />
          </Field>

          <Button type="submit" variant="primary" size="lg" loading={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </Form>
      </AuthCard>
      <AuthFooter prompt="Đã có tài khoản?" linkHref="/login" linkLabel="Đăng nhập" />
    </>
  );
}
