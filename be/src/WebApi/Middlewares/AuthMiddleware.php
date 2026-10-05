<?php
declare(strict_types=1);

namespace src\WebApi\Middlewares;

use src\WebApi\Services\ResponseService;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class AuthMiddleware
{
    public function __construct(
        private ?string $secretKey = null
    ) {
        $this->secretKey = $secretKey ?: (getenv('JWT_SECRET') ?: 'fallback-secret-key');
    }

    public function handle(): array
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            ResponseService::error("Truy cập bị từ chối. Token xác thực không tồn tại.", 401);
        }

        try {
            $token = $matches[1];
            // Sử dụng thư viện chuẩn để giải mã và xác thực
            $decoded = JWT::decode($token, new Key($this->secretKey, 'HS256'));
            
            // Trả về array payload
            return (array) $decoded;
        } catch (Exception $e) {
            ResponseService::error("Token không hợp lệ hoặc đã hết hạn: " . $e->getMessage(), 401);
        }
    }
}