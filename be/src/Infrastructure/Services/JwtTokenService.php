<?php
declare(strict_types=1);

namespace src\Infrastructure\Services;

use Firebase\JWT\JWT;

/**
 * Cấp phát token theo cặp access + refresh:
 * - Access token (JWT-HS256, TTL ngắn 15 phút): gắn vào mọi request API.
 *   Dùng thư viện chuẩn firebase/php-jwt để encode — cùng lib với
 *   AuthMiddleware khi decode, không còn lệch base64 tự chế như trước.
 * - Refresh token (chuỗi ngẫu nhiên opaque, TTL 30 ngày): CHỈ dùng 1 lần
 *   để xin cặp mới khi access hết hạn. DB chỉ lưu hash SHA-256 của nó.
 */
class JwtTokenService
{
    public const ACCESS_TTL = 900;      // 15 phút
    public const REFRESH_TTL = 2592000; // 30 ngày

    private string $secretKey;
    private int $accessTtl;
    private int $refreshTtl;

    public function __construct(
        ?string $secretKey = null,
        int $accessTtl = self::ACCESS_TTL,
        int $refreshTtl = self::REFRESH_TTL
    ) {
        $this->secretKey = $secretKey ?: (getenv('JWT_SECRET') ?: 'fallback-secret-key');
        $this->accessTtl = $accessTtl;
        $this->refreshTtl = $refreshTtl;
    }

    public function generateAccessToken(int $userId, string $role): string
    {
        $now = time();
        return JWT::encode(
            [
                'sub' => $userId,
                'role' => $role,
                'iat' => $now,
                'exp' => $now + $this->accessTtl,
            ],
            $this->secretKey,
            'HS256'
        );
    }

    /**
     * @return array{token:string, hash:string, expiresAt:int}
     * Trả cả token plain (gửi 1 lần duy nhất cho client) và hash (lưu DB).
     */
    public function generateRefreshToken(): array
    {
        $token = bin2hex(random_bytes(32)); // 64 ký tự hex
        return [
            'token' => $token,
            'hash' => self::hashRefreshToken($token),
            'expiresAt' => time() + $this->refreshTtl,
        ];
    }

    public static function hashRefreshToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public function getAccessTtl(): int
    {
        return $this->accessTtl;
    }

    public function getRefreshTtl(): int
    {
        return $this->refreshTtl;
    }
}
