<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use InvalidArgumentException;
use DateTimeImmutable;

class Follow
{
    public function __construct(
        private int $followerId,
        private int $followingId,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null
    ) {
        if ($followerId === $followingId) {
            throw new InvalidArgumentException("Người dùng không thể tự theo dõi chính mình.");
        }
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getFollowerId(): int { return $this->followerId; }
    public function getFollowingId(): int { return $this->followingId; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'followerId' => $this->followerId,
            'followingId' => $this->followingId,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}