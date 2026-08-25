<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\INotificationRepository;
use src\Domain\Entities\Notification;
use src\Domain\Enums\NotificationType;
use DateTimeImmutable;
use InvalidArgumentException;
use PDO;

class NotificationRepository extends AbstractRepository implements INotificationRepository
{
    protected string $table = 'notifications';

    public function findById(int $id): ?Notification
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function save(object $entity): void
    {
        if (!$entity instanceof Notification) throw new InvalidArgumentException("Input must be Notification Entity");

        $sql = "INSERT INTO {$this->table} (user_id, type, title, content, data, is_read, created_at)
                VALUES (:user_id, :type, :title, :content, :data, :is_read, :created_at)";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':user_id' => $entity->getUserId(),
            ':type' => $entity->getType()->value,
            ':title' => $entity->getTitle(),
            ':content' => $entity->getContent(),
            ':data' => json_encode($entity->getData(), JSON_UNESCAPED_UNICODE),
            ':is_read' => $entity->getIsRead() ? 1 : 0,
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof Notification) throw new InvalidArgumentException("Input must be Notification Entity");

        $sql = "UPDATE {$this->table} SET is_read = :is_read WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':is_read' => $entity->getIsRead() ? 1 : 0,
        ]);
    }

    public function getByUserId(int $userId, bool $unreadOnly = false, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT * FROM {$this->table} WHERE user_id = :user_id";
        
        if ($unreadOnly) {
            $sql .= " AND is_read = 0"; // PostgreSQL/MySQL tương thích boolean mapping
        }

        $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db()->prepare($sql);
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function markAllAsRead(int $userId): void
    {
        $stmt = $this->db()->prepare("UPDATE {$this->table} SET is_read = 1 WHERE user_id = ?");
        $stmt->execute([$userId]);
    }

    private function mapToEntity(array $row): Notification
    {
        $dataArray = !empty($row['data']) ? json_decode((string)$row['data'], true) : [];

        return new Notification(
            (int)$row['user_id'],
            NotificationType::from($row['type']),
            $row['title'],
            $row['content'],
            $dataArray,
            (bool)$row['is_read'],
            (int)$row['id'],
            new DateTimeImmutable($row['created_at'])
        );
    }
}