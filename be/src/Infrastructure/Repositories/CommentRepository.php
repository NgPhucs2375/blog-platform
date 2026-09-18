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

    public function save(object $entity): int
    {
        if (!$entity instanceof Comment) throw new InvalidArgumentException("Input must be Comment Entity");

        $sql = "INSERT INTO {$this->table} (post_id, user_id, content, parent_id, status, created_at, created_by)
                VALUES (:post_id, :user_id, :content, :parent_id, :status, :created_at, :created_by)
                RETURNING id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':post_id' => $entity->getPostId(),
            ':user_id' => $entity->getUserId(),
            ':content' => $entity->getContent(),
            ':parent_id' => $entity->getParentId(),
            ':status' => $entity->getStatus()->value,
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
            ':created_by' => $entity->getCreatedBy() ?? $entity->getUserId(),
        ]);

        return (int) $stmt->fetchColumn();
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof Comment) throw new InvalidArgumentException("Input must be Comment Entity");

        $sql = "UPDATE {$this->table} SET status = :status, updated_at = :updated_at, updated_by = :updated_by WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':status' => $entity->getStatus()->value,
            ':updated_at' => ($entity->getUpdatedAt() ?? new DateTimeImmutable())->format('Y-m-d H:i:s'),
            ':updated_by' => $entity->getUpdatedBy(),
        ]);
    }

    public function hasReplies(int $parentId): bool
    {
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} WHERE parent_id = ?");
        $stmt->execute([$parentId]);
        return (int)$stmt->fetchColumn() > 0;
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

    public function searchComments(?CommentStatus $status = null, ?int $postId = null, int $page = 1, int $limit = 20): array
    {
        [$whereClause, $params] = $this->buildSearchFilter($status, $postId);
        $offset = ($page - 1) * $limit;

        $sql = "SELECT * FROM {$this->table} {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db()->prepare($sql);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countSearchComments(?CommentStatus $status = null, ?int $postId = null): int
    {
        [$whereClause, $params] = $this->buildSearchFilter($status, $postId);
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} {$whereClause}");
        $stmt->execute($params);
        return (int)$stmt->fetchColumn();
    }

    public function countStats(?int $postId = null): array
    {
        $where = '';
        $params = [];
        if ($postId !== null) {
            $where = 'WHERE post_id = :post_id';
            $params = [':post_id' => $postId];
        }

        $sql = "SELECT COUNT(*) AS total,"
            . " SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,"
            . " SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved,"
            . " SUM(CASE WHEN status = 'Hidden' THEN 1 ELSE 0 END) AS hidden"
            . " FROM {$this->table} {$where}";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch() ?: [];

        return [
            'total' => (int)($row['total'] ?? 0),
            'pending' => (int)($row['pending'] ?? 0),
            'approved' => (int)($row['approved'] ?? 0),
            'hidden' => (int)($row['hidden'] ?? 0),
        ];
    }

    /**
     * @return array{0: string, 1: array<string,mixed>}
     */
    private function buildSearchFilter(?CommentStatus $status, ?int $postId): array
    {
        $where = [];
        $params = [];

        if ($status !== null) {
            $where[] = "status = :status";
            $params[':status'] = $status->value;
        }
        if ($postId !== null) {
            $where[] = "post_id = :post_id";
            $params[':post_id'] = $postId;
        }

        return [$where === [] ? '' : 'WHERE ' . implode(' AND ', $where), $params];
    }

    private function mapToEntity(array $row): Comment
    {
        return new Comment(
            (int)$row['post_id'],
            (int)$row['user_id'],
            $row['content'],
            isset($row['parent_id']) && $row['parent_id'] !== null ? (int)$row['parent_id'] : null,
            CommentStatus::from($row['status']),
            (int)$row['id'],
            new DateTimeImmutable($row['created_at']),
            createdBy: isset($row['created_by']) && $row['created_by'] !== null ? (int)$row['created_by'] : null,
            updatedAt: !empty($row['updated_at']) ? new DateTimeImmutable($row['updated_at']) : null,
            updatedBy: isset($row['updated_by']) && $row['updated_by'] !== null ? (int)$row['updated_by'] : null
        );
    }
}