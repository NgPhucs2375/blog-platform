<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Infrastructure\Context\DbContext;
use PDO;

/** Luu cau hinh kiem duyet; khong cache de Admin thay doi co hieu luc ngay. */
class ModerationRuleRepository
{
    public function __construct(private DbContext $context) {}

    private function db(): PDO { return $this->context->getConnection(); }

    public function all(): array
    {
        return $this->db()->query('SELECT * FROM moderation_rules ORDER BY id DESC')->fetchAll();
    }

    public function enabled(): array
    {
        $stmt = $this->db()->prepare('SELECT * FROM moderation_rules WHERE is_enabled = TRUE ORDER BY id ASC');
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db()->prepare('SELECT * FROM moderation_rules WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $rule): array
    {
        $stmt = $this->db()->prepare('INSERT INTO moderation_rules (name, pattern, rule_type, reason, is_enabled) VALUES (:name, :pattern, :rule_type, :reason, :is_enabled) RETURNING *');
        $stmt->execute([
            ':name' => $rule['name'], ':pattern' => $rule['pattern'], ':rule_type' => $rule['ruleType'],
            ':reason' => $rule['reason'], ':is_enabled' => $rule['isEnabled'],
        ]);
        return $this->normalize($stmt->fetch());
    }

    public function update(int $id, array $rule): ?array
    {
        $stmt = $this->db()->prepare('UPDATE moderation_rules SET name = :name, pattern = :pattern, rule_type = :rule_type, reason = :reason, is_enabled = :is_enabled, updated_at = CURRENT_TIMESTAMP WHERE id = :id RETURNING *');
        $stmt->execute([
            ':id' => $id, ':name' => $rule['name'], ':pattern' => $rule['pattern'], ':rule_type' => $rule['ruleType'],
            ':reason' => $rule['reason'], ':is_enabled' => $rule['isEnabled'],
        ]);
        $row = $stmt->fetch();
        return $row ? $this->normalize($row) : null;
    }

    public function toggle(int $id): ?array
    {
        $stmt = $this->db()->prepare('UPDATE moderation_rules SET is_enabled = NOT is_enabled, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->normalize($row) : null;
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db()->prepare('DELETE FROM moderation_rules WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }

    public function normalize(array $row): array
    {
        return [
            'id' => (int)$row['id'], 'name' => $row['name'], 'pattern' => $row['pattern'],
            'ruleType' => $row['rule_type'], 'reason' => $row['reason'],
            'isEnabled' => filter_var($row['is_enabled'], FILTER_VALIDATE_BOOLEAN),
            'createdAt' => $row['created_at'] ?? null, 'updatedAt' => $row['updated_at'] ?? null,
        ];
    }
}
