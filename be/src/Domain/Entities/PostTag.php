<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use DateTimeImmutable;

class PostTag extends BaseEntity
{
    public function __construct(
        private int $postId,
        private int $tagId,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?int $createdBy = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $updatedBy = null
    ) {
        parent::__construct($id, $createdAt, $createdBy, $updatedAt, $updatedBy);
    }

    public function getPostId(): int { return $this->postId; }
    public function getTagId(): int { return $this->tagId; }

    public function toArray(): array
    {
        return array_merge($this->baseArray(), [
            'postId' => $this->postId,
            'tagId' => $this->tagId,
        ]);
    }
}
