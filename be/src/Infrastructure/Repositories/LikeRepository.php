<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\ILikeRepository;
use src\Domain\Entities\Like;
use DateTimeImmutable;
use InvalidArgumentException;
use PDO;

class LikeRepository extends AbstractRepository implements ILikeRepository
{
    protected string $table = 'likes';

    public function findById(int $id): ?Like
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function save(object $entity): int
    {
        if (!$entity instanceof Like) throw new InvalidArgumentException("Input must be Like Entity");

        $sql = "INSERT INTO {$this->table} (user_id, post_id, created_at) VALUES (:user_id, :post_id, :created_at) RETURNING id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':user_id' => $entity->getUserId(),
            ':post_id' => $entity->getPostId(),
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);

        return (int) $stmt->fetchColumn();
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof Like) throw new InvalidArgumentException("Input must be Like Entity");

        $sql = "UPDATE {$this->table} SET user_id = :user_id, post_id = :post_id WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':user_id' => $entity->getUserId(),
            ':post_id' => $entity->getPostId(),
        ]);
    }

    public function hasLiked(int $userId, int $postId): bool
    {
        $stmt = $this->db()->prepare("SELECT 1 FROM {$this->table} WHERE user_id = ? AND post_id = ?");
        $stmt->execute([$userId, $postId]);
        return (bool)$stmt->fetchColumn();
    }

    public function findByUserAndPost(int $userId, int $postId): ?Like
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE user_id = ? AND post_id = ?");
        $stmt->execute([$userId, $postId]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function getLikesByPostId(int $postId, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE post_id = :post_id ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':post_id', $postId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countByPostId(int $postId): int
    {
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} WHERE post_id = ?");
        $stmt->execute([$postId]);
        return (int)$stmt->fetchColumn();
    }

    private function mapToEntity(array $row): Like
    {
        return new Like(
            (int)$row['user_id'],
            (int)$row['post_id'],
            (int)$row['id'],
            new DateTimeImmutable($row['created_at']),
            createdBy: isset($row['created_by']) && $row['created_by'] !== null ? (int)$row['created_by'] : null,
            updatedAt: !empty($row['updated_at']) ? new DateTimeImmutable($row['updated_at']) : null,
            updatedBy: isset($row['updated_by']) && $row['updated_by'] !== null ? (int)$row['updated_by'] : null
        );
    }
}