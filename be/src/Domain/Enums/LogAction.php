<?php

namespace src\Domain\Enums;

enum LogAction: string
{
    case CREATE = 'CREATE';
    case UPDATE = 'UPDATE';
    case DELETE = 'DELETE';
    case CHANGE_STATUS = 'CHANGE_STATUS';
}