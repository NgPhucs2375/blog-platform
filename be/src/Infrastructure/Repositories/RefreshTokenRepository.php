<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\IRefreshTokenRepository;
use src\Domain\Entities\RefreshToken;
use DateTimeImmutable;
use InvalidArgumentException;

class RefreshTokenRepository extends AbstractRepository implements IRefreshTokenRepository
{
    protected string $table = 'refresh_tokens';

    public function findById(int $id): ?RefreshToken
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findByHash(string $tokenHash): ?RefreshToken
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE token_hash = ?");
        $stmt->execute([$tokenHash]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function save(object $entity): int
    {
        if (!$entity instanceof RefreshToken) throw new InvalidArgumentException("Input must be RefreshToken Entity");

        $sql = "INSERT INTO {$this->table}
                    (user_id, token_hash, expires_at, revoked_at, replaced_by, user_agent, ip, created_at)
                VALUES
                    (:user_id, :token_hash, :expires_at, :revoked_at, :replaced_by, :user_agent, :ip, :created_at)";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':user_id' => $entity->getUserId(),
            ':token_hash' => $entity->getTokenHash(),
            ':expires_at' => $entity->getExpiresAt()->format('Y-m-d H:i:s'),
            ':revoked_at' => $entity->getRevokedAt()?->format('Y-m-d H:i:s'),
            ':replaced_by' => $entity->getReplacedBy(),
            ':user_agent' => $entity->getUserAgent() !== null ? substr($entity->getUserAgent(), 0, 255) : null,
            ':ip' => $entity->getIp() !== null ? substr($entity->getIp(), 0, 45) : null,
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);

        return (int) $this->db()->lastInsertId('refresh_tokens_id_seq');
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof RefreshToken) throw new InvalidArgumentException("Input must be RefreshToken Entity");

        // Phiên chỉ đổi trạng thái thu hồi — các trường khác bất biến.
        $sql = "UPDATE {$this->table}
                SET revoked_at = :revoked_at, replaced_by = :replaced_by
                WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':revoked_at' => $entity->getRevokedAt()?->format('Y-m-d H:i:s'),
            ':replaced_by' => $entity->getReplacedBy(),
        ]);
    }

    public function findUsableByUser(int $userId): array
    {
        $stmt = $this->db()->prepare(
            "SELECT * FROM {$this->table}
             WHERE user_id = ? AND revoked_at IS NULL AND expires_at > NOW()
             ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function revokeAllForUser(int $userId): void
    {
        $stmt = $this->db()->prepare(
            "UPDATE {$this->table} SET revoked_at = NOW()
             WHERE user_id = ? AND revoked_at IS NULL"
        );
        $stmt->execute([$userId]);
    }

    public function deleteExpired(): void
    {
        $this->db()->exec("DELETE FROM {$this->table} WHERE expires_at <= NOW()");
    }

    private function mapToEntity(array $row): RefreshToken
    {
        return new RefreshToken(
            (int)$row['user_id'],
            $row['token_hash'],
            new DateTimeImmutable($row['expires_at']),
            !empty($row['revoked_at']) ? new DateTimeImmutable($row['revoked_at']) : null,
            isset($row['replaced_by']) && $row['replaced_by'] !== null ? (int)$row['replaced_by'] : null,
            $row['user_agent'] ?? null,
            $row['ip'] ?? null,
            (int)$row['id'],
            new DateTimeImmutable($row['created_at'])
        );
    }
}
