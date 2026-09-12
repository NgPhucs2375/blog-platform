<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

/**
 * Interface cho UserRepository
 */
interface IUserRepository
{
    public function findById(int $id): ?object;
    public function findByEmail(string $email): ?object;
    public function findByUserName(string $userName): ?object;
    public function save(object $entity): int;
    public function update(object $entity): void;
    public function existsByEmail(string $email): bool;
    public function existsByUserName(string $userName): bool;

    /** @return object[] */
    public function getAllUsers(int $page = 1, int $limit = 10): array;
    public function countUsers(): int;

    /** @return object[] */
    public function searchUsers(string $keyword, int $page = 1, int $limit = 10): array;
    public function countSearchUsers(string $keyword): int;

    /** @return object[] */
    public function findByRole(string $role, int $page = 1, int $limit = 10): array;
    public function countByRole(string $role): int;

    /** @return object[] */
    public function findByStatus(string $status, int $page = 1, int $limit = 10): array;
    public function countByStatus(string $status): int;

    /**
     * List hợp nhất cho trang admin: kết hợp search + role + status + sort.
     * @return object[]
     */
    public function listUsers(?string $search, ?string $role, ?string $status, string $sort, int $page, int $limit, bool $includeDeleted = false): array;
    public function countListUsers(?string $search, ?string $role, ?string $status, bool $includeDeleted = false): int;

    public function delete(int $id): void;
    public function hardDelete(int $id): void;
    public function restore(int $id): void;
}
