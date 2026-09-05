@echo off
if "%1"=="up" (
    docker compose up -d
) else if "%1"=="down" (
    docker compose down
) else if "%1"=="build" (
    docker compose up -d --build
) else if "%1"=="restart" (
    docker compose restart
) else if "%1"=="install" (
    docker compose exec backend composer install
) else if "%1"=="update" (
    docker compose exec backend composer update
) else if "%1"=="test" (
    docker compose exec backend vendor/bin/phpunit
) else if "%1"=="autoload" (
    docker compose exec backend composer dump-autoload
) else if "%1"=="logs" (
    docker compose logs -f
) else if "%1"=="ps" (
    docker compose ps
) else if "%1"=="backend-sh" (
    docker compose exec backend sh
) else if "%1"=="frontend-sh" (
    docker compose exec frontend sh
) else if "%1"=="db-sh" (
    docker compose exec postgres psql -U blog_user -d blog_db
) else if "%1"=="clean" (
    docker compose down -v
) else if "%1"=="help" (
    echo Danh sach lenh quan tri he thong:
    echo   make up           - Khoi dong toan bo cum container ngam
    echo   make down         - Tat va huy bo toan bo container
    echo   make restart      - Khoi dong lai cac container
    echo   make build        - Build lai images va khoi dong he thong
    echo   make logs         - Theo doi nhat ky thoi gian thuc cua cac dich vu
    echo   make ps           - Kiem tra trang thai hoat dong cua cac container
    echo   make install      - Cai dat thu vien Backend (Composer)
    echo   make update       - Cap nhat thu vien Backend (Composer Update)
    echo   make test         - Chay Unit Test kiem thu he thong (PHPUnit)
    echo   make autoload     - Tao lai autoload mapping cho Composer
    echo   make backend-sh   - Truy cap vao shell cua container PHP Backend
    echo   make frontend-sh  - Truy cap vao shell cua container Next.js Frontend
    echo   make db-sh        - Mo cua so dong lenh PostgreSQL (psql)
    echo   make clean        - Xoa toan bo container va o dia volume (Reset DB)
) else (
    echo Lenh khong hop le. Cac lenh ho tro: up, down, build, restart, install, update, test, autoload, logs, ps, backend-sh, frontend-sh, db-sh, clean, help
)