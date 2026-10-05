<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

use src\Application\Interfaces\RepositoryInterface;
use src\Domain\Entities\Like;

/**
 * @extends RepositoryInterface<Like>
 */
interface ILikeRepository extends RepositoryInterface
{
    public function findById(int $id): ?Like;
    
    public function hasLiked(int $userId, int $postId): bool;
    
    public function findByUserAndPost(int $userId, int $postId): ?Like;
    
    /** @return Like[] */
    public function getLikesByPostId(int $postId, int $page = 1, int $limit = 10): array;
    
    public function countByPostId(int $postId): int;
}