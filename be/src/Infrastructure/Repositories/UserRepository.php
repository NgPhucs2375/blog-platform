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

    public function save(object $entity): void
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

    private function mapToEntity(array $row): User
    {
        return new User(
            $row['username'],
            $row['email'],
            $row['password_hash'],
            UserRole::from($row['role']),
            UserStatus::from($row['status']),
            (int)$row['id'],
            new DateTimeImmutable($row['created_at'])
        );
    }
}