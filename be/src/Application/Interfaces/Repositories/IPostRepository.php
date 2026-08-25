<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

use src\Application\Interfaces\RepositoryInterface;
use src\Domain\Entities\Post;
use src\Domain\Enums\PostStatus;

/**
 * @extends RepositoryInterface<Post>
 */
interface IPostRepository extends RepositoryInterface
{
    public function findById(int $id): ?Post;
    public function findBySlug(string $slug): ?Post;
    
    /** @return Post[] */
    public function getPublishedPosts(?string $keyword = null, ?int $categoryId = null, ?int $authorId = null, int $page = 1, int $limit = 10): array;
    
    /** @return Post[] */
    public function getPostsByStatus(PostStatus $status, int $page = 1, int $limit = 10): array;
    
    /** @return Post[] */
    public function getPostsByAuthorId(int $authorId, ?PostStatus $status = null, int $page = 1, int $limit = 10): array;
    
    public function countPostsByStatus(PostStatus $status): int;
}