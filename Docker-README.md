# CHẠY 1 LẦN DUY NHẤT #
# ############################################### #
# khởi động toàn bộ cụm (Dựng và tải các máy chủ ảo)
    docker compose up -d --build
# chạy composer bên trong container BE (tải thư viện PHP)
    docker compose exec backend composer install
# ################################################ #

# Checl trạng thái cáci container
    docker compose ps
# Dừng và tắt hệ thống
    docker compose down
# Xem logs
    docker compose logs -f

# ################################################ #
# lệnh bật
    docker compose up -d