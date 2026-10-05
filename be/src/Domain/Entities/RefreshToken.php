<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use DateTimeImmutable;

/**
 * Phiên đăng nhập persistent (refresh token).
 *
 * Quy tắc nghiệp vụ:
 * - Token plain text KHÔNG bao giờ lưu DB — chỉ lưu hash SHA-256.
 * - Mỗi lần refresh: revoke token cũ (ghi replaced_by), cấp token mới.
 * - Token đã rotate mà bị dùng lại => nghi đánh cắp => thu hồi cả chùm.
 */
class RefreshToken extends BaseEntity
{
    public function __construct(
        private int $userId,
        private string $tokenHash,
        private DateTimeImmutable $expiresAt,
        private ?DateTimeImmutable $revokedAt = null,
        private ?int $replacedBy = null,
        private ?string $userAgent = null,
        private ?string $ip = null,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null
    ) {
        parent::__construct($id, $createdAt);
    }

    // --- Phương thức nghiệp vụ ---

    public function isExpired(?DateTimeImmutable $now = null): bool
    {
        return $this->expiresAt <= ($now ?? new DateTimeImmutable());
    }

    public function isRevoked(): bool
    {
        return $this->revokedAt !== null;
    }

    /** Token còn dùng được: chưa thu hồi và chưa hết hạn. */
    public function isUsable(): bool
    {
        return !$this->isRevoked() && !$this->isExpired();
    }

    /** Token đã rotate (có token kế tiếp) nhưng bị gửi lại => dấu hiệu đánh cắp. */
    public function isReuseOfRotated(): bool
    {
        return $this->isRevoked() && $this->replacedBy !== null;
    }

    public function revoke(?int $replacedBy = null): void
    {
        $this->revokedAt = new DateTimeImmutable();
        if ($replacedBy !== null) {
            $this->replacedBy = $replacedBy;
        }
    }

    // --- Getters ---

    public function getUserId(): int { return $this->userId; }
    public function getTokenHash(): string { return $this->tokenHash; }
    public function getExpiresAt(): DateTimeImmutable { return $this->expiresAt; }
    public function getRevokedAt(): ?DateTimeImmutable { return $this->revokedAt; }
    public function getReplacedBy(): ?int { return $this->replacedBy; }
    public function getUserAgent(): ?string { return $this->userAgent; }
    public function getIp(): ?string { return $this->ip; }

    // --- Mapping to Array (không bao giờ lộ token_hash) ---

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'expiresAt' => $this->expiresAt->format('Y-m-d H:i:s'),
            'userAgent' => $this->userAgent,
            'ip' => $this->ip,
        ];
    }
}
