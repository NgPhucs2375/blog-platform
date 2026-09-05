"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  Fingerprint,
  KeyRound,
  LogOut,
  PenLine,
  RefreshCw,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  AmbientBackground,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Divider,
  Grid,
  Heading,
  Inline,
  Stack,
  StatusDot,
  Text,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Landing page — giới thiệu nền tảng, dùng 100% design-system (0 HTML thô).
// ---------------------------------------------------------------------------

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
}

const FEATURES: Feature[] = [
  {
    icon: PenLine,
    title: "Viết & xuất bản",
    description: "Soạn bài, gắn thẻ, phân loại và xuất bản chỉ trong vài bước.",
    points: ["Trình soạn thảo gọn nhẹ", "Tag & category linh hoạt", "Bản nháp và xuất bản"],
  },
  {
    icon: RefreshCw,
    title: "Phiên đăng nhập bền vững",
    description: "Access token ngắn hạn + refresh token xoay vòng, đăng nhập một lần.",
    points: ["Tự gia hạn ngầm khi hết hạn", "Thu hồi từng thiết bị", "Phát hiện token bị đánh cắp"],
  },
  {
    icon: ShieldCheck,
    title: "Bảo mật chuẩn enterprise",
    description: "Mật khẩu bcrypt, validate cả client lẫn server, phân quyền rõ ràng.",
    points: ["Bcrypt + policy mạnh", "JWT HS256 chuẩn", "Khóa/mở tài khoản tức thì"],
  },
];

interface RoleCard {
  icon: LucideIcon;
  badge: string;
  badgeVariant: "solid" | "outline";
  title: string;
  description: string;
  points: string[];
  cta: string;
  href: string;
}

const ROLES: RoleCard[] = [
  {
    icon: Settings,
    badge: "Admin",
    badgeVariant: "solid",
    title: "Dành cho quản trị viên",
    description: "Toàn quyền vận hành nền tảng và kiểm soát người dùng.",
    points: ["Quản lý, phân quyền người dùng", "Khóa / mở khóa tài khoản", "Theo dõi phiên đăng nhập"],
    cta: "Mở bảng quản trị",
    href: "/users",
  },
  {
    icon: BookOpen,
    badge: "Author",
    badgeVariant: "outline",
    title: "Dành cho tác giả",
    description: "Tập trung sáng tạo nội dung, mọi thứ còn lại đã có nền tảng lo.",
    points: ["Hồ sơ cá nhân", "Quản lý bài viết của mình", "Tương tác: like, bình luận, theo dõi"],
    cta: "Tạo tài khoản",
    href: "/register",
  },
];

const STATS = [
  { value: "15 phút", label: "Vòng đời access token" },
  { value: "30 ngày", label: "Phiên refresh bền vững" },
  { value: "2 lớp", label: "Validate client + server" },
];

function Brand() {
  return (
    <Inline gap="sm" align="center">
      <Center className="h-9 w-9 rounded-xl border border-white/10 bg-gradient-to-br from-white/15 to-white/5">
        <Fingerprint className="h-4 w-4 text-white" />
      </Center>
      <Text variant="small" as="span" className="font-bold text-white">
        Blog Platform
      </Text>
    </Inline>
  );
}

function TopBar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <Box className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <Container size="xl">
        <Inline justify="between" align="center" className="py-4">
          <Brand />
          <Inline gap="xs" className="hidden sm:flex">
            <Button variant="ghost" size="sm" href="#features">
              Tính năng
            </Button>
            <Button variant="ghost" size="sm" href="#roles">
              Vai trò
            </Button>
            <Button variant="ghost" size="sm" href="#start">
              Bắt đầu
            </Button>
          </Inline>
          {isAuthenticated ? (
            <Inline gap="sm" align="center">
              <Text variant="small" as="span" className="hidden text-zinc-300 md:block">
                Xin chào, {user?.userName}
              </Text>
              {user?.role === "Admin" ? (
                <Button variant="secondary" size="sm" href="/users">
                  Quản trị
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </Inline>
          ) : (
            <Inline gap="sm" align="center">
              <Button variant="ghost" size="sm" href="/login">
                Đăng nhập
              </Button>
              <Button variant="primary" size="sm" href="/register">
                Bắt đầu
              </Button>
            </Inline>
          )}
        </Inline>
      </Container>
    </Box>
  );
}

function Hero() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <Container size="md">
      <Stack gap="lg" align="center" className="py-20 text-center sm:py-28">
        <Badge variant="outline">
          <StatusDot tone="white" pulse />
          <Text variant="small" as="span" className="text-xs font-medium text-zinc-200">
            Nền tảng blog đa tác giả
          </Text>
        </Badge>

        <Heading level={1} size="hero" align="center" gradient>
          Viết. Xuất bản. Kết nối.
        </Heading>

        <Text variant="muted" align="center" className="max-w-xl text-base sm:text-lg">
          Nền tảng xuất bản nội dung chuẩn doanh nghiệp — bảo mật phiên đăng nhập
          bằng refresh token xoay vòng, phân quyền rõ ràng cho Admin và tác giả.
        </Text>

        {isAuthenticated ? (
          <Inline justify="center" gap="sm">
            {user?.role === "Admin" ? (
              <Button variant="primary" href="/users">
                Mở bảng quản trị
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Badge variant="solid">{user?.role}</Badge>
            )}
            <Button variant="outline" onClick={logout}>
              Đăng xuất
            </Button>
          </Inline>
        ) : (
          <Inline justify="center" gap="md">
            <Button variant="primary" href="/register">
              Tạo tài khoản miễn phí
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" href="/login">
              <KeyRound className="h-4 w-4" />
              Đăng nhập
            </Button>
          </Inline>
        )}

        <Inline justify="center" gap="xl" className="pt-4">
          {STATS.map((s) => (
            <Stack key={s.label} gap="xs" align="center">
              <Heading level={2} size="md" align="center">
                {s.value}
              </Heading>
              <Text variant="caption" align="center">
                {s.label}
              </Text>
            </Stack>
          ))}
        </Inline>
      </Stack>
    </Container>
  );
}

function Features() {
  return (
    <Box id="features">
      <Container size="xl">
        <Stack gap="lg" className="py-16">
          <Stack gap="sm" align="center" className="text-center">
            <Badge variant="outline">Tính năng</Badge>
            <Heading level={2} size="2xl" align="center">
              Mọi thứ bạn cần để vận hành một blog
            </Heading>
            <Text variant="muted" align="center" className="max-w-lg">
              Từ trải nghiệm viết bài đến hạ tầng xác thực — tất cả gói gọn trong một nền tảng.
            </Text>
          </Stack>
          <Grid columns={3}>
            {FEATURES.map((f) => (
              <Card key={f.title} padding="md">
                <Stack gap="md">
                  <Center className="h-12 w-12 rounded-xl border border-white/10 bg-white/5">
                    <f.icon className="h-5 w-5 text-white" />
                  </Center>
                  <Stack gap="xs">
                    <Heading level={3} size="sm">
                      {f.title}
                    </Heading>
                    <Text variant="muted">{f.description}</Text>
                  </Stack>
                  <Stack gap="xs">
                    {f.points.map((p) => (
                      <Inline key={p} gap="sm" align="center">
                        <Check className="h-4 w-4 shrink-0 text-white" />
                        <Text variant="small">{p}</Text>
                      </Inline>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

function Roles() {
  return (
    <Box id="roles">
      <Container size="xl">
        <Stack gap="lg" className="py-16">
          <Stack gap="sm" align="center" className="text-center">
            <Badge variant="outline">Vai trò</Badge>
            <Heading level={2} size="2xl" align="center">
              Một nền tảng, hai trải nghiệm
            </Heading>
          </Stack>
          <Grid columns={2}>
            {ROLES.map((r) => (
              <Card key={r.title} padding="md">
                <Stack gap="md">
                  <Inline justify="between" align="center">
                    <Center className="h-12 w-12 rounded-xl border border-white/10 bg-white/5">
                      <r.icon className="h-5 w-5 text-white" />
                    </Center>
                    <Badge variant={r.badgeVariant}>{r.badge}</Badge>
                  </Inline>
                  <Stack gap="xs">
                    <Heading level={3} size="sm">
                      {r.title}
                    </Heading>
                    <Text variant="muted">{r.description}</Text>
                  </Stack>
                  <Stack gap="xs">
                    {r.points.map((p) => (
                      <Inline key={p} gap="sm" align="center">
                        <Check className="h-4 w-4 shrink-0 text-white" />
                        <Text variant="small">{p}</Text>
                      </Inline>
                    ))}
                  </Stack>
                  <Box className="pt-2">
                    <Button variant="secondary" href={r.href}>
                      {r.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Box>
                </Stack>
              </Card>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

function CtaBand() {
  const { isAuthenticated } = useAuth();

  return (
    <Box id="start">
      <Container size="md">
        <Box className="py-16">
          <Card padding="lg">
            <Stack gap="md" align="center" className="text-center">
              <Center className="h-12 w-12 rounded-xl border border-white/10 bg-white/5">
                <Users className="h-5 w-5 text-white" />
              </Center>
              <Heading level={2} size="xl" align="center">
                Sẵn sàng chia sẻ góc nhìn của bạn?
              </Heading>
              <Text variant="muted" align="center" className="max-w-md">
                Tạo tài khoản trong chưa đầy một phút. Mật khẩu được mã hóa bcrypt,
                phiên đăng nhập duy trì 30 ngày an toàn.
              </Text>
              {isAuthenticated ? (
                <Button variant="primary" href="/login">
                  Tiếp tục
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Inline justify="center" gap="md">
                  <Button variant="primary" href="/register">
                    Đăng ký ngay
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" href="/login">
                    Đăng nhập
                  </Button>
                </Inline>
              )}
            </Stack>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}

function Footer() {
  return (
    <Container size="xl">
      <Box className="pb-10">
        <Divider className="mb-6" />
        <Inline justify="between" align="center">
          <Brand />
          <Text variant="muted" className="text-xs">
            Đồ án Open Source — Blog Platform
          </Text>
        </Inline>
      </Box>
    </Container>
  );
}

export default function Home() {
  return (
    <Box className="relative min-h-screen overflow-hidden">
      <AmbientBackground />
      <Box className="relative z-10">
        <TopBar />
        <Hero />
        <Features />
        <Roles />
        <CtaBand />
        <Footer />
      </Box>
    </Box>
  );
}
