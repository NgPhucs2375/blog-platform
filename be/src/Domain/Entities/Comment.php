<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\CommentStatus;
use InvalidArgumentException;
use DateTimeImmutable;

class Comment extends BaseEntity
{
    public function __construct(
        private int $postId,
        private int $userId,
        private string $content,
        private ?int $parentId = null,
        private CommentStatus $status = CommentStatus::PENDING,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?int $createdBy = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $updatedBy = null
    ) {
        parent::__construct($id, $createdAt, $createdBy ?? $userId, $updatedAt, $updatedBy);
        $this->setContent($content);
    }

    public function approve(?int $updatedBy = null): void
    {
        $this->status = CommentStatus::APPROVED;
        $this->markUpdated($updatedBy);
    }

    public function hide(?int $updatedBy = null): void
    {
        $this->status = CommentStatus::HIDDEN;
        $this->markUpdated($updatedBy);
    }

    public function isVisible(): bool
    {
        return $this->status === CommentStatus::APPROVED;
    }

    private function setContent(string $content): void
    {
        $trimmed = trim($content);
        if (empty($trimmed)) throw new InvalidArgumentException("Nội dung bình luận không được để trống.");
        $this->content = $trimmed;
    }

    public function getPostId(): int { return $this->postId; }
    public function getUserId(): int { return $this->userId; }
    public function getContent(): string { return $this->content; }
    public function getParentId(): ?int { return $this->parentId; }
    public function getStatus(): CommentStatus { return $this->status; }

    public function toArray(): array
    {
        return array_merge($this->baseArray(), [
            'postId' => $this->postId,
            'userId' => $this->userId,
            'content' => $this->content,
            'parentId' => $this->parentId,
            'status' => $this->status->value,
        ]);
    }
}
