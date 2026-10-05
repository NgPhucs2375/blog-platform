<?php
declare(strict_types=1);

/**
 * Front Controller — entry point duy nhất của API (nginx trỏ mọi /api/* về đây).
 * Chỉ làm bootstrap: dựng Container → CORS → Router dispatch.
 * Route, middleware, DI wiring nằm trong src/WebApi (xem Container::class).
 */

require_once __DIR__ . '/../vendor/autoload.php';

use src\WebApi\Container;
use src\WebApi\Services\ResponseService;

header('Content-Type: application/json; charset=utf-8');

try {
    $container = new Container();

    // Preflight OPTIONS kết thúc tại đây (204), request thường đi tiếp.
    $container->cors()->handle();

    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $container->router()->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $uri);
} catch (Throwable $e) {
    // Lưới an toàn cuối: lỗi boot (DB, JWT_SECRET, trùng route...) → JSON 500.
    ResponseService::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
}
