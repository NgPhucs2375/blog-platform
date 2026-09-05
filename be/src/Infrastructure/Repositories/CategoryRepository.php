<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\ICategoryRepository;
use src\Domain\Entities\Category;
use DateTimeImmutable;
use InvalidArgumentException;
use PDO;

class CategoryRepository extends AbstractRepository implements ICategoryRepository
{
    protected string $table = 'categories';

    public function findById(int $id): ?Category
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findBySlug(string $slug): ?Category
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE slug = ?");
        $stmt->execute([$slug]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findByName(string $name): ?Category
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE name = ?");
        $stmt->execute([$name]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function getAllCategories(): array
    {
        $stmt = $this->db()->query("SELECT * FROM {$this->table} ORDER BY sort_order ASC, display_order ASC");
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function save(object $entity): int
    {
        if (!$entity instanceof Category) throw new InvalidArgumentException("Input must be Category Entity");

        $sql = "INSERT INTO {$this->table} (name, slug, description, sort_order, display_order, created_at)
                VALUES (:name, :slug, :description, :sort_order, :display_order, :created_at)
                RETURNING id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':name' => $entity->getName(),
            ':slug' => $entity->getSlug(),
            ':description' => $entity->getDescription(),
            ':sort_order' => $entity->getSortOrder(),
            ':display_order' => $entity->getDisplayOrder(),
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);

        return (int) $stmt->fetchColumn();
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof Category) throw new InvalidArgumentException("Input must be Category Entity");

        $sql = "UPDATE {$this->table}
                SET name = :name, slug = :slug, description = :description, 
                    sort_order = :sort_order, display_order = :display_order WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':name' => $entity->getName(),
            ':slug' => $entity->getSlug(),
            ':description' => $entity->getDescription(),
            ':sort_order' => $entity->getSortOrder(),
            ':display_order' => $entity->getDisplayOrder(),
        ]);
    }

    public function hasPosts(int $categoryId): bool
    {
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM posts WHERE category_id = ?");
        $stmt->execute([$categoryId]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function updateSortOrders(array $orderedIds): void
    {
        $this->context->beginTransaction();
        try {
            $stmt = $this->db()->prepare("UPDATE {$this->table} SET sort_order = :sort_order WHERE id = :id");
            foreach ($orderedIds as $order => $id) {
                $stmt->execute([':sort_order' => $order, ':id' => (int)$id]);
            }
            $this->context->commit();
        } catch (\Exception $e) {
            $this->context->rollBack();
            throw $e;
        }
    }

    private function mapToEntity(array $row): Category
    {
        return new Category(
            $row['name'],
            $row['slug'],
            $row['description'] ?? null,
            (int)($row['sort_order'] ?? 0),
            (int)($row['display_order'] ?? 0),
            (int)$row['id'],
            new DateTimeImmutable($row['created_at']),
            createdBy: isset($row['created_by']) && $row['created_by'] !== null ? (int)$row['created_by'] : null,
            updatedAt: !empty($row['updated_at']) ? new DateTimeImmutable($row['updated_at']) : null,
            updatedBy: isset($row['updated_by']) && $row['updated_by'] !== null ? (int)$row['updated_by'] : null
        );
    }
}