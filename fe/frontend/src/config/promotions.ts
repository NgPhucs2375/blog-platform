// ============================================================
// NỘI DUNG QUẢNG CÁO & SỰ KIỆN — chỗ duy nhất cần chỉnh khi
// muốn thay ảnh / chữ / link. Không cần đụng vào component.
//
// Cách đổi ảnh:
//   1. Thay giá trị `image` bằng đường dẫn ảnh mới (URL hoặc
//      file đặt trong fe/frontend/public, ví dụ "/banner-tet.jpg").
//   2. Sửa title / description / cta.label / cta.href tùy ý.
//   3. Lưu file — trang chủ tự cập nhật.
//
// Dữ liệu bên dưới là dữ liệu mẫu (mock) cho lúc demo.
// ============================================================

export interface PromoBannerData {
  /** Ảnh nền banner — thay URL này khi cần đổi hình */
  image: string;
  /** Nhãn nhỏ phía trên tiêu đề (để rỗng '' sẽ ẩn đi) */
  eyebrow: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  /** Nhãn phụ góc phải (để rỗng '' sẽ ẩn đi) */
  tag: string;
}

export interface EventTicketData {
  /** Ảnh đại diện sự kiện — thay URL này khi cần đổi hình */
  image: string;
  /** Ngày tổ chức (hiển thị trên khối vé) */
  day: string;
  month: string;
  title: string;
  location: string;
  time: string;
  /** Số ghế còn lại, hiển thị trạng thái vé */
  seatsLeft: number;
  cta: { label: string; href: string };
  /** 'open' | 'almost-full' | 'closed' — đổi màu nhãn vé */
  status: 'open' | 'almost-full' | 'closed';
}

export const PROMO_BANNER: PromoBannerData = {
  image: 'https://picsum.photos/seed/blog-banner-crimson/1600/500',
  eyebrow: 'Chuỗi hoạt động tháng này',
  title: 'Viết để được đọc: workshop biên tập 2 buổi cuối tuần',
  description:
    'Hai buổi thực hành cùng ban biên tập Blog Platform: chọn đề tài, cấu trúc bài và biên tập drafts.',
  cta: { label: 'Xem chi tiết', href: '/posts' },
  tag: 'Miễn phí cho thành viên',
};

export const EVENT_TICKETS: EventTicketData[] = [
  {
    image: 'https://picsum.photos/seed/blog-ticket-1/640/420',
    day: '12',
    month: 'TH10',
    title: 'Gặp gỡ tác giả: viết công nghệ cho người không kỹ thuật',
    location: 'Hội trường A, Cơ sở 1',
    time: '14:00 - 16:30',
    seatsLeft: 24,
    cta: { label: 'Đăng ký vé', href: '/register' },
    status: 'open',
  },
  {
    image: 'https://picsum.photos/seed/blog-ticket-2/640/420',
    day: '26',
    month: 'TH10',
    title: 'Minh họa bài viết: từ ảnh dựng sẵn đến bản quyền',
    location: 'Trực tuyến qua Google Meet',
    time: '19:30 - 21:00',
    seatsLeft: 6,
    cta: { label: 'Đăng ký vé', href: '/register' },
    status: 'almost-full',
  },
];
