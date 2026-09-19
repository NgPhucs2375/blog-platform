// Chip màu xoay vòng theo id chuyên mục + hằng số gradient thương hiệu.
// Dùng chung cho trang chủ, trang khám phá và trang đọc bài.
//
// Đang test bảng màu DEEP TEAL (xanh cổ vịt trầm). Bộ Royal Crimson được
// giữ dưới dạng comment: muốn quay lại thì đổi comment giữa 2 phiên bản.

export const CHIP_COLORS = [
  // ===== DEEP TEAL: dải màu lạnh đồng bộ với teal thương hiệu =====
  'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-zinc-300',
  // ===== Royal Crimson (tạm comment) =====
  // 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  // 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  // 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  // 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  // 'bg-pink-50 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
  // 'bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-zinc-300',
];

export const chipStyle = (catId?: number) =>
  CHIP_COLORS[Math.abs(catId ?? 0) % CHIP_COLORS.length];

export const GRADIENT_TEXT =
  // ===== DEEP TEAL =====
  'bg-gradient-to-r from-[#0d9488] via-[#0f766e] to-[#115e59] bg-clip-text text-transparent';
  // ===== Royal Crimson (tạm comment) =====
  // 'bg-gradient-to-r from-[#a61e35] via-[#8c1d2f] to-[#430d18] bg-clip-text text-transparent';

export const GRADIENT_BUTTON =
  // ===== DEEP TEAL =====
  'bg-gradient-to-r from-[#0f766e] via-[#115e59] to-[#134e4a] text-white shadow-lg shadow-[#0f766e]/30';
  // ===== Royal Crimson (tạm comment) =====
  // 'bg-gradient-to-r from-[#8c1d2f] via-[#5e1224] to-[#430d18] text-white shadow-lg shadow-[#8c1d2f]/30';

export const GRADIENT_SURFACE =
  // ===== DEEP TEAL: panel/nền gradient đậm cho khối lớn =====
  'bg-gradient-to-br from-[#115e59] via-[#134e4a] to-[#042f2e]';
  // ===== Royal Crimson (tạm comment) =====
  // 'bg-gradient-to-br from-[#8c1d2f] via-[#5e1224] to-[#2e0a12]';
