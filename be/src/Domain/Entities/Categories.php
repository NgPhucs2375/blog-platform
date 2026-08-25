<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use InvalidArgumentException;
use DateTimeImmutable;

class Category
{
    public function __construct(
        private string $name,
        private string $slug,
        private ?string $description = null,
        private int $sortOrder = 0,
        private int $displayOrder = 0,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null
    ) {
        $this->setName($name);
        $this->setSlug($slug);
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
    }

    // --- Phương thức nghiệp vụ ---

    public function updateCategory(string $name, string $slug, ?string $description): void
    {
        $this->setName($name);
        $this->setSlug($slug);
        $this->description = $description;
    }

    public function updateDisplayOrder(int $sortOrder, int $displayOrder): void
    {
        $this->sortOrder = $sortOrder;
        $this->displayOrder = $displayOrder;
    }

    // --- Validation nội bộ ---

    private function setName(string $name): void
    {
        $trimmed = trim($name);
        if (empty($trimmed)) {
            throw new InvalidArgumentException("Tên chuyên mục (Name) không được để trống.");
        }
        $this->name = $trimmed;
    }

    private function setSlug(string $slug): void
    {
        $trimmed = trim($slug);
        if (empty($trimmed)) {
            throw new InvalidArgumentException("Đường dẫn chuyên mục (Slug) không được để trống.");
        }
        $this->slug = $trimmed;
    }

    // --- Getters ---

    public function getId(): ?int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getSlug(): string { return $this->slug; }
    public function getDescription(): ?string { return $this->description; }
    public function getSortOrder(): int { return $this->sortOrder; }
    public function getDisplayOrder(): int { return $this->displayOrder; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    // --- Mapping to Array ---

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'sortOrder' => $this->sortOrder,
            'displayOrder' => $this->displayOrder,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}