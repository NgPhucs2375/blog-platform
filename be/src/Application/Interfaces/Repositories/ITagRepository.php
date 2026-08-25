<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

use src\Application\Interfaces\RepositoryInterface;
use src\Domain\Entities\Tag;

/**
 * @extends RepositoryInterface<Tag>
 */
interface ITagRepository extends RepositoryInterface
{
    public function findById(int $id): ?Tag;
    public function findBySlug(string $slug): ?Tag;
    
    /** @return Tag[] */
    public function getAllTags(): array;
    
    /** @param int[] $tagIds */
    public function attachToPost(int $postId, array $tagIds): void;
    
    /** @param int[] $tagIds */
    public function syncPostTags(int $postId, array $tagIds): void;
}