<?php
declare(strict_types=1);

namespace src\Infrastructure\Repositories;

use src\Application\Interfaces\Repositories\IUserRepository;
use src\Domain\Entities\User;
use src\Domain\Enums\UserRole;
use src\Domain\Enums\UserStatus;
use DateTimeImmutable;
use InvalidArgumentException;
use PDO;

class UserRepository extends AbstractRepository implements IUserRepository
{
    protected string $table = 'users';

    public function findById(int $id): ?User
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findByEmail(string $email): ?User
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE email = ?");
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findByUserName(string $userName): ?User
    {
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE username = ?");
        $stmt->execute([$userName]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function existsByEmail(string $email): bool
    {
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} WHERE email = ?");
        $stmt->execute([$email]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function existsByUserName(string $userName): bool
    {
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} WHERE username = ?");
        $stmt->execute([$userName]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function save(object $entity): int
    {
        if (!$entity instanceof User) throw new InvalidArgumentException("Input must be User Entity");

        $sql = "INSERT INTO {$this->table} (username, email, password_hash, role, status, created_at)
                VALUES (:username, :email, :password_hash, :role, :status, :created_at)";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':username' => $entity->getUserName(),
            ':email' => $entity->getEmail(),
            ':password_hash' => $entity->getPasswordHash(),
            ':role' => $entity->getRole()->value,
            ':status' => $entity->getStatus()->value,
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);

        return (int) $this->db()->lastInsertId('users_id_seq');
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof User) throw new InvalidArgumentException("Input must be User Entity");

        $sql = "UPDATE {$this->table}
                SET username = :username, email = :email, password_hash = :password_hash,
                    role = :role, status = :status WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([
            ':id' => $entity->getId(),
            ':username' => $entity->getUserName(),
            ':email' => $entity->getEmail(),
            ':password_hash' => $entity->getPasswordHash(),
            ':role' => $entity->getRole()->value,
            ':status' => $entity->getStatus()->value,
        ]);
    }

    public function getAllUsers(int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countUsers(): int
    {
        return (int)$this->db()->query("SELECT COUNT(*) FROM {$this->table}")->fetchColumn();
    }

    public function searchUsers(string $keyword, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $like = "%{$keyword}%";
        $stmt = $this->db()->prepare(
            "SELECT * FROM {$this->table} WHERE username LIKE :kw OR email LIKE :kw ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':kw', $like);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countSearchUsers(string $keyword): int
    {
        $like = "%{$keyword}%";
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} WHERE username LIKE :kw OR email LIKE :kw");
        $stmt->bindValue(':kw', $like);
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }

    public function findByRole(string $role, int $page = 1, int $limit = 10): array
    {
        $offset = ($page - 1) * $limit;
        $stmt = $this->db()->prepare(
            "SELECT * FROM {$this->table} WHERE role = :role ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':role', $role);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countByRole(string $role): int
    {
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} WHERE role = :role");
        $stmt->execute([':role' => $role]);
        return (int)$stmt->fetchColumn();
    }

    public function delete(int $id): void
    {
        $stmt = $this->db()->prepare("DELETE FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
    }

    private function mapToEntity(array $row): User
    {
        return new User(
            $row['username'],
            $row['email'],
            $row['password_hash'],
            UserRole::from($row['role']),
            UserStatus::from($row['status']),
            (int)$row['id'],
            new DateTimeImmutable($row['created_at']),
            createdBy: isset($row['created_by']) && $row['created_by'] !== null ? (int)$row['created_by'] : null,
            updatedAt: !empty($row['updated_at']) ? new DateTimeImmutable($row['updated_at']) : null,
            updatedBy: isset($row['updated_by']) && $row['updated_by'] !== null ? (int)$row['updated_by'] : null
        );
    }
}
