<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use InvalidArgumentException;
use DateTimeImmutable;

class Tag extends BaseEntity
{
    public function __construct(
        private string $name,
        private string $slug,
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

    public function updateTag(string $name, string $slug, ?int $updatedBy = null): void
    {
        $this->setName($name);
        $this->setSlug($slug);
        $this->markUpdated($updatedBy);
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

    public function getName(): string { return $this->name; }
    public function getSlug(): string { return $this->slug; }

    public function toArray(): array
    {
        return array_merge($this->baseArray(), [
            'name' => $this->name,
            'slug' => $this->slug,
        ]);
    }
}
