<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\ICommentRepository;
use src\Domain\Entities\Comment;
use src\Domain\Enums\CommentStatus;
use DateTimeImmutable;
use InvalidArgumentException;
use PDO;

class CommentRepository extends AbstractRepository implements ICommentRepository
{
    protected string $table = 'comments';

    public function findById(int $id): ?Comment
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function save(object $entity): void
    {
        if (!$entity instanceof Comment) throw new InvalidArgumentException("Input must be Comment Entity");

        $sql = "INSERT INTO {$this->table} (post_id, user_id, content, parent_id, status, created_at)
                VALUES (:post_id, :user_id, :content, :parent_id, :status, :created_at)";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':post_id' => $entity->getPostId(),
            ':user_id' => $entity->getUserId(),
            ':content' => $entity->getContent(),
            ':parent_id' => $entity->getParentId(),
            ':status' => $entity->getStatus()->value,
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof Comment) throw new InvalidArgumentException("Input must be Comment Entity");

        $sql = "UPDATE {$this->table} SET status = :status WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':status' => $entity->getStatus()->value,
        ]);
    }

    public function getByPostId(int $postId, ?CommentStatus $status = null, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT * FROM {$this->table} WHERE post_id = :post_id";
        $params = [':post_id' => $postId];

        if ($status !== null) {
            $sql .= " AND status = :status";
            $params[':status'] = $status->value;
        }

        $sql .= " ORDER BY created_at ASC LIMIT :limit OFFSET :offset";
        $stmt = $this->db()->prepare($sql);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function getByUserId(int $userId, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE user_id = :user_id ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function getReplies(int $parentId, ?CommentStatus $status = null): array
    {
        $sql = "SELECT * FROM {$this->table} WHERE parent_id = :parent_id";
        $params = [':parent_id' => $parentId];

        if ($status !== null) {
            $sql .= " AND status = :status";
            $params[':status'] = $status->value;
        }

        $sql .= " ORDER BY created_at ASC";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute($params);
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countByPostId(int $postId, ?CommentStatus $status = null): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table} WHERE post_id = :post_id";
        $params = [':post_id' => $postId];

        if ($status !== null) {
            $sql .= " AND status = :status";
            $params[':status'] = $status->value;
        }
        
        $stmt = $this->db()->prepare($sql);
        $stmt->execute($params);
        return (int)$stmt->fetchColumn();
    }

    private function mapToEntity(array $row): Comment
    {
        return new Comment(
            (int)$row['post_id'],
            (int)$row['user_id'],
            $row['content'],
            isset($row['parent_id']) ? (int)$row['parent_id'] : null,
            CommentStatus::from($row['status']),
            (int)$row['id'],
            new DateTimeImmutable($row['created_at'])
        );
    }
}