<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use DateTimeImmutable;

class Like extends BaseEntity
{
    public function __construct(
        private int $userId,
        private int $postId,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?int $createdBy = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $updatedBy = null
    ) {
        parent::__construct($id, $createdAt, $createdBy ?? $userId, $updatedAt, $updatedBy);
    }

    public function getUserId(): int { return $this->userId; }
    public function getPostId(): int { return $this->postId; }

    public function toArray(): array
    {
        return array_merge($this->baseArray(), [
            'userId' => $this->userId,
            'postId' => $this->postId,
        ]);
    }
}
