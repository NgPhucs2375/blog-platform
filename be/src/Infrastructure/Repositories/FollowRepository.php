<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\IFollowRepository;
use src\Domain\Entities\Follow;
use DateTimeImmutable;
use InvalidArgumentException;
use PDO;

class FollowRepository extends AbstractRepository implements IFollowRepository
{
    protected string $table = 'follows';

    public function findById(int $id): ?Follow
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function save(object $entity): int
    {
        if (!$entity instanceof Follow) throw new InvalidArgumentException("Input must be Follow Entity");

        $sql = "INSERT INTO {$this->table} (follower_id, following_id, created_at)
                VALUES (:follower_id, :following_id, :created_at)
                RETURNING id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':follower_id' => $entity->getFollowerId(),
            ':following_id' => $entity->getFollowingId(),
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);

        return (int) $stmt->fetchColumn();
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof Follow) throw new InvalidArgumentException("Input must be Follow Entity");

        // Logic update thường hiếm dùng trong Follow, nhưng phải khai báo để tuân thủ Interface
        $sql = "UPDATE {$this->table} SET follower_id = :follower_id, following_id = :following_id WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':follower_id' => $entity->getFollowerId(),
            ':following_id' => $entity->getFollowingId(),
        ]);
    }

    public function isFollowing(int $followerId, int $followingId): bool
    {
        $stmt = $this->db()->prepare("SELECT 1 FROM {$this->table} WHERE follower_id = ? AND following_id = ?");
        $stmt->execute([$followerId, $followingId]);
        return (bool)$stmt->fetchColumn();
    }

    public function findByFollowerAndFollowing(int $followerId, int $followingId): ?Follow
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE follower_id = ? AND following_id = ?");
        $stmt->execute([$followerId, $followingId]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function getFollowers(int $userId, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE following_id = :user_id ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function getFollowing(int $userId, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE follower_id = :user_id ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countFollowers(int $userId): int
    {
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} WHERE following_id = ?");
        $stmt->execute([$userId]);
        return (int)$stmt->fetchColumn();
    }

    public function countFollowing(int $userId): int
    {
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} WHERE follower_id = ?");
        $stmt->execute([$userId]);
        return (int)$stmt->fetchColumn();
    }

    private function mapToEntity(array $row): Follow
    {
        return new Follow(
            (int)$row['follower_id'],
            (int)$row['following_id'],
            (int)$row['id'],
            new DateTimeImmutable($row['created_at']),
            createdBy: isset($row['created_by']) && $row['created_by'] !== null ? (int)$row['created_by'] : null,
            updatedAt: !empty($row['updated_at']) ? new DateTimeImmutable($row['updated_at']) : null,
            updatedBy: isset($row['updated_by']) && $row['updated_by'] !== null ? (int)$row['updated_by'] : null
        );
    }
}