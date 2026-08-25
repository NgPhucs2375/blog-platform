<?php
declare(strict_types=1);

namespace App\Domain\Entities;

use DateTimeImmutable;

class PostTag
{
    public function __construct(
        private int $postId,
        private int $tagId,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null
    ) {
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getPostId(): int { return $this->postId; }
    public function getTagId(): int { return $this->tagId; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'postId' => $this->postId,
            'tagId' => $this->tagId,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}