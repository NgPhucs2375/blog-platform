<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\IPostRepository;
use src\Domain\Entities\Post;
use src\Domain\Enums\PostStatus;
use DateTimeImmutable;
use InvalidArgumentException;
use PDO;

class PostRepository extends AbstractRepository implements IPostRepository
{
    protected string $table = 'posts';

    public function findById(int $id): ?Post
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findBySlug(string $slug): ?Post
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE slug = ?");
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function save(object $entity): void
    {
        if (!$entity instanceof Post) throw new InvalidArgumentException("Input must be Post Entity");

        $sql = "INSERT INTO {$this->table} (title, slug, content, author_id, category_id, status, view_count, created_at, updated_at)
                VALUES (:title, :slug, :content, :author_id, :category_id, :status, :view_count, :created_at, :updated_at)";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':title' => $entity->getTitle(),
            ':slug' => $entity->getSlug(),
            ':content' => $entity->getContent(),
            ':author_id' => $entity->getAuthorId(),
            ':category_id' => $entity->getCategoryId(),
            ':status' => $entity->getStatus()->value,
            ':view_count' => $entity->getViewCount(),
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
            ':updated_at' => $entity->getUpdatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof Post) throw new InvalidArgumentException("Input must be Post Entity");

        $sql = "UPDATE {$this->table}
                SET title = :title, slug = :slug, content = :content, category_id = :category_id,
                    status = :status, view_count = :view_count, updated_at = :updated_at WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':title' => $entity->getTitle(),
            ':slug' => $entity->getSlug(),
            ':content' => $entity->getContent(),
            ':category_id' => $entity->getCategoryId(),
            ':status' => $entity->getStatus()->value,
            ':view_count' => $entity->getViewCount(),
            ':updated_at' => $entity->getUpdatedAt()->format('Y-m-d H:i:s'),
        ]);
    }

    public function getPublishedPosts(?string $keyword = null, ?int $categoryId = null, ?int $authorId = null, int $page = 1, int $limit = 10): array
    {
        $params = [':status' => PostStatus::PUBLISHED->value];
        $where = ["status = :status"];

        if (!empty($keyword)) {
            $where[] = "(title LIKE :kw OR content LIKE :kw)";
            $params[':kw'] = '%' . $keyword . '%';
        }
        if ($categoryId !== null) {
            $where[] = "category_id = :cat_id";
            $params[':cat_id'] = $categoryId;
        }
        if ($authorId !== null) {
            $where[] = "author_id = :author_id";
            $params[':author_id'] = $authorId;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $offset = ($page - 1) * $limit;

        $sql = "SELECT * FROM {$this->table} {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db()->prepare($sql);

        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function getPostsByStatus(PostStatus $status, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE status = :status ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':status', $status->value);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function getPostsByAuthorId(int $authorId, ?PostStatus $status = null, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $sql = "SELECT * FROM {$this->table} WHERE author_id = :author_id";
        $params = [':author_id' => $authorId];

        if ($status !== null) {
            $sql .= " AND status = :status";
            $params[':status'] = $status->value;
        }

        $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db()->prepare($sql);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countPostsByStatus(PostStatus $status): int
    {
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} WHERE status = ?");
        $stmt->execute([$status->value]);
        return (int)$stmt->fetchColumn();
    }

    private function mapToEntity(array $row): Post
    {
        return new Post(
            $row['title'],
            $row['slug'],
            $row['content'],
            (int)$row['author_id'],
            (int)$row['category_id'],
            PostStatus::from($row['status']),
            (int)($row['view_count'] ?? 0),
            (int)$row['id'],
            new DateTimeImmutable($row['created_at']),
            isset($row['updated_at']) ? new DateTimeImmutable($row['updated_at']) : null
        );
    }
}