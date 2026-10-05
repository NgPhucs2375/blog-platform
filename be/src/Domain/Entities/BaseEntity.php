<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use DateTimeImmutable;

/**
 * Lớp thực thể cơ sở cho toàn bộ Domain Entities.
 *
 * Chứa các trường audit dùng chung:
 * - id: mã định danh của thực thể
 * - createdAt / createdBy: thời gian tạo & người tạo
 * - updatedAt / updatedBy: thời gian sửa & người sửa
 *
 * Các entity con kế thừa và gọi parent::__construct()
 * cho 5 tham số audit ở cuối constructor để tương thích
 * ngược với các lời gọi positional-args hiện tại.
 */
abstract class BaseEntity
{
    protected ?int $id;
    protected DateTimeImmutable $createdAt;
    protected ?int $createdBy;
    protected ?DateTimeImmutable $updatedAt;
    protected ?int $updatedBy;

    public function __construct(
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?int $createdBy = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $updatedBy = null
    ) {
        $this->id = $id;
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
        $this->createdBy = $createdBy;
        $this->updatedAt = $updatedAt;
        $this->updatedBy = $updatedBy;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function isNew(): bool
    {
        return $this->id === null;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getCreatedBy(): ?int
    {
        return $this->createdBy;
    }

    public function getUpdatedAt(): ?DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getUpdatedBy(): ?int
    {
        return $this->updatedBy;
    }

    /**
     * Đánh dấu entity vừa được sửa.
     * Mọi phương thức nghiệp vụ gây thay đổi nên gọi hàm này.
     */
    protected function markUpdated(?int $updatedBy = null): void
    {
        $this->updatedAt = new DateTimeImmutable();
        if ($updatedBy !== null) {
            $this->updatedBy = $updatedBy;
        }
    }

    protected function formatDate(?DateTimeImmutable $dt): ?string
    {
        return $dt?->format('Y-m-d H:i:s');
    }

    /**
     * Mảng audit dùng chung, entity con merge vào toArray().
     */
    protected function baseArray(): array
    {
        return [
            'id' => $this->id,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'createdBy' => $this->createdBy,
            'updatedAt' => $this->formatDate($this->updatedAt),
            'updatedBy' => $this->updatedBy,
        ];
    }
}
