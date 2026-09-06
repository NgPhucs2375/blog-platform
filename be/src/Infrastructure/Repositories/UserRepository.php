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

    /** Cache tên cột của bảng users để chạy được cả khi chưa migrate 003. */
    private ?array $columnsCache = null;

    public function findById(int $id): ?User
    {
        // Trả về cả user đã xóa mềm để trang detail/restore hiển thị được.
        $stmt = $this->db()->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findByEmail(string $email): ?User
    {
        // Tương thích DB chưa migrate 003 (chưa có deleted_at).
        $filter = $this->hasColumn('deleted_at') ? " AND deleted_at IS NULL" : "";
        $stmt = $this->db()->prepare(
            "SELECT * FROM {$this->table} WHERE email = ?{$filter}"
        );
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function findByUserName(string $userName): ?User
    {
        $filter = $this->hasColumn('deleted_at') ? " AND deleted_at IS NULL" : "";
        $stmt = $this->db()->prepare(
            "SELECT * FROM {$this->table} WHERE username = ?{$filter}"
        );
        $stmt->execute([$userName]);
        $row = $stmt->fetch();
        return $row ? $this->mapToEntity($row) : null;
    }

    public function existsByEmail(string $email): bool
    {
        $filter = $this->hasColumn('deleted_at') ? " AND deleted_at IS NULL" : "";
        $stmt = $this->db()->prepare(
            "SELECT COUNT(*) FROM {$this->table} WHERE email = ?{$filter}"
        );
        $stmt->execute([$email]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function existsByUserName(string $userName): bool
    {
        $filter = $this->hasColumn('deleted_at') ? " AND deleted_at IS NULL" : "";
        $stmt = $this->db()->prepare(
            "SELECT COUNT(*) FROM {$this->table} WHERE username = ?{$filter}"
        );
        $stmt->execute([$userName]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function save(object $entity): int
    {
        if (!$entity instanceof User) throw new InvalidArgumentException("Input must be User Entity");

        // Chỉ INSERT cột nào DB đã có (DB cũ chưa có created_by).
        $cols = ['username', 'email', 'password_hash', 'role', 'status', 'created_at'];
        $params = [
            ':username' => $entity->getUserName(),
            ':email' => $entity->getEmail(),
            ':password_hash' => $entity->getPasswordHash(),
            ':role' => $entity->getRole()->value,
            ':status' => $entity->getStatus()->value,
            ':created_at' => $entity->getCreatedAt()->format('Y-m-d H:i:s'),
        ];
        if ($this->hasColumn('created_by')) {
            $cols[] = 'created_by';
            $params[':created_by'] = $entity->getCreatedBy();
        }
        $placeholders = array_map(fn($c) => ':' . $c, $cols);
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $cols) . ")
                VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute($params);

        if ($this->driver() === 'mysql') {
            return (int) $this->db()->lastInsertId();
        }
        return (int) $this->db()->lastInsertId('users_id_seq');
    }

    public function update(object $entity): void
    {
        if (!$entity instanceof User) throw new InvalidArgumentException("Input must be User Entity");

        // Chỉ UPDATE cột nào DB đã có (DB cũ chỉ có 6 cột gốc).
        $sets = ['username = :username', 'email = :email', 'password_hash = :password_hash',
            'role = :role', 'status = :status'];
        $params = [
            ':id' => $entity->getId(),
            ':username' => $entity->getUserName(),
            ':email' => $entity->getEmail(),
            ':password_hash' => $entity->getPasswordHash(),
            ':role' => $entity->getRole()->value,
            ':status' => $entity->getStatus()->value,
        ];
        if ($this->hasColumn('updated_at')) {
            $sets[] = 'updated_at = :updated_at';
            $params[':updated_at'] = $entity->getUpdatedAt()?->format('Y-m-d H:i:s');
        }
        if ($this->hasColumn('updated_by')) {
            $sets[] = 'updated_by = :updated_by';
            $params[':updated_by'] = $entity->getUpdatedBy();
        }
        if ($this->hasColumn('deleted_at')) {
            $sets[] = 'deleted_at = :deleted_at';
            $params[':deleted_at'] = $entity->getDeletedAt()?->format('Y-m-d H:i:s');
        }
        if ($this->hasColumn('deleted_by')) {
            $sets[] = 'deleted_by = :deleted_by';
            $params[':deleted_by'] = $entity->getDeletedBy();
        }
        $sql = "UPDATE {$this->table} SET " . implode(', ', $sets) . " WHERE id = :id";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute($params);
    }

    public function getAllUsers(int $page = 1, int $limit = 10): array
    {
        return $this->listUsers(null, null, null, 'created_at_desc', $page, $limit);
    }

    public function countUsers(): int
    {
        return $this->countListUsers(null, null, null);
    }

    public function searchUsers(string $keyword, int $page = 1, int $limit = 10): array
    {
        return $this->listUsers($keyword, null, null, 'created_at_desc', $page, $limit);
    }

    public function countSearchUsers(string $keyword): int
    {
        return $this->countListUsers($keyword, null, null);
    }

    public function findByRole(string $role, int $page = 1, int $limit = 10): array
    {
        return $this->listUsers(null, $role, null, 'created_at_desc', $page, $limit);
    }

    public function countByRole(string $role): int
    {
        return $this->countListUsers(null, $role, null);
    }

    public function findByStatus(string $status, int $page = 1, int $limit = 10): array
    {
        return $this->listUsers(null, null, $status, 'created_at_desc', $page, $limit);
    }

    public function countByStatus(string $status): int
    {
        return $this->countListUsers(null, null, $status);
    }

    /**
     * List hợp nhất: AND các filter search/role/status, ẩn deleted mặc định.
     */
    public function listUsers(?string $search, ?string $role, ?string $status, string $sort, int $page, int $limit, bool $includeDeleted = false): array
    {
        [$where, $params] = $this->buildFilter($search, $role, $status, $includeDeleted);
        $offset = ($page - 1) * $limit;
        $orderBy = $this->orderBy($sort);
        $sql = "SELECT * FROM {$this->table} {$where} {$orderBy} LIMIT :limit OFFSET :offset";
        $stmt = $this->db()->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return array_map([$this, 'mapToEntity'], $stmt->fetchAll());
    }

    public function countListUsers(?string $search, ?string $role, ?string $status, bool $includeDeleted = false): int
    {
        [$where, $params] = $this->buildFilter($search, $role, $status, $includeDeleted);
        $stmt = $this->db()->prepare("SELECT COUNT(*) FROM {$this->table} {$where}");
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        return (int)$stmt->fetchColumn();
    }

    /**
     * Xóa mềm mặc định: đánh dấu deleted_at/deleted_by thay vì DELETE vật lý.
     * Giữ FK posts/comments, cho phép restore + tái sử dụng flow audit.
     * Nếu DB chưa migrate 003 (không có deleted_at) thì fallback xóa cứng
     * để không vỡ 500.
     */
    public function delete(int $id): void
    {
        if (!$this->hasColumn('deleted_at')) {
            $this->hardDelete($id);
            return;
        }
        $stmt = $this->db()->prepare(
            "UPDATE {$this->table} SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL"
        );
        $stmt->execute([$id]);
        // DB cũ: dòng không đổi (đã xóa hoặc không tồn tại) -> xóa cứng cho sạch.
        if ($stmt->rowCount() === 0) {
            $found = $this->findById($id);
            if ($found !== null && !$found->isDeleted()) {
                $this->hardDelete($id);
            }
        }
    }

    public function hardDelete(int $id): void
    {
        $stmt = $this->db()->prepare("DELETE FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function restore(int $id): void
    {
        if (!$this->hasColumn('deleted_at')) {
            return;
        }
        $sql = "UPDATE {$this->table} SET deleted_at = NULL"
            . ($this->hasColumn('deleted_by') ? ", deleted_by = NULL" : "")
            . " WHERE id = ?";
        $stmt = $this->db()->prepare($sql);
        $stmt->execute([$id]);
    }

    /**
     * @return array{0: string, 1: array<string,string>}
     */
    private function buildFilter(?string $search, ?string $role, ?string $status, bool $includeDeleted): array
    {
        $where = [];
        $params = [];

        if (!$includeDeleted && $this->hasColumn('deleted_at')) {
            $where[] = "deleted_at IS NULL";
        }
        if ($search !== null && trim($search) !== '') {
            $op = $this->driver() === 'pgsql' ? 'ILIKE' : 'LIKE';
            $where[] = "(username {$op} :kw OR email {$op} :kw)";
            $params[':kw'] = '%' . trim($search) . '%';
        }
        if ($role !== null && $role !== '') {
            $where[] = "role = :role";
            $params[':role'] = $role;
        }
        if ($status !== null && $status !== '') {
            $where[] = "status = :status";
            $params[':status'] = $status;
        }

        $clause = $where === [] ? '' : 'WHERE ' . implode(' AND ', $where);
        return [$clause, $params];
    }

    private function orderBy(string $sort): string
    {
        return match ($sort) {
            'created_at_asc' => 'ORDER BY created_at ASC',
            'username_asc' => 'ORDER BY username ASC',
            'username_desc' => 'ORDER BY username DESC',
            'email_asc' => 'ORDER BY email ASC',
            'email_desc' => 'ORDER BY email DESC',
            default => 'ORDER BY created_at DESC',
        };
    }

    private function driver(): string
    {
        try {
            return (string) $this->db()->getAttribute(PDO::ATTR_DRIVER_NAME);
        } catch (\Throwable) {
            return 'pgsql';
        }
    }

    private function hasColumn(string $column): bool
    {
        return in_array(strtolower($column), $this->tableColumns(), true);
    }

    /** @return string[] tên cột viết thường của bảng users. */
    private function tableColumns(): array
    {
        if ($this->columnsCache !== null) {
            return $this->columnsCache;
        }
        try {
            $stmt = $this->db()->prepare(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
            );
            $stmt->execute();
            $cols = array_map(
                fn($c) => strtolower((string)$c),
                $stmt->fetchAll(PDO::FETCH_COLUMN)
            );
            $this->columnsCache = $cols !== [] ? $cols : $this->baseColumns();
        } catch (\Throwable) {
            $this->columnsCache = $this->baseColumns();
        }
        return $this->columnsCache;
    }

    /** @return string[] cột chắc chắn có từ migration 001. */
    private function baseColumns(): array
    {
        return ['id', 'username', 'email', 'password_hash', 'role', 'status', 'created_at'];
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
            updatedBy: isset($row['updated_by']) && $row['updated_by'] !== null ? (int)$row['updated_by'] : null,
            deletedAt: !empty($row['deleted_at']) ? new DateTimeImmutable($row['deleted_at']) : null,
            deletedBy: isset($row['deleted_by']) && $row['deleted_by'] !== null ? (int)$row['deleted_by'] : null
        );
    }
}
