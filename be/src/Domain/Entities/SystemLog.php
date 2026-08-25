<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\LogAction;
use InvalidArgumentException;
use DateTimeImmutable;

class SystemLog
{
    public function __construct(
        private int $userId,
        private LogAction $action,
        private string $targetType,
        private int $targetId,
        private ?array $oldValue = null,
        private ?array $newValue = null,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null
    ) {
        $this->setTargetType($targetType);
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
    }

    private function setTargetType(string $targetType): void
    {
        $validTargets = ['Users', 'Categories', 'Posts', 'Comments', 'Tags', 'Notifications'];
        if (!in_array($targetType, $validTargets, true)) {
            throw new InvalidArgumentException("Đối tượng tác động (TargetType) không hợp lệ: " . $targetType);
        }
        $this->targetType = $targetType;
    }

    public function getId(): ?int { return $this->id; }
    public function getUserId(): int { return $this->userId; }
    public function getAction(): LogAction { return $this->action; }
    public function getTargetType(): string { return $this->targetType; }
    public function getTargetId(): int { return $this->targetId; }
    public function getOldValue(): ?array { return $this->oldValue; }
    public function getNewValue(): ?array { return $this->newValue; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'action' => $this->action->value,
            'targetType' => $this->targetType,
            'targetId' => $this->targetId,
            'oldValue' => $this->oldValue,
            'newValue' => $this->newValue,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}