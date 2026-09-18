// Chip màu xoay vòng theo id chuyên mục + hằng số gradient thương hiệu.
// Dùng chung cho trang chủ, trang khám phá và trang đọc bài.
//
// Đang test bảng màu ROYAL CRIMSON. Bộ indigo-violet được giữ dưới dạng
// comment ở mỗi khối: muốn quay lại thì đổi comment giữa 2 phiên bản.

export const CHIP_COLORS = [
  // ===== ROYAL CRIMSON: dải màu ấm đồng bộ với đỏ thương hiệu =====
  'bg-red-50 text-red-700 dark:bg-red-700/15 dark:text-red-300',
  'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-pink-50 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-zinc-300',
  // ===== Indigo-Violet (tạm comment) =====
  // 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  // 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  // 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  // 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  // 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  // 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
];

export const chipStyle = (catId?: number) =>
  CHIP_COLORS[Math.abs(catId ?? 0) % CHIP_COLORS.length];

export const GRADIENT_TEXT =
  // ===== ROYAL CRIMSON =====
  'bg-gradient-to-r from-[#b3131c] via-[#a4161a] to-[#5c0a14] bg-clip-text text-transparent';
  // ===== Indigo-Violet (tạm comment) =====
  // 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent';

export const GRADIENT_BUTTON =
  // ===== ROYAL CRIMSON =====
  'bg-gradient-to-r from-[#a4161a] via-[#7a0f18] to-[#4f060e] text-white shadow-lg shadow-[#a4161a]/30';
  // ===== Indigo-Violet (tạm comment) =====
  // 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/25';

export const GRADIENT_SURFACE =
  // ===== ROYAL CRIMSON: panel/nút nền gradient đậm hơn cho khối lớn =====
  'bg-gradient-to-br from-[#8f0f1c] via-[#7a0f18] to-[#3a040b]';
  // ===== Indigo-Violet (tạm comment) =====
  // 'bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500';
