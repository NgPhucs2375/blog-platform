<?php

namespace src\Domain\Enums;

enum PostStatus: string
{
    case DRAFT = 'Draft';
    case PENDING = 'Pending';
    case PUBLISHED = 'Published';
    case REJECT = 'Reject';
}