<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

use src\Application\Interfaces\RepositoryInterface;
use src\Domain\Entities\Comment;
use src\Domain\Enums\CommentStatus;

/**
 * @extends RepositoryInterface<Comment>
 */
interface ICommentRepository extends RepositoryInterface
{
    public function findById(int $id): ?Comment;
    
    /** @return Comment[] */
    public function getByPostId(int $postId, ?CommentStatus $status = null, int $page = 1, int $limit = 10): array;
    
    /** @return Comment[] */
    public function getByUserId(int $userId, int $page = 1, int $limit = 10): array;
    
    /**
     * Lấy các bình luận con (replies) dựa trên ID của bình luận cha
     * @return Comment[] 
     */
    public function getReplies(int $parentId, ?CommentStatus $status = null): array;
    
    public function countByPostId(int $postId, ?CommentStatus $status = null): int;
}