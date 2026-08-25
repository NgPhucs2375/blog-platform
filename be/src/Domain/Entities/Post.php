<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\PostStatus;
use InvalidArgumentException;
use DateTimeImmutable;

class Post
{
    public function __construct(
        private string $title,
        private string $slug,
        private string $content,
        private int $authorId,
        private int $categoryId,
        private PostStatus $status = PostStatus::DRAFT,
        private int $viewCount = 0,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null,
        private ?DateTimeImmutable $updatedAt = null
    ) {
        $this->setTitle($title);
        $this->setSlug($slug);
        $this->setContent($content);
        $this->viewCount = max(0, $viewCount);
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
        $this->updatedAt = $updatedAt ?? new DateTimeImmutable();
    }

    // --- Business Methods ---
    public function submitForReview(): void
    {
        $this->status = PostStatus::PENDING;
        $this->touch();
    }

    public function approve(): void
    {
        $this->status = PostStatus::PUBLISHED;
        $this->touch();
    }

    public function reject(): void
    {
        $this->status = PostStatus::DRAFT;
        $this->touch();
    }

    public function updateContent(string $title, string $slug, string $content, int $categoryId): void
    {
        $this->setTitle($title);
        $this->setSlug($slug);
        $this->setContent($content);
        $this->categoryId = $categoryId;
        $this->touch();
    }

    public function incrementViewCount(): void
    {
        $this->viewCount++;
    }

    public function isPublished(): bool
    {
        return $this->status === PostStatus::PUBLISHED;
    }

    private function touch(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }

    // --- Validation ---
    private function setTitle(string $title): void
    {
        $trimmed = trim($title);
        if (empty($trimmed)) throw new InvalidArgumentException("Tiêu đề bài viết không được để trống.");
        $this->title = $trimmed;
    }

    private function setSlug(string $slug): void
    {
        $trimmed = trim($slug);
        if (empty($trimmed)) throw new InvalidArgumentException("Đường dẫn bài viết không được để trống.");
        $this->slug = $trimmed;
    }

    private function setContent(string $content): void
    {
        $trimmed = trim($content);
        if (empty($trimmed)) throw new InvalidArgumentException("Nội dung bài viết không được để trống.");
        $this->content = $trimmed;
    }

    // --- Getters ---
    public function getId(): ?int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function getSlug(): string { return $this->slug; }
    public function getContent(): string { return $this->content; }
    public function getAuthorId(): int { return $this->authorId; }
    public function getCategoryId(): int { return $this->categoryId; }
    public function getStatus(): PostStatus { return $this->status; }
    public function getViewCount(): int { return $this->viewCount; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): DateTimeImmutable { return $this->updatedAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'authorId' => $this->authorId,
            'categoryId' => $this->categoryId,
            'status' => $this->status->value,
            'viewCount' => $this->viewCount,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'updatedAt' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}