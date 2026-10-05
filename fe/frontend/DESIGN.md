# DESIGN.md — Design Direction cho Blog Platform FE

> Tài liệu định hướng thiết kế, viết sau khi audit code + visual audit (screenshot home/posts/detail/login ở cả light + dark, viewport 1440×900).
> Áp dụng theo `design-taste-frontend` skill. Bản thân hiện trạng khá tốt — khuyến nghị là **targeted evolution**, KHÔNG overhaul.

---

## 1. Design Read

**"Reading this as: editorial magazine blog (tạp chí điện tử) cho độc giả Việt Nam + cộng đồng tác giả, với ngôn ngữ editorial tiết chế, leaning toward Tailwind v4 + Geist/Lora + indigo accent, dual light/dark mode."**

Định vị: giữa **tạp chí điện tử** (VnExpress International, The Atlantic) và **nền tảng viết cộng đồng** (Medium, Substack). Homepage đã đọc đúng hướng này (masthead bar, lead story, trending sidebar) — giữ làm xương sống.

### Dials

| Dial | Hiện trạng | Đề xuất | Lý do |
|---|---|---|---|
| DESIGN_VARIANCE | 4 | **6-7** | Lưới 3 cột đều nhau hiện quá đều; cần nhịp bất đối xứng kiểu tạp chí |
| MOTION_INTENSITY | 2 (CSS transition) | **5** | Editorial tiết chế; chỉ motion có mục đích (reveal, state transition, reading progress) |
| VISUAL_DENSITY | 3-4 | **3** | Giữ thoáng, tạp chí không phải dashboard |

---

## 2. Audit — Điều gì GIỮ

| Thứ | Vị trí | Vì sao giữ |
|---|---|---|
| Font stack Geist Sans + Geist Mono + **Lora** (vi subsets) | `app/layout.tsx` | Serif Lora là lựa chọn đúng và được justify cho publication; Geist nằm trong pool khuyến nghị |
| Cấu trúc editorial homepage: masthead → headline → ticker → lead 8/4 + trending sidebar | `app/page.tsx` | Đúng IA tạp chí, trending số 01-04 bằng serif rất đẹp |
| Nền dark `#06080e` + surface `white/[0.02-0.06]`, light `zinc-50` | toàn site | Off-black đúng chuẩn, không dùng #000 |
| Navbar 64px 1 dòng, sticky + backdrop-blur | `components/Navbar.tsx` | Đúng cap ≤ 80px, không vi phạm |
| Category ticker pills, 1 CTA / intent | home | Rõ ràng, không duplicate intent |
| Label TRÊN input, helper rõ | auth pages | Đúng chuẩn form |
| Không có scroll listener tay, không rAF loop | toàn site | Sạch perf, nền tảng tốt để thêm motion |

## 3. Audit — Điều gì SỬA / BỎ (theo độ ưu tiên)

### P0 — Gap lớn nhất: KHÔNG CÓ HÌNH ẢNH
Trang tạp chí mà 100% text. `cover_image` đã có trong data model và **trang detail đã render**, nhưng home + cards + grid không bao giờ dùng.
- **Lead story bắt buộc có ảnh hero** (3:2, rounded-2xl, bên phải hoặc trên tiêu đề).
- Card trong grid: thumbnail 16:9 trên cùng.
- Ảnh bìa trống → fallback theo category: `https://picsum.photos/seed/{post.slug}/800/450` (seed theo slug để ổn định), xử lý CSS `saturate-[.85]` để tông ảnh hòa với nền.
- Related posts + trending: có thumbnail nhỏ 1:1 hoặc bỏ trống được, ưu tiên related.

### P0 — Bug + data giả
1. `Navbar.tsx:208` — class `animate-in slide-in-from-top-2` là của `tailwindcss-animate`, plugin KHÔNG cài trong Tailwind v4 → class chết. Thay bằng CSS transition/`motion/react`.
2. Trending topics masthead hardcode ("Lối sống tối giản", "Kinh tế số"...) — data giả baked-in UI. Sử dụng top categories/post theo `view_count` thật, hoặc bỏ hẳn bar này nếu chưa có data.
3. `likeCount` khởi tạo 12 cứng + comment mock "HoangDev" (generic name tell) — **BE CommentController + CommentRepository vừa hoàn thành** (nhánh dev-phuc): wire comment qua API ngay, like cần endpoint hoặc bỏ số.
4. Avatar tác giả trong author box dùng gradient `indigo→purple` — AI-purple tell. Avatar chữ: nền solid indigo-600, bỏ gradient.

### P1 — Hệ thống màu + token
Hiện màu hardcode rải rác (`#06080e`, `#0c121e`, `#080c14`, `white/[0.03]`...), token trong `globals.css` không dùng (`--background: #f8fafc` là slate-50 trong khi body dùng zinc-50 `#fafafa` — lệch). Chuyển về **semantic tokens** Tailwind v4:

```css
:root {
  --bg: #fafafa;            /* zinc-50 */
  --surface: #ffffff;
  --surface-2: #f4f4f5;     /* zinc-100 */
  --line: #e4e4e7;          /* zinc-200 */
  --ink: #09090b;           /* zinc-950 */
  --ink-2: #52525b;         /* zinc-600 */
  --accent: #4f46e5;        /* indigo-600 */
  --accent-soft: #eef2ff;   /* indigo-50 */
}
.dark {
  --bg: #06080e;
  --surface: #0c121e;
  --surface-2: #111827;
  --line: rgba(255,255,255,0.08);
  --ink: #fafafa;
  --ink-2: #a1a1aa;
  --accent: #818cf8;        /* indigo-400 */
  --accent-soft: rgba(99,102,241,0.12);
}
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
}
```
- Thay toàn bộ `bg-zinc-*`, `dark:bg-[#06080e]`, `dark:bg-[#0c121e]/80`, `border-zinc-200/80 dark:border-white/[0.08]`... bằng `bg-bg`, `bg-surface`, `border-line` → xóa được hack `!important` focus input trong globals.css.
- **Accent lock: chỉ indigo.** Rose CHỈ giữ cho semantic like/heart. "Đọc nhiều nhất tuần" đổi rose → indigo hoặc zinc.
- Radius lock: pill cho category/chip, `rounded-2xl` cho card, `rounded-xl` cho button/input. Không trộn 3xl vào card nhỏ.

### P1 — Typography lock
- **Serif (Lora) = mọi display tiêu đề bài viết**: h1 home, lead title, card titles, h1 detail, h1 /posts. Hiện tại home dùng serif nhưng /posts + detail lại sans → thiếu nhất quán, mất chất tạp chí.
- Sans (Geist) = UI: labels, meta, button, nav, body prose.
- Prose đọc bài: tăng cỡ `text-lg` + `leading-[1.8]` + `max-w-[65ch]`, Lora cho body prose cũng cân nhắc (đọc dài, chuẩn báo).

### P1 — Layout nhịp tạp chí (thay lưới 3 cột đều)
Lưới "Dòng chảy bài viết mới" hiện là 3 cột card identical lặp lại = AI tell. Thay bằng nhịp 1 hàng đặc biệt:
- Row 1: 1 card lớn (ảnh + title) 2/3 + 2 card dọc xếp tầng 1/3.
- Row 2+: xen kẽ 1 card full-width ngang (ảnh trái 40% + text phải) giữa các hàng 3 card nhỏ, hoặc xen 1 quote/chuyên mục strip.
- Related posts ở detail: giữ 3 cột vì list ngắn, nhưng thêm thumbnail.

### P2 — Motion (motion/react — đã có skill framer-motion)
Nguyên tắc: mỗi animation phải trả lời được "nó truyền đạt điều gì". Không pin/scrub, không cần GSAP ở blog (giữ gsap-core skill cho landing marketing sau này).
- **Card/section reveal**: `whileInView` + stagger 0.06s, `ease: [0.16, 1, 0.3, 1]` (pattern 5.C của taste skill) — truyền đạt thứ tự đọc.
- **Category pills**: `layoutId` cho active pill background — state transition mượt.
- **Reading progress bar** trang detail: `useScroll` + `scaleX` — storytelling (đã đọc đến đâu). Bar 2px indigo, fixed top.
- **Like button**: spring scale khi active — feedback.
- Giữ hover lift CSS hiện tại của card (đã đủ).
- Mọi thứ wrap `useReducedMotion()`.

### P2 — SEO + trạng thái
- `generateMetadata` cho `/posts/[id]` (title, description từ excerpt, OG image từ cover) — hiện chỉ có title static toàn site.
- Loading: thay spinner bằng **skeleton khớp shape layout** (lead card skeleton + 4 sidebar row skeleton).
- Empty state hiện tại ổn, giữ.

---

## 4. Đề xuất theo từng surface

| Surface | Việc chính |
|---|---|
| **Home** | Thêm ảnh lead + thumbnails, nhịp grid mới (P1), reveal motion, trending label đổi màu, skeleton |
| **/posts** | Phân vai rõ: đây là ARCHIVE (filter + search đầy đủ, pagination),featured card dùng layout khác home lead để tránh trùng; serif cho h1 |
| **/posts/[id]** | Serif h1, reading progress, wire comment API (BE đã xong), tác giả box bỏ gradient, prose style chuẩn báo (Lora body, 65ch) |
| **/login /register** | Ổn, chỉ cần đồng bộ token màu mới + thêm visual nhẹ (panel trái editorial quote hoặc minh họa) nếu muốn nâng cấp |
| **/dashboard** | Chưa audit sâu bằng screenshot (cần login); theo code là bảng + form chuẩn — chỉ đồng bộ token + skeleton, không redesign |
| **Admin pages** | Giữ nguyên vai trò tool UI, chỉ đồng bộ token |

## 5. Roadmap thực hiện

1. **P0 (nửa buổi):** sửa bug (animate-in, trending hardcode, gradient avatar), wire comment API, ảnh fallback cho cards + lead.
2. **P1 (1 buổi):** refactor semantic tokens trong globals.css + thay class toàn site, typography serif lock, nhịp grid mới cho home.
3. **P2 (1 buổi):** motion layer (reveal, layoutId pills, reading progress), skeleton loaders, generateMetadata + OG.
4. **P3:** dashboard/admin đồng bộ, polish auth pages.

## 6. Pre-flight checklist rút gọn (chạy trước khi ship mỗi PR)

- [ ] Mọi ảnh render đúng tỉ lệ, có fallback khi cover rỗng
- [ ] Chỉ 1 accent (indigo); rose chỉ ở heart/like
- [ ] Serif cho mọi tiêu đề bài viết, sans cho UI
- [ ] Không em-dash `—` trong copy hiển thị
- [ ] Không data giả hardcode (trending, like, comment)
- [ ] Motion có lý do + wrap reduced-motion
- [ ] Dark + light đều đã soi screenshot
- [ ] Skeleton thay spinner cho mọi fetch chính
