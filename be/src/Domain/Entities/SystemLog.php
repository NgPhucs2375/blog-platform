<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\LogAction;
use src\Domain\Enums\LogTargetType;
use DateTimeImmutable;

/**
 * Log hệ thống dạng append-only (chỉ ghi thêm, không sửa).
 * Kế thừa BaseEntity để tái sử dụng id/createdAt/createdBy.
 * - userId: người thực hiện hành động (đồng thời là createdBy mặc định).
 * - targetType: dùng enum LogTargetType thay string set cứng.
 */
class SystemLog extends BaseEntity
{
    private LogTargetType $targetType;

    public function __construct(
        private int $userId,
        private LogAction $action,
        LogTargetType|string $targetType,
        private int $targetId,
        private ?array $oldValue = null,
        private ?array $newValue = null,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?int $createdBy = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $updatedBy = null
    ) {
        parent::__construct($id, $createdAt, $createdBy ?? $userId, $updatedAt, $updatedBy);
        $this->targetType = LogTargetType::coerce($targetType);
    }

    public function getUserId(): int { return $this->userId; }
    public function getAction(): LogAction { return $this->action; }
    public function getTargetType(): LogTargetType { return $this->targetType; }
    public function getTargetId(): int { return $this->targetId; }
    public function getOldValue(): ?array { return $this->oldValue; }
    public function getNewValue(): ?array { return $this->newValue; }

    public function toArray(): array
    {
        return [
            'id' => $this->getId(),
            'userId' => $this->userId,
            'action' => $this->action->value,
            'targetType' => $this->targetType->value,
            'targetId' => $this->targetId,
            'oldValue' => $this->oldValue,
            'newValue' => $this->newValue,
            'createdAt' => $this->getCreatedAt()->format('Y-m-d H:i:s'),
            'createdBy' => $this->getCreatedBy(),
        ];
    }
}
