<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use DateTimeImmutable;

class Like
{
    public function __construct(
        private int $userId,
        private int $postId,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null
    ) {
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getUserId(): int { return $this->userId; }
    public function getPostId(): int { return $this->postId; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'postId' => $this->postId,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}