<?php

namespace src\Domain\Enums;

enum UserStatus: string
{
    case ACTIVE = 'Active';
    case LOCKED = 'Locked';

    // Hàm tiện ích kiểm tra nhanh
    public function isActive(): bool
    {
        return $this === self::ACTIVE;
    }
}