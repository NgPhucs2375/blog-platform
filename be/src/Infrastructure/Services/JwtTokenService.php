<?php

namespace App\Infrastructure\Services;

class JwtTokenService
{
    private string $secretKey;
    private int $ttl;

    public function __construct(string $secretKey = 'your-secret-key', int $ttl = 86400)
    {
        $this->secretKey = $secretKey;
        $this->ttl = $ttl;
    }

    public function generateToken(int $userId, string $role): string
    {
        $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = base64_encode(json_encode([
            'sub' => $userId,
            'role' => $role,
            'iat' => time(),
            'exp' => time() + $this->ttl
        ]));

        $signature = hash_hmac('sha256', "{$header}.{$payload}", $this->secretKey, true);
        $base64UrlSignature = base64_encode($signature);

        return "{$header}.{$payload}.{$base64UrlSignature}";
    }
}