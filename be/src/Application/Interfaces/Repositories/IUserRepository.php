<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

use src\Application\Interfaces\RepositoryInterface;
use src\Domain\Entities\User;

/**
 * @extends RepositoryInterface<User>
 */
interface IUserRepository extends RepositoryInterface
{
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function findByUserName(string $userName): ?User;
    
    /** @return User[] */
    public function getAllUsers(int $page = 1, int $limit = 10): array;
    public function countUsers(): int;
}