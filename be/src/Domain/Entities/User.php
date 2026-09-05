<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\UserRole;
use src\Domain\Enums\UserStatus;
use InvalidArgumentException;
use DateTimeImmutable;

class User extends BaseEntity
{
    public function __construct(
        private string $userName,
        private string $email,
        private string $passwordHash,
        private UserRole $role = UserRole::USER,
        private UserStatus $status = UserStatus::ACTIVE,
        ?int $id = null,
        ?DateTimeImmutable $createdAt = null,
        ?int $createdBy = null,
        ?DateTimeImmutable $updatedAt = null,
        ?int $updatedBy = null
    ) {
        parent::__construct($id, $createdAt, $createdBy, $updatedAt, $updatedBy);
        $this->setUserName($userName);
        $this->setEmail($email);
    }

    // --- Phương thức nghiệp vụ ---

    public function lock(?int $updatedBy = null): void
    {
        $this->status = UserStatus::LOCKED;
        $this->markUpdated($updatedBy);
    }

    public function unlock(?int $updatedBy = null): void
    {
        $this->status = UserStatus::ACTIVE;
        $this->markUpdated($updatedBy);
    }

    public function updateProfile(string $userName, string $email, ?int $updatedBy = null): void
    {
        $this->setUserName($userName);
        $this->setEmail($email);
        $this->markUpdated($updatedBy);
    }

    public function changePassword(string $newPasswordHash, ?int $updatedBy = null): void
    {
        $this->passwordHash = $newPasswordHash;
        $this->markUpdated($updatedBy);
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN;
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::ACTIVE;
    }

    // --- Validation nội bộ ---

    private function setUserName(string $userName): void
    {
        $trimmed = trim($userName);
        if (empty($trimmed)) {
            throw new InvalidArgumentException("Tên người dùng (UserName) không được để trống.");
        }
        $this->userName = $trimmed;
    }

    private function setEmail(string $email): void
    {
        $trimmed = trim($email);
        if (!filter_var($trimmed, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException("Địa chỉ Email không hợp lệ: " . $email);
        }
        $this->email = $trimmed;
    }

    // --- Getters (id/createdAt/createdBy/updatedAt/updatedBy kế thừa từ BaseEntity) ---

    public function getUserName(): string { return $this->userName; }
    public function getEmail(): string { return $this->email; }
    public function getPasswordHash(): string { return $this->passwordHash; }
    public function getRole(): UserRole { return $this->role; }
    public function getStatus(): UserStatus { return $this->status; }

    // --- Mapping to Array ---

    public function toArray(): array
    {
        return array_merge($this->baseArray(), [
            'userName' => $this->userName,
            'email' => $this->email,
            'role' => $this->role->value,
            'status' => $this->status->value,
            'isActive' => $this->status->isActive(),
        ]);
    }
}
