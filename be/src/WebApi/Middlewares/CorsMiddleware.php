<?php
declare(strict_types=1);

namespace src\WebApi\Middlewares;

/**
 * Middleware CORS chạy đầu pipeline, thay khối header() viết tay
 * trong public/index.php.
 *
 * - Origin cho phép đọc từ env CORS_ORIGIN (nhiều origin cách nhau bằng dấu phẩy),
 *   mặc định giữ 'http://localhost:3000' đúng hành vi hiện tại.
 * - Request preflight OPTIONS được trả 204 và kết thúc ngay tại đây,
 *   không đi tiếp vào Router.
 */
class CorsMiddleware
{
    /** @var string[] */
    private array $allowedOrigins;

    /**
     * @param string[]|null $allowedOrigins null → đọc env CORS_ORIGIN → default localhost:3000
     */
    public function __construct(
        ?array $allowedOrigins = null,
        private string $allowedMethods = 'GET, POST, PUT, DELETE, OPTIONS',
        private string $allowedHeaders = 'Content-Type, Authorization',
        private int $maxAge = 86400
    ) {
        if ($allowedOrigins === null) {
            $fromEnv = getenv('CORS_ORIGIN');
            $allowedOrigins = $fromEnv !== false && trim((string) $fromEnv) !== ''
                ? array_map('trim', explode(',', (string) $fromEnv))
                : [];
        }
        $this->allowedOrigins = $allowedOrigins !== []
            ? array_values($allowedOrigins)
            : ['http://localhost:3000'];
    }

    public function handle(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;

        if ($origin !== null && in_array($origin, $this->allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
        } elseif (in_array('*', $this->allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: *');
        } else {
            // Giữ hành vi cũ cho client không gửi Origin (curl, Postman, server-to-server).
            header('Access-Control-Allow-Origin: ' . $this->allowedOrigins[0]);
        }

        header('Access-Control-Allow-Methods: ' . $this->allowedMethods);
        header('Access-Control-Allow-Headers: ' . $this->allowedHeaders);
        header('Access-Control-Max-Age: ' . $this->maxAge);

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
