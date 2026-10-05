# Anum — Cách xây dựng chatbot popup của Blog Platform

> Tài liệu trình bày kiến trúc + quy trình xây dựng chatbot Anum
> (thành phần: `src/components/Chatbot.tsx`, gắn vào trang qua `src/components/SiteChrome.tsx`).

---

## 1. Tổng quan

Anum là **trợ lý biên tập** dạng popup ở góc phải dưới màn hình, xuất hiện trên
các trang công khai (trang chủ, khám phá, đọc bài, auth) và ẩn đi ở khu vực
dashboard/admin. Chatbot chạy hoàn toàn phía client, **không cần backend AI**:
nó hiểu câu hỏi tiếng Việt bằng rule-based NLU và trả lời dựa trên dữ liệu
thật của blog (bài viết, lượt đọc, chuyên mục) lấy qua API hiện có.

Chọn hướng này vì 3 lý do:
1. **Demo được ngay** — không phụ thuộc API key của dịch vụ AI bên ngoài.
2. **Trả lời có dữ liệu thật** — gợi ý bài viết hot/mới bằng đúng số liệu của blog.
3. **Dễ nâng cấp** — điểm nối duy nhất (`getReply`) có thể thay bằng lời gọi
   LLM API sau này mà không đụng vào UI.

## 2. Kiến trúc tổng thể

```
layout.tsx (root)
└── Providers → ThemeProvider, AuthProvider
    ├── Navbar
    ├── main (trang)
    └── SiteChrome.tsx          ← quyết định chỗ nào hiển thị chatbot
        ├── Footer
        └── Chatbot.tsx          ← toàn bộ logic + UI của Anum
```

- **SiteChrome** là client component dùng `usePathname()`: nếu đường dẫn bắt đầu
  bằng `/dashboard`, `/users`, `/categories`, `/reports`, `/moderation-rules`
  thì render `null` (ẩn Footer + Chatbot). Nhờ vậy không cần chỉnh từng trang.
- **Chatbot** chỉ render sau khi component đã **mounted** (`useEffect` +
  `setMounted`). Đây là kỹ thuật chống lỗi **hydration mismatch**: server
  render không biết trạng thái popup, nên để client tự gắn UI sau khi hydrate.

## 3. Cấu trúc UI (3 tầng)

| Tầng | Thành phần | Ghi chú kỹ thuật |
|---|---|---|
| Launcher | Nút tròn gradient, badge số 1 | `motion.button` với spring entrance, `whileHover`/`whileTap`; vòng ping CSS (`animate-ping-ring`) chỉ chạy khi chưa mở lần nào |
| Panel | Khung 384×560, bo góc 24px | `AnimatePresence` + spring `stiffness: 380, damping: 30`, `transformOrigin: bottom right`; đóng bằng nút X hoặc phím Esc (`window.addEventListener('keydown')` có cleanup) |
| Nội dung | Header / Messages / Composer | Header có avatar gradient + chấm trạng thái emerald; Messages là vùng cuộn riêng (`scroll-slim`); Composer là form với nút gửi disable khi rỗng hoặc đang "đang gõ" |

Mỗi tin nhắn là một `motion.div` có entrance (opacity + y + scale). Bong bóng
bot nền `raised`, bo góc lệch trái; bong bóng user nền accent, lệch phải —
quy ước chat quen thuộc.

## 4. Luồng dữ liệu & "hiểu" câu hỏi

### 4.1 Nạp dữ liệu nền (grounding)

Ngay khi component mount, chatbot gọi song song 2 API sẵn có:

```ts
Promise.all([postApi.getPosts(), postApi.getCategories()])
```

Kết quả được lọc chỉ giữ bài `published`, lưu vào state. Nhờ đó mọi câu trả
lời về "đọc nhiều", "mới nhất", "chuyên mục X" đều dùng **số liệu thật**
(lượt xem lấy từ `view_count`, sắp xếp bằng `sort`).

### 4.2 NLU rule-based (`getReply`)

Câu hỏi của user được chuẩn hóa (lowercase, trim) rồi lần lượt so với các
**intent** bằng regex tiếng Việt:

| Intent | Regex bắt | Trả lời |
|---|---|---|
| Chào hỏi | `chào, hello, hi, alo` | Lời chào + gợi ý chip |
| Đọc nhiều | `đọc nhiều, hot, nổi bật, thịnh hành` | Top 3 bài theo lượt xem |
| Mới nhất | `mới nhất, bài mới` | 3 bài mới nhất |
| Chuyên mục | `chuyên mục, chủ đề, category` | Liệt kê + chip từng chuyên mục |
| Chuyên mục cụ thể | tên chuyên mục xuất hiện trong câu | Số bài + 3 bài tiêu biểu của mục đó |
| Hướng dẫn đăng bài | `viết, đăng bài, đóng góp` | Các bước + điều kiện kiểm duyệt |
| Tài khoản | `đăng ký, đăng nhập, mật khẩu` | Hướng dẫn |
| Giới thiệu bot | `anum, bạn là ai` | Persona của Anum |
| Cảm ơn | `cảm ơn, thanks` | Đáp lễ phép |
| Fallback | từ khóa > 2 ký tự khớp tiêu đề bài | Kết quả tìm theo tiêu đề |
| Fallback cuối | không khớp gì | Trả lời trung thực + đưa lại chips gợi ý |

Mỗi intent trả về một object `{ text, posts?, chips? }`:

- `posts` → render thành **thẻ bài viết mini** (thumbnail + tiêu đề + lượt đọc),
  click là `Link` sang `/posts/[id]` và tự đóng popup. Đây là điểm "wow":
  chatbot trả lời bằng sản phẩm thật, không phải câu chữ suông.
- `chips` → các nút gợi ý bấm được, bấm = gửi luôn câu đó (guiding users).

### 4.3 Vòng đời một lượt hội thoại

```
User bấm chip / gõ câu → push tin nhắn user vào state
    → bật "typing indicator" (3 chấm nhảy, CSS keyframes)
    → setTimeout 650-1100ms (random, giả thời gian suy nghĩ)
    → getReply() sinh câu trả lời
    → push tin nhắn bot (kèm posts/chips nếu có)
    → useEffect tự cuộn đáy khung chat (scrollRef.scrollTop = scrollHeight)
```

Trạng thái `typing` cũng vô hiệu hóa nút gửi, tránh user gửi đôi lúc bot
chưa trả lời.

## 5. Chi tiết kỹ thuật đáng chú ý

1. **Chống hydration mismatch**: launcher + panel chỉ render khi `mounted`,
   mọi `motion` đều dùng `initial` **cố định** và chỉ đổi `duration: 0` khi
   `useReducedMotion()` — server và client render giống hệt nhau.
2. **Hiệu năng**: chỉ animate `transform`/`opacity` (GPU-accelerated),
   `will-change` đặt trực tiếp trên panel; không dùng scroll listener nào.
3. **Accessibility**: nút có `aria-label` đổi theo trạng thái, panel có
   `aria-label "Trò chuyện cùng Anum"`, Esc để đóng, nút gửi disable hợp lý.
4. **Reduced motion**: spring thay bằng `duration: 0`, typing delay còn 150ms,
   keyframes float/ping bị tắt ở CSS (`prefers-reduced-motion`).
5. **Lời khai của AI**: dòng nhỏ dưới ô nhập — *"Anum có thể nhầm lẫn. Bạn hãy
   kiểm chứng lại thông tin quan trọng."* — thông lệ của sản phẩm có chatbot.

## 6. Cách mở rộng

- **Thêm intent**: mở `getReply`, thêm 1 nhánh `if (/(regex)/.test(input)) return {...}`
  trước fallback. Không cần sửa UI gì.
- **Nối AI thật (LLM)**: thay body của `getReply` bằng `fetch` tới một endpoint
  backend (ví dụ `/v1/chat`, kèm lịch sử `messages`). UI giữ nguyên vì đầu ra
  chỉ cần `{ text, posts?, chips? }`.
- **Nối OAuth/social**: `SocialAuthButtons` + `authApi.socialLogin(provider)`
  đã chuẩn bị sẵn contract `POST /v1/auth/social/{provider}`; BE trả về
  `AuthResponse` giống login thường là toàn bộ flow chạy.
- **Đổi persona/tên**: sửa header panel + chuỗi greeting trong `buildGreeting()`.
