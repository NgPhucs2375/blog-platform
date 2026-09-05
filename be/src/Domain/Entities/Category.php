<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use InvalidArgumentException;
use DateTimeImmutable;

class Category extends BaseEntity
{
    public function __construct(
        private string $name,
        private string $slug,
        private ?string $description = null,
        private int $sortOrder = 0,
        private int $displayOrder = 0,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?int $createdBy = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $updatedBy = null
    ) {
        parent::__construct($id, $createdAt, $createdBy, $updatedAt, $updatedBy);
        $this->setName($name);
        $this->setSlug($slug);
    }

    // --- Phương thức nghiệp vụ ---

    public function updateCategory(string $name, string $slug, ?string $description, ?int $updatedBy = null): void
    {
        $this->setName($name);
        $this->setSlug($slug);
        $this->description = $description;
        $this->markUpdated($updatedBy);
    }

    public function updateDisplayOrder(int $sortOrder, int $displayOrder, ?int $updatedBy = null): void
    {
        $this->sortOrder = $sortOrder;
        $this->displayOrder = $displayOrder;
        $this->markUpdated($updatedBy);
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

    // --- Getters (id/audit kế thừa từ BaseEntity) ---

    public function getName(): string { return $this->name; }
    public function getSlug(): string { return $this->slug; }
    public function getDescription(): ?string { return $this->description; }
    public function getSortOrder(): int { return $this->sortOrder; }
    public function getDisplayOrder(): int { return $this->displayOrder; }

    // --- Mapping to Array ---

    public function toArray(): array
    {
        return array_merge($this->baseArray(), [
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'sortOrder' => $this->sortOrder,
            'displayOrder' => $this->displayOrder,
        ]);
    }
}
