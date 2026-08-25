<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use InvalidArgumentException;
use DateTimeImmutable;

class Tag
{
    public function __construct(
        private string $name,
        private string $slug,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null
    ) {
        $this->setName($name);
        $this->setSlug($slug);
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
    }

    public function updateTag(string $name, string $slug): void
    {
        $this->setName($name);
        $this->setSlug($slug);
    }

    private function setName(string $name): void
    {
        $trimmed = trim($name);
        if (empty($trimmed)) throw new InvalidArgumentException("Tên thẻ không được để trống.");
        $this->name = $trimmed;
    }

    private function setSlug(string $slug): void
    {
        $trimmed = trim($slug);
        if (empty($trimmed)) throw new InvalidArgumentException("Đường dẫn thẻ không được để trống.");
        $this->slug = $trimmed;
    }

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getSlug(): string { return $this->slug; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}