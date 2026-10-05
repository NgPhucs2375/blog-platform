<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\ITagRepository;
use src\Domain\Entities\Tag;
use DateTimeImmutable;
use InvalidArgumentException;
use PDO;

class TagRepository extends AbstractRepository implements ITagRepository
{
    protected string $table = 'tags';
    protected string $pivotTable = 'post_tags';

    public function findById(int $id): ?Tag
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findBySlug(string $slug): ?Tag
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE slug = ?");
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function getAllTags(): array
    {
        $stmt = $this->db()->query("SELECT * FROM {$this->table} ORDER BY name ASC");
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function save(object $entity): int
    {
        if (!$entity instanceof Tag) throw new InvalidArgumentException("Input must be Tag Entity");

        $sql = "INSERT INTO {$this->table} (name, slug, created_at) VALUES (:name, :slug, :created_at) RETURNING id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':name' => $entity->getName(),
            ':slug' => $entity->getSlug(),
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);

        return (int) $stmt->fetchColumn();
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof Tag) throw new InvalidArgumentException("Input must be Tag Entity");

        $sql = "UPDATE {$this->table} SET name = :name, slug = :slug WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':name' => $entity->getName(),
            ':slug' => $entity->getSlug(),
        ]);
    }

    public function attachToPost(int $postId, array $tagIds): void
    {
        if (empty($tagIds)) return;

        $this->context->beginTransaction();
        try {
            $stmt = $this->db()->prepare("INSERT INTO {$this->pivotTable} (post_id, tag_id) VALUES (?, ?) ON CONFLICT DO NOTHING");
            foreach ($tagIds as $tagId) {
                $stmt->execute([$postId, (int)$tagId]);
            }
            $this->context->commit();
        } catch (\Exception $e) {
            $this->context->rollBack();
            throw $e;
        }
    }

    public function syncPostTags(int $postId, array $tagIds): void
    {
        $this->context->beginTransaction();
        try {
            // Xóa toàn bộ tag cũ của bài viết này
            $stmt = $this->db()->prepare("DELETE FROM {$this->pivotTable} WHERE post_id = ?");
            $stmt->execute([$postId]);

            // Thêm các tag mới vào
            if (!empty($tagIds)) {
                $insertStmt = $this->db()->prepare("INSERT INTO {$this->pivotTable} (post_id, tag_id) VALUES (?, ?)");
                foreach (array_unique($tagIds) as $tagId) {
                    $insertStmt->execute([$postId, (int)$tagId]);
                }
            }
            
            $this->context->commit();
        } catch (\Exception $e) {
            $this->context->rollBack();
            throw $e;
        }
    }

    private function mapToEntity(array $row): Tag
    {
        return new Tag(
            $row['name'],
            $row['slug'],
            (int)$row['id'],
            new DateTimeImmutable($row['created_at']),
            createdBy: isset($row['created_by']) && $row['created_by'] !== null ? (int)$row['created_by'] : null,
            updatedAt: !empty($row['updated_at']) ? new DateTimeImmutable($row['updated_at']) : null,
            updatedBy: isset($row['updated_by']) && $row['updated_by'] !== null ? (int)$row['updated_by'] : null
        );
    }
}