<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\PostStatus;
use InvalidArgumentException;
use DateTimeImmutable;

class Post extends BaseEntity
{
    public function __construct(
        private string $title,
        private string $slug,
        private string $content,
        private int $authorId,
        private int $categoryId,
        private PostStatus $status = PostStatus::DRAFT,
        private int $viewCount = 0,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $createdBy = null,
        ?int $updatedBy = null
    ) {
        parent::__construct($id, $createdAt, $createdBy ?? $authorId, $updatedAt ?? new DateTimeImmutable(), $updatedBy);
        $this->setTitle($title);
        $this->setSlug($slug);
        $this->setContent($content);
        $this->viewCount = max(0, $viewCount);
    }

    // --- Business Methods ---
    public function submitForReview(?int $updatedBy = null): void
    {
        $this->status = PostStatus::PENDING;
        $this->markUpdated($updatedBy);
    }

    public function approve(?int $updatedBy = null): void
    {
        $this->status = PostStatus::PUBLISHED;
        $this->markUpdated($updatedBy);
    }

    public function reject(?int $updatedBy = null): void
    {
        $this->status = PostStatus::REJECT;
        $this->markUpdated($updatedBy);
    }

    public function updateContent(string $title, string $slug, string $content, int $categoryId, ?int $updatedBy = null): void
    {
        $this->setTitle($title);
        $this->setSlug($slug);
        $this->setContent($content);
        $this->categoryId = $categoryId;
        $this->markUpdated($updatedBy);
    }

    public function incrementViewCount(): void
    {
        $this->viewCount++;
    }

    public function isPublished(): bool
    {
        return $this->status === PostStatus::PUBLISHED;
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

    // --- Getters (id/createdAt/createdBy/updatedAt/updatedBy kế thừa từ BaseEntity) ---
    public function getTitle(): string { return $this->title; }
    public function getSlug(): string { return $this->slug; }
    public function getContent(): string { return $this->content; }
    public function getAuthorId(): int { return $this->authorId; }
    public function getCategoryId(): int { return $this->categoryId; }
    public function getStatus(): PostStatus { return $this->status; }
    public function getViewCount(): int { return $this->viewCount; }

    public function toArray(): array
    {
        return array_merge($this->baseArray(), [
            'title' => $this->title,
            'slug' => $this->slug,
            'content' => $this->content,
            'authorId' => $this->authorId,
            'categoryId' => $this->categoryId,
            'status' => $this->status->value,
            'viewCount' => $this->viewCount,
        ]);
    }
}
