import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import {
  Users,
  Folders,
  ChartBar,
  ShieldWarning,
  Heart,
  ChatCircle,
  Sparkle,
} from "@phosphor-icons/react";

// ============================================================
// Cấu hình điều hướng & thông báo — nguồn sự thật cho toàn bộ
// Navbar (public), AdminSidebar / AdminTopbar và NotificationBell.
// Sửa menu ở đây, mọi component liên quan tự cập nhật.
// ============================================================

/** Icon component của Phosphor — cho phép truyền weight để đổi phong cách. */
export type IconComponent = ComponentType<IconProps>;

/** Mục điều hướng khu vực quản trị (sidebar + tabs đồng bộ theo route). */
export interface AdminNavItem {
  /** Đường dẫn gốc — active khi pathname bắt đầu bằng giá trị này */
  href: string;
  label: string;
  description: string;
  icon: IconComponent;
}

export const ADMIN_NAV: AdminNavItem[] = [
  {
    href: "/users",
    label: "Người dùng",
    description: "Tài khoản, vai trò và phiên đăng nhập",
    icon: Users,
  },
  {
    href: "/categories",
    label: "Chuyên mục",
    description: "Danh mục nội dung của tạp chí",
    icon: Folders,
  },
  {
    href: "/reports",
    label: "Báo cáo",
    description: "Thống kê đọc, viết và kiểm duyệt",
    icon: ChartBar,
  },
  {
    href: "/moderation-rules",
    label: "Kiểm duyệt",
    description: "Quy tắc tự động và hàng chờ bài viết",
    icon: ShieldWarning,
  },
];

export const ADMIN_PREFIXES = ADMIN_NAV.map((item) => item.href);

/** Link chân trang — Footer đọc trực tiếp. */
export interface FooterLink {
  href: string;
  label: string;
}

export const FOOTER_COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Khám phá",
    links: [
      { href: "/", label: "Trang chủ" },
      { href: "/posts", label: "Khám phá bài viết" },
    ],
  },
  {
    title: "Cộng đồng",
    links: [
      { href: "/register", label: "Trở thành tác giả" },
      { href: "/login", label: "Đăng nhập" },
      { href: "/dashboard", label: "Bảng điều khiển" },
    ],
  },
];

/** Loại thông báo mà hệ thống hỗ trợ (mock — sau này nối BE). */
export type NotificationType = "comment" | "reaction" | "system";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

export const NOTIFICATION_META: Record<
  NotificationType,
  { icon: IconComponent; cls: string; label: string }
> = {
  comment: {
    icon: ChatCircle,
    cls: "bg-accent-soft text-accent",
    label: "Bình luận",
  },
  reaction: {
    icon: Heart,
    cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    label: "Lượt thích",
  },
  system: {
    icon: Sparkle,
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    label: "Hệ thống",
  },
};

/** Dữ liệu mock — thay bằng fetch /v1/notifications khi BE sẵn sàng. */
export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    type: "comment",
    title: "Bài 'Viết code như viết văn' có bình luận mới",
    detail: "Nguyễn Hải Yến: 'Bài viết súc tích và đúng trọng tâm...'",
    time: "2 giờ trước",
    read: false,
  },
  {
    id: 2,
    type: "reaction",
    title: "Bài viết của bạn vượt 500 lượt đọc",
    detail: "'Hà Nội trong trẻo' vừa đạt mốc đọc tuần này.",
    time: "5 giờ trước",
    read: false,
  },
  {
    id: 3,
    type: "system",
    title: "Bài viết đã qua kiểm duyệt",
    detail: "'Từ Excel đến Postgres' chính thức lên sóng.",
    time: "Hôm qua",
    read: true,
  },
];
