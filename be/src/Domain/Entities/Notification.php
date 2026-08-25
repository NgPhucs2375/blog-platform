<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\NotificationType;
use InvalidArgumentException;
use DateTimeImmutable;

class Notification
{
    public function __construct(
        private int $userId,
        private NotificationType $type,
        private string $title,
        private string $content,
        private array $data = [],
        private bool $isRead = false,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null
    ) {
        $this->setTitle($title);
        $this->setContent($content);
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
    }

    public function markAsRead(): void
    {
        $this->isRead = true;
    }

    public function markAsUnread(): void
    {
        $this->isRead = false;
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

    public function getId(): ?int { return $this->id; }
    public function getUserId(): int { return $this->userId; }
    public function getType(): NotificationType { return $this->type; }
    public function getTitle(): string { return $this->title; }
    public function getContent(): string { return $this->content; }
    public function getData(): array { return $this->data; }
    public function getIsRead(): bool { return $this->isRead; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'type' => $this->type->value,
            'title' => $this->title,
            'content' => $this->content,
            'data' => $this->data,
            'isRead' => $this->isRead,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}