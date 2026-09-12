<?php
declare(strict_types=1);

namespace Tests\Domain;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use src\Domain\Entities\Comment;
use src\Domain\Enums\CommentStatus;

/**
 * TV4 Module test – Comment entity (Job 4.1 + 4.2).
 * Thuần domain, không chạm DB.
 */
class CommentTest extends TestCase
{
    public function testDefaultStatusIsPendingAndNotVisible(): void
    {
        $comment = new Comment(1, 2, 'Nội dung hợp lệ');

        $this->assertSame(CommentStatus::PENDING, $comment->getStatus());
        $this->assertFalse($comment->isVisible());
        $this->assertNull($comment->getParentId());
    }

    public function testApproveMakesVisibleAndTracksAudit(): void
    {
        $comment = new Comment(1, 2, 'Chờ duyệt');
        $comment->approve(9);

        $this->assertSame(CommentStatus::APPROVED, $comment->getStatus());
        $this->assertTrue($comment->isVisible());
        $this->assertSame(9, $comment->getUpdatedBy());
        $this->assertNotNull($comment->getUpdatedAt());
    }

    public function testHideMakesInvisibleAndTracksAudit(): void
    {
        $comment = new Comment(1, 2, 'Sẽ bị ẩn');
        $comment->approve(9);
        $comment->hide(10);

        $this->assertSame(CommentStatus::HIDDEN, $comment->getStatus());
        $this->assertFalse($comment->isVisible());
        $this->assertSame(10, $comment->getUpdatedBy());
    }

    public function testReplyKeepsParentId(): void
    {
        $reply = new Comment(1, 2, 'Trả lời', 5);

        $this->assertSame(5, $reply->getParentId());
        $this->assertSame(1, $reply->getPostId());
        $this->assertSame(2, $reply->getUserId());
    }

    public function testEmptyContentThrows(): void
    {
        $this->expectException(InvalidArgumentException::class);
        new Comment(1, 2, '   ');
    }

    public function testContentIsTrimmed(): void
    {
        $comment = new Comment(1, 2, '  Xin chào  ');

        $this->assertSame('Xin chào', $comment->getContent());
    }

    public function testToArrayExposesTreeFields(): void
    {
        $comment = new Comment(1, 2, 'Hi', 7, CommentStatus::APPROVED, 42);
        $arr = $comment->toArray();

        $this->assertSame(42, $arr['id']);
        $this->assertSame(1, $arr['postId']);
        $this->assertSame(2, $arr['userId']);
        $this->assertSame('Hi', $arr['content']);
        $this->assertSame(7, $arr['parentId']);
        $this->assertSame('Approved', $arr['status']);
    }
}
