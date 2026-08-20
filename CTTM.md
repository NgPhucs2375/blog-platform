blog-platform/
├── .vscode/                           # Cấu hình môi trường phát triển VS Code
│   ├── extensions.json                # Đề xuất extensions chuẩn cho dự án (PHP, Next.js, Docker)
│   ├── launch.json                    # Cấu hình Xdebug cho PHP Backend và Debugger cho Next.js
│   └── settings.json                  # Cấu hình format code, linter (PHP CS Fixer, ESLint, Prettier)
│
├── docker/                            # Cấu hình môi trường Containerization
│   ├── backend/
│   │   ├── Dockerfile                 # PHP 8.2+ FPM, cài đặt extensions (pdo_mysql, redis, xdebug)
│   │   └── php.ini                    # Cấu hình bộ nhớ, upload size, opcache
│   ├── frontend/
│   │   └── Dockerfile                 # Node.js 20+ runtime cho Next.js
│   ├── nginx/
│   │   ├── Dockerfile                 # Reverse proxy & Web Server
│   │   └── default.conf               # Định tuyến API về PHP Backend và SSR về Next.js
│   └── mysql/
│       └── my.cnf                     # Tối ưu hóa cấu hình MySQL 8.0
│
├── backend/                           # Dịch vụ Backend PHP (Mô hình Clean Architecture)
│   ├── config/                        # Cấu hình hệ thống (database, jwt, redis, app)
│   ├── database/                      # Quản lý CSDL
│   │   ├── migrations/                # Schema DDL (users, categories, posts, comments, logs)
│   │   └── seeders/                   # Dữ liệu mẫu khởi tạo ban đầu (Admin account, base categories)
│   ├── public/                        # Web root
│   │   └── index.php                  # Application Entry Point
│   ├── routes/                        # Khai báo tuyến đường API
│   │   ├── api.php                    # Routes cho User và Public APIs
│   │   └── admin.php                  # Routes riêng cho Admin APIs
│   ├── src/                           # Mã nguồn cốt lõi chia theo 4 tầng Clean Architecture
│   │   ├── Domain/                    # [TẦNG 1: DOMAIN] - Nghiệp vụ thuần túy, độc lập framework
│   │   │   ├── Entities/              # User.php, Category.php, Post.php, Comment.php, SystemLog.php
│   │   │   ├── Enums/                 # UserRole.php, AccountStatus.php, PostStatus.php, CommentStatus.php, LogAction.php
│   │   │   ├── Exceptions/            # DomainException.php, InvalidPostStatusException.php
│   │   │   └── Repositories/          # Contracts/Interfaces: UserRepositoryInterface.php, PostRepositoryInterface.php,...
│   │   │
│   │   ├── Application/               # [TẦNG 2: APPLICATION] - Xử lý Use Cases và điều phối luồng
│   │   │   ├── DTOs/                  # Data Transfer Objects (RegisterUserDTO.php, CreatePostDTO.php,...)
│   │   │   ├── Interfaces/            # Interfaces dịch vụ ngoài (TokenServiceInterface.php, HasherInterface.php)
│   │   │   └── UseCases/              # Mỗi hành động là 1 UseCase class độc lập
│   │   │       ├── Auth/              # RegisterUserUseCase.php, LoginUseCase.php
│   │   │       ├── Category/          # CreateCategoryUseCase.php, DeleteCategoryUseCase.php
│   │   │       ├── Post/              # CreatePostUseCase.php, SubmitForApprovalUseCase.php, ApprovePostUseCase.php
│   │   │       ├── Comment/           # AddCommentUseCase.php, ApproveCommentUseCase.php, HideCommentUseCase.php
│   │   │       ├── Report/            # GetSystemStatisticsUseCase.php, GetAuthorStatisticsUseCase.php
│   │   │       └── Log/               # GetSystemLogsUseCase.php
│   │   │
│   │   ├── Infrastructure/            # [TẦNG 3: INFRASTRUCTURE] - Cài đặt kỹ thuật & kết nối ngoại vi
│   │   │   ├── Logging/               # SystemLogDatabaseService.php (Ghi vết vào bảng SystemLogs)
│   │   │   ├── Persistence/           # Database Implementations
│   │   │   │   ├── Models/            # ORM/Data Models ánh xạ các bảng CSDL
│   │   │   │   └── Repositories/      # Cài đặt cụ thể: MySqlUserRepository.php, MySqlPostRepository.php,...
│   │   │   └── Security/              # JwtTokenService.php, BcryptHasher.php
│   │   │
│   │   └── Presentation/              # [TẦNG 4: PRESENTATION] - Giao tiếp Client / HTTP Layer
│   │       ├── Controllers/           # Tiếp nhận Request, gọi UseCase, trả về Response
│   │       │   ├── Admin/             # AdminPostController.php, CategoryController.php, ReportController.php
│   │       │   ├── AuthController.php
│   │       │   ├── PostController.php
│   │       │   └── CommentController.php
│   │       ├── Middleware/            # JwtAuthMiddleware.php, RoleAdminMiddleware.php
│   │       ├── Requests/              # Request Validators (LoginRequest.php, CreatePostRequest.php)
│   │       └── Resources/             # JSON API Transformers (PostResource.php, UserResource.php)
│   ├── tests/                         # Unit tests (Domain/UseCases) & Integration tests
│   ├── composer.json                  # Khai báo PSR-4 autoloading và dependencies
│   └── phpunit.xml                    # Cấu hình kiểm thử tự động
│
├── frontend/                          # Dịch vụ Frontend Next.js (App Router, TypeScript)
│   ├── public/                        # Tệp tĩnh (favicon, icons, static assets)
│   ├── src/
│   │   ├── app/                       # Routing hệ thống (Next.js App Router)
│   │   │   ├── (auth)/                # Route Group: Xác thực
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (public)/              # Route Group: Giao diện người đọc (SSR tối ưu SEO)
│   │   │   │   ├── page.tsx           # Trang chủ & Danh sách bài viết
│   │   │   │   ├── posts/[slug]/page.tsx # Chi tiết bài viết & Bình luận
│   │   │   │   └── categories/[slug]/page.tsx
│   │   │   ├── dashboard/             # Route Group: Bảng điều khiển tác giả
│   │   │   │   ├── posts/
│   │   │   │   │   ├── page.tsx       # Quản lý bài viết cá nhân
│   │   │   │   │   └── create/page.tsx # Trình soạn thảo bài viết
│   │   │   │   └── profile/page.tsx
│   │   │   └── admin/                 # Route Group: Trang Quản trị (Admin Portal)
│   │   │       ├── users/page.tsx     # Quản lý tài khoản (Active / Locked)
│   │   │       ├── categories/page.tsx
│   │   │       ├── posts/page.tsx     # Duyệt bài viết (Pending -> Published)
│   │   │       ├── comments/page.tsx  # Duyệt / Ẩn bình luận
│   │   │       ├── reports/page.tsx   # Biểu đồ thống kê
│   │   │       └── logs/page.tsx      # Lịch sử xử lý hệ thống
│   │   ├── components/                # Reusable UI Components
│   │   │   ├── common/                # Button, Modal, Table, Input, Pagination
│   │   │   ├── editor/                # Trình soạn thảo Rich Text (Tiptap / WYSIWYG)
│   │   │   ├── layout/                # Header, Footer, AdminSidebar, UserSidebar
│   │   │   └── charts/                # Biểu đồ Recharts / Chart.js cho Reports
│   │   ├── hooks/                     # Custom React Hooks (useAuth, usePosts, useDebounce)
│   │   ├── lib/                       # Cấu hình Axios Interceptor (Header Bearer Token, Refresh Token)
│   │   ├── services/                  # Tầng gọi API Backend (authApi.ts, postApi.ts, adminApi.ts)
│   │   ├── types/                     # TypeScript Definitions (User, Post, Category, Comment, ApiResponse)
│   │   └── styles/                    # Global styles (Tailwind CSS configuration)
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── .dockerignore                      # Danh sách loại trừ khi build Docker image
├── .env.example                       # File mẫu biến môi trường (DB credentials, JWT secrets, APP_URL)
├── .gitignore                         # Danh sách loại trừ của Git (vendor/, node_modules/, .env)
├── docker-compose.yml                 # Orchestration cho toàn bộ các containers (PHP, Node, MySQL, Redis, Nginx)
├── Makefile                           # Phím tắt lệnh quản trị (make up, make down, make migrate, make seed)
└── README.md                          # Tài liệu hướng dẫn thiết lập và vận hành hệ thống