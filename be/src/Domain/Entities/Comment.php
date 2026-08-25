<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\CommentStatus;
use InvalidArgumentException;
use DateTimeImmutable;

class Comment
{
    public function __construct(
        private int $postId,
        private int $userId,
        private string $content,
        private ?int $parentId = null,
        private CommentStatus $status = CommentStatus::APPROVED,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null
    ) {
        $this->setContent($content);
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
    }

    public function approve(): void
    {
        $this->status = CommentStatus::APPROVED;
    }

    public function hide(): void
    {
        $this->status = CommentStatus::HIDDEN;
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

    public function getId(): ?int { return $this->id; }
    public function getPostId(): int { return $this->postId; }
    public function getUserId(): int { return $this->userId; }
    public function getContent(): string { return $this->content; }
    public function getParentId(): ?int { return $this->parentId; }
    public function getStatus(): CommentStatus { return $this->status; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'postId' => $this->postId,
            'userId' => $this->userId,
            'content' => $this->content,
            'parentId' => $this->parentId,
            'status' => $this->status->value,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}