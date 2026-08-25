<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

use src\Application\Interfaces\RepositoryInterface;
use src\Domain\Entities\Notification;

/**
 * @extends RepositoryInterface<Notification>
 */
interface INotificationRepository extends RepositoryInterface
{
    public function findById(int $id): ?Notification;
    
    /** @return Notification[] */
    public function getByUserId(int $userId, bool $unreadOnly = false, int $page = 1, int $limit = 10): array;
    
    public function markAllAsRead(int $userId): void;
}