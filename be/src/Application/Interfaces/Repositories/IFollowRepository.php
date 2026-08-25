<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

use src\Application\Interfaces\RepositoryInterface;
use src\Domain\Entities\Follow;

/**
 * @extends RepositoryInterface<Follow>
 */
interface IFollowRepository extends RepositoryInterface
{
    public function findById(int $id): ?Follow;
    
    public function isFollowing(int $followerId, int $followingId): bool;
    
    public function findByFollowerAndFollowing(int $followerId, int $followingId): ?Follow;
    
    /** 
     * Danh sách những người đang theo dõi tác giả này
     * @return Follow[] 
     */
    public function getFollowers(int $userId, int $page = 1, int $limit = 10): array;
    
    /** 
     * Danh sách những tác giả mà người dùng này đang theo dõi
     * @return Follow[] 
     */
    public function getFollowing(int $userId, int $page = 1, int $limit = 10): array;
    
    public function countFollowers(int $userId): int;
    
    public function countFollowing(int $userId): int;
}