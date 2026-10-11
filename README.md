# Blog Platform

Nền tảng blog gồm giao diện Next.js, chatbot, và backend Laravel MVC dùng MySQL. Hướng dẫn này dành cho Windows + Laragon; không cần Docker.

## Thư mục chính

- `be/`: Laravel API, migration, seeder và model.
- `fe/frontend/`: giao diện Next.js và chatbot.
- `README.md`: hướng dẫn cài đặt và chạy dự án.

## Các cập nhật tính năng

### Tính năng mạng xã hội cho blog

- Feed bài viết và trang tác giả, cộng đồng.
- Theo dõi tác giả, bình luận, chia sẻ và đăng lại bài viết.
- Bình chọn, tag, thông báo và bộ lọc nội dung.
- Chỉnh sửa hồ sơ, kiểm duyệt bài viết và báo cáo nội dung.

### Đăng nhập và email

- Xác minh email bằng OTP; hỗ trợ quên và đặt lại mật khẩu.
- Gửi email xác thực và đặt lại mật khẩu qua Brevo API. Resend từng được dùng để thử nghiệm.
- Cấu hình Brevo bằng các biến môi trường; không lưu API key thật trong mã nguồn.

## Yêu cầu

- Laragon có PHP 8.3 trở lên và MySQL.
- Composer, Node.js/npm và Git.
- Dự án đã được clone vào một thư mục, ví dụ `C:\laragon\www\blog-platform-luan`.

## Cách chạy dự án

Mở Laragon Terminal (hoặc terminal có Git), chọn thư mục muốn lưu dự án rồi chạy:

```cmd
cd /d "C:\laragon\www"
git clone -b dev_hung https://github.com/nguyenhung1204/blog-platform-laravel.git blog-platform-luan
cd /d "C:\laragon\www\blog-platform-luan"
```

Nếu mã nguồn đã được gộp sang nhánh khác, thay `dev_hung` bằng tên nhánh được nhóm thống nhất. Sau đó làm theo phần **Cài lần đầu** bên dưới.

> **Lưu ý:** Bật MySQL trong Laragon trước khi chạy. Mỗi lệnh `cd` và lệnh server phải chạy ở đúng thư mục; giữ các cửa sổ server mở.

## Cài lần đầu

### 1. Cài backend Laravel

Mở Laragon Terminal hoặc Cmder. Đổi đường dẫn trong lệnh nếu dự án nằm ở thư mục khác:

```cmd
cd /d "C:\laragon\www\blog-platform-luan\be"
```

Tạo cấu hình local và cài thư viện:

```cmd
copy .env.example .env
composer install
```

Mở `be/.env` bằng Notepad, kiểm tra thông tin MySQL (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`). Database mặc định `blog_platform_laravel` được tạo riêng, không ghi đè database cũ.

Để tạo tài khoản admin demo giống bản cũ, đặt các dòng sau trong `be/.env` trước khi seed:

```env
ADMIN_USERNAME=superadmin
ADMIN_EMAIL=superadmin@gmail.com
ADMIN_PASSWORD=superadmin123@
```

Mật khẩu này chỉ dùng cho demo/local. Với hệ thống công khai, hãy đặt mật khẩu riêng.

Tạo database, sinh app key và chạy migration cùng dữ liệu mẫu:

```cmd
php artisan key:generate
php database/create_database.php
php artisan migrate --seed
```

### 2. Cài frontend Next.js

Mở **tab Cmder mới**, không đóng tab backend:

```cmd
cd /d "C:\laragon\www\blog-platform-luan\fe\frontend"
copy .env.example .env.local
npm install
```

Các file mẫu đã có API URL và Google Client ID của dự án. Nếu cần, kiểm tra `fe/frontend/.env.local` có các biến:

```env
NEXT_PUBLIC_API_URL=/api
LARAVEL_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=Client_ID_của_dự_án
```

Trong `be/.env` cũng cần có cùng Client ID:

```env
GOOGLE_CLIENT_ID=Client_ID_của_dự_án
```

### 3. Chạy dự án

Bật MySQL trong Laragon. Từ thư mục gốc dự án, chạy `run-local.bat` hoặc mở PowerShell và chạy:

```powershell
.\run-local.bat
```

Script tự khởi động Laravel API ở phía sau và Next.js ở cổng 3000. Bạn chỉ cần mở [http://localhost:3000](http://localhost:3000); các lời gọi API được chuyển tiếp tự động, không cần mở địa chỉ cổng 8000. Nhấn `Ctrl+C` trong cửa sổ chạy để dừng.

## Đăng nhập Google

Client ID được điền sẵn trong các file `.env.example`; mỗi máy vẫn cần sao chép thành `.env` và `.env.local` theo hướng dẫn. Origin local là `http://localhost:3000`. Nếu ứng dụng OAuth đang ở trạng thái **Testing**, chủ dự án phải thêm email Google của từng bạn vào danh sách **Test users** trong Google Auth Platform. [Hướng dẫn Client ID của Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) · [Quy định Test users](https://support.google.com/cloud/answer/15549945?hl=en).

Luồng này không cần Client Secret. Không commit `.env` hoặc `.env.local`; Client ID không phải bí mật. Tài khoản Google mới được tạo với quyền User.

## Triển khai backend Laravel lên Render

Repository có Blueprint tại `render.yaml` và Dockerfile tại `be/Dockerfile`. Tạo Blueprint trên Render từ repo này và chọn nhánh `main`; Render sẽ build image Laravel, kiểm tra health tại `/up`, chạy migration rồi khởi động Apache và Laravel scheduler qua `be/render-entrypoint.sh`.

Trong lần tạo Blueprint, điền các biến được đánh dấu `sync: false`. Nếu service đã tồn tại, Render không tự cập nhật các biến `sync: false` khi Blueprint thay đổi, nên cần kiểm tra/điền chúng trong **Dashboard → service → Environment**. Các giá trị secret chỉ nhập trong Dashboard, không commit vào YAML hoặc repo. [Tài liệu Blueprint và biến môi trường của Render](https://render.com/docs/blueprint-spec).

Các biến bắt buộc để API hoạt động:

- `APP_KEY`: tạo bằng `php artisan key:generate --show` trong thư mục `be` ở máy local; giữ nguyên khóa hiện tại khi đã có dữ liệu mã hóa.
- `SUPABASE_DB_USERNAME`, `SUPABASE_DB_PASSWORD`: thông tin pooler của Supabase; các giá trị host/database/port/SSL đã có trong Blueprint.
- `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`: URL frontend đã triển khai, ví dụ `https://ten-web-cua-ban.vercel.app` và cùng origin đó trong danh sách CORS.
- `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`: API key và người gửi đã xác minh trong Brevo. OTP xác minh email và đặt lại mật khẩu gửi bằng Brevo API.
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`: thông tin Cloudflare R2 nếu cần tải/lưu ảnh; bucket mặc định trong Blueprint là `blog-platform-media`.

Blueprint đặt sẵn `MAIL_MAILER=smtp`, `MAIL_HOST=smtp-relay.brevo.com`, `MAIL_PORT=587` và `MAIL_SCHEME=smtp`. Nhập `MAIL_USERNAME` (SMTP login), `MAIL_PASSWORD` (SMTP key) và `MAIL_FROM_ADDRESS` đã xác minh trong Brevo Dashboard; SMTP password không phải `BREVO_API_KEY`. Các email OTP xác minh và đặt lại mật khẩu gửi bằng API qua `BREVO_*`; SMTP phục vụ các luồng Laravel dùng mailer mặc định, như newsletter.

Khi Render báo service **Live**, kiểm tra `https://<api-service>.onrender.com/up` trả về HTTP thành công, sau đó cập nhật URL API và CORS trên frontend. Không dùng `APP_DEBUG=true` trên môi trường công khai.

## OTP đăng ký và quên mật khẩu

Khi đăng ký bằng email (bao gồm Gmail), hệ thống gửi mã OTP 6 chữ số. Mã hết hạn sau 10 phút; nhập mã ở trang xác minh email trước khi đăng nhập. Trang **Quên mật khẩu** gửi liên kết đặt lại mật khẩu, có hiệu lực 60 phút.

OTP đăng ký và đặt lại mật khẩu được gửi qua Brevo API. Để thử luồng này trên máy mới, người chạy cần có API key Brevo và một địa chỉ gửi đã xác minh trong tài khoản Brevo của mình. Mở `be/.env` và điền:

```env
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=your_verified_sender@example.com
BREVO_FROM_NAME="Blog Platform"
FRONTEND_URL=http://localhost:3000
```

Mỗi người nên dùng API key riêng; không gửi key qua chat, không điền key thật vào file mẫu và tuyệt đối không commit `.env` lên GitHub. Nếu chỉ chạy giao diện mà chưa thử OTP thì có thể để trống các biến Brevo. Sau khi sửa cấu hình, chạy `php artisan config:clear` trong thư mục `be` rồi khởi động lại ứng dụng. Việc gửi bằng Gmail miễn phí có thể bị giới hạn hoặc vào Spam; dùng địa chỉ thuộc tên miền đã xác thực sẽ đáng tin cậy hơn.

## Tài khoản admin demo

Nếu đặt các biến `ADMIN_*` ở trên trước khi chạy `php artisan migrate --seed`, có thể đăng nhập bằng `superadmin@gmail.com` và mật khẩu `superadmin123@`. Mỗi máy có database riêng nên tài khoản được seed riêng trên máy đó.

## Lỗi thường gặp

- **`php` không được nhận diện:** mở Laragon Terminal để PHP của Laragon có trong PATH.
- **`next` không được nhận diện:** chạy `npm install` trong `fe/frontend`.
- **`ERR_CONNECTION_REFUSED` ở cổng 3001:** Next.js chưa chạy hoặc tab server đã đóng; chạy lại lệnh Next.js và giữ tab mở.
- **`401: invalid_client` khi đăng nhập Google:** kiểm tra Client ID trong `be/.env` và `fe/frontend/.env.local` giống nhau, đúng với Google Cloud; sau khi đổi `.env.local`, khởi động lại Next.js.
- **Không kết nối MySQL:** kiểm tra MySQL đang bật và thông tin DB trong `be/.env`.

## Đưa code lên GitHub

Push toàn bộ thư mục repository, gồm `be/`, `fe/frontend/` và README này. Không push `.env`, `.env.local`, `vendor/`, `node_modules/` hoặc mật khẩu. Kiểm tra bằng `git status` tại thư mục gốc trước khi commit.
