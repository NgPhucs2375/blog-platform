<?php

namespace src\Domain\Enums;

enum CommentStatus: string
{
    case PENDING = 'Pending';
    case APPROVED = 'Approved';
    case HIDDEN = 'Hidden';
}