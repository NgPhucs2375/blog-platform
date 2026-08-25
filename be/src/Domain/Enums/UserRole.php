<?php

namespace src\Domain\Enums;

enum UserRole: string
{
    case ADMIN = 'Admin';
    case USER = 'User';
}