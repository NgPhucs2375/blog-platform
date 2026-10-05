<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\NotificationType;
use InvalidArgumentException;
use DateTimeImmutable;

class Notification extends BaseEntity
{
    public function __construct(
        private int $userId,
        private NotificationType $type,
        private string $title,
        private string $content,
        private array $data = [],
        private bool $isRead = false,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?int $createdBy = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $updatedBy = null
    ) {
        parent::__construct($id, $createdAt, $createdBy ?? $userId, $updatedAt, $updatedBy);
        $this->setTitle($title);
        $this->setContent($content);
    }

    public function markAsRead(?int $updatedBy = null): void
    {
        $this->isRead = true;
        $this->markUpdated($updatedBy);
    }

    public function markAsUnread(?int $updatedBy = null): void
    {
        $this->isRead = false;
        $this->markUpdated($updatedBy);
    }

    private function setTitle(string $title): void
    {
        $trimmed = trim($title);
        if (empty($trimmed)) throw new InvalidArgumentException("Tiêu đề thông báo không được để trống.");
        $this->title = $trimmed;
    }

    private function setContent(string $content): void
    {
        $trimmed = trim($content);
        if (empty($trimmed)) throw new InvalidArgumentException("Nội dung thông báo không được để trống.");
        $this->content = $trimmed;
    }

    public function getUserId(): int { return $this->userId; }
    public function getType(): NotificationType { return $this->type; }
    public function getTitle(): string { return $this->title; }
    public function getContent(): string { return $this->content; }
    public function getData(): array { return $this->data; }
    public function getIsRead(): bool { return $this->isRead; }

    public function toArray(): array
    {
        return array_merge($this->baseArray(), [
            'userId' => $this->userId,
            'type' => $this->type->value,
            'title' => $this->title,
            'content' => $this->content,
            'data' => $this->data,
            'isRead' => $this->isRead,
        ]);
    }
}
