.PHONY: help up down restart build logs ps install update test backend-sh frontend-sh db-sh clean

# Hiển thị danh sách các lệnh hỗ trợ
help:
	@echo "Danh sách lệnh quản trị hệ thống:"
	@echo "  make up           - Khởi động toàn bộ cụm container ngầm"
	@echo "  make down         - Tắt và hủy bỏ toàn bộ container"
	@echo "  make restart      - Khởi động lại các container"
	@echo "  make build        - Build lại images và khởi động hệ thống"
	@echo "  make logs         - Theo dõi nhật ký thời gian thực của các dịch vụ"
	@echo "  make ps           - Kiểm tra trạng thái hoạt động của các container"
	@echo "  make install      - Cài đặt thư viện Backend (Composer)"
	@echo "  make update       - Cập nhật thư viện Backend (Composer Update)"
	@echo "  make test         - Chạy Unit Test kiểm thử hệ thống (PHPUnit)"
	@echo "  make backend-sh   - Truy cập vào shell của container PHP Backend"
	@echo "  make frontend-sh  - Truy cập vào shell của container Next.js Frontend"
	@echo "  make db-sh        - Mở cửa sổ dòng lệnh PostgreSQL (psql)"
	@echo "  make clean        - Xóa toàn bộ container và ổ đĩa volume (Reset DB)"

# Quản lý Container
up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

build:
	docker compose up -d --build

logs:
	docker compose logs -f

ps:
	docker compose ps

# Quản lý Backend PHP & Composer
install:
	docker compose exec backend composer install

update:
	docker compose exec backend composer update

test:
	docker compose exec backend ./vendor/bin/phpunit

# Truy cập Terminal nội bộ Container
backend-sh:
	docker compose exec backend sh

frontend-sh:
	docker compose exec frontend sh

db-sh:
	docker compose exec postgres psql -U blog_user -d blog_db

# Reset toàn bộ môi trường và dữ liệu
clean:
	docker compose down -v