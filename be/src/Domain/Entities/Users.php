<?php
declare(strict_types=1);

namespace src\Domain\Entities;

use src\Domain\Enums\UserRole;
use src\Domain\Enums\UserStatus;
use InvalidArgumentException;
use DateTimeImmutable;

class User
{
    public function __construct(
        private string $userName,
        private string $email,
        private string $passwordHash,
        private UserRole $role = UserRole::USER,
        private UserStatus $status = UserStatus::ACTIVE,
        private ?int $id = null,
        private ?DateTimeImmutable $createdAt = null
    ) {
        $this->setUserName($userName);
        $this->setEmail($email);
        $this->createdAt = $createdAt ?? new DateTimeImmutable();
    }

    // --- Phương thức nghiệp vụ ---

    public function lock(): void
    {
        $this->status = UserStatus::LOCKED;
    }

    public function unlock(): void
    {
        $this->status = UserStatus::ACTIVE;
    }

    public function updateProfile(string $userName, string $email): void
    {
        $this->setUserName($userName);
        $this->setEmail($email);
    }

    public function changePassword(string $newPasswordHash): void
    {
        $this->passwordHash = $newPasswordHash;
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

    // --- Getters ---

    public function getId(): ?int { return $this->id; }
    public function getUserName(): string { return $this->userName; }
    public function getEmail(): string { return $this->email; }
    public function getPasswordHash(): string { return $this->passwordHash; }
    public function getRole(): UserRole { return $this->role; }
    public function getStatus(): UserStatus { return $this->status; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }

    // --- Mapping to Array ---

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'userName' => $this->userName,
            'email' => $this->email,
            'role' => $this->role->value,
            'status' => $this->status->value,
            'isActive' => $this->status->isActive(),
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
        ];
    }
}