<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use InvalidArgumentException;
use DateTimeImmutable;

class Follow extends BaseEntity
{
    public function __construct(
        private int $followerId,
        private int $followingId,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?int $createdBy = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $updatedBy = null
    ) {
        if ($followerId === $followingId) {
            throw new InvalidArgumentException("Người dùng không thể tự theo dõi chính mình.");
        }
        parent::__construct($id, $createdAt, $createdBy ?? $followerId, $updatedAt, $updatedBy);
    }

    public function getFollowerId(): int { return $this->followerId; }
    public function getFollowingId(): int { return $this->followingId; }

    public function toArray(): array
    {
        return array_merge($this->baseArray(), [
            'followerId' => $this->followerId,
            'followingId' => $this->followingId,
        ]);
    }
}
