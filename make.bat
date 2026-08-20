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
) else (
    echo Lenh khong hop le. Cac lenh ho tro: up, down, build, restart, install, logs, ps, backend-sh, db-sh, clean
)