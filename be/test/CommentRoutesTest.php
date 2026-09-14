<?php
declare(strict_types=1);

namespace Tests\Routing;

use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use src\Domain\Entities\Comment;
use src\Domain\Enums\CommentStatus;
use src\Infrastructure\Repositories\CommentRepository;
use src\Infrastructure\Repositories\PostRepository;
use src\Infrastructure\Repositories\SystemLogRepository;
use src\Infrastructure\Repositories\UserRepository;
use src\WebApi\Controller\V1\CommentController;
use src\WebApi\Routing\Router;

/**
 * TV4 Module test – Comment routes + cây Comment-Reply (Job 4.1 + 4.2).
 * Router::match() là hàm thuần; buildTree() gọi qua reflection.
 * Không chạm DB (repository đều là mock).
 */
class CommentRoutesTest extends TestCase
{
    private Router $router;
    private CommentController $controller;

    protected function setUp(): void
    {
        $this->controller = new CommentController(
            $this->createMock(CommentRepository::class),
            $this->createMock(PostRepository::class),
            $this->createMock(UserRepository::class),
            $this->createMock(SystemLogRepository::class)
        );
        $this->router = new Router();
        $this->router->register($this->controller);
    }

    public function testMatchListCommentsIsPublic(): void
    {
        $found = $this->router->match('GET', '/api/v1/posts/7/comments');

        $this->assertNotNull($found);
        $this->assertSame('index', $found['action']);
        $this->assertFalse($found['auth']);
        $this->assertSame([7], $found['args']);
    }

    public function testMatchCreateCommentRequiresAuth(): void
    {
        $found = $this->router->match('POST', '/api/v1/posts/7/comments');

        $this->assertNotNull($found);
        $this->assertSame('store', $found['action']);
        $this->assertTrue($found['auth']);
        $this->assertSame([7], $found['args']);
    }

    public function testMatchReplyRequiresAuth(): void
    {
        $found = $this->router->match('POST', '/api/v1/comments/3/reply');

        $this->assertNotNull($found);
        $this->assertSame('reply', $found['action']);
        $this->assertTrue($found['auth']);
        $this->assertSame([3], $found['args']);
    }

    public function testMatchApproveAndHideRequireAdmin(): void
    {
        $approve = $this->router->match('POST', '/api/v1/comments/3/approve');
        $hide = $this->router->match('POST', '/api/v1/comments/3/hide');

        $this->assertSame('approve', $approve['action']);
        $this->assertSame(['Admin'], $approve['roles']);
        $this->assertSame('hide', $hide['action']);
        $this->assertSame(['Admin'], $hide['roles']);
    }

    public function testMatchDeleteRequiresAuthButNotAdminRole(): void
    {
        // Xóa: chủ sở hữu hoặc Admin (check trong action) nên route chỉ cần auth.
        $found = $this->router->match('DELETE', '/api/v1/comments/3');

        $this->assertNotNull($found);
        $this->assertSame('destroy', $found['action']);
        $this->assertTrue($found['auth']);
        $this->assertSame([], $found['roles']);
    }

    public function testBuildTreeNestsReplies(): void
    {
        $comments = [
            new Comment(1, 1, 'root-1', null, CommentStatus::APPROVED, 1),
            new Comment(1, 2, 'reply-1', 1, CommentStatus::APPROVED, 2),
            new Comment(1, 3, 'reply-nested', 2, CommentStatus::APPROVED, 3),
            new Comment(1, 4, 'root-2', null, CommentStatus::APPROVED, 4),
        ];

        $tree = $this->buildTree($comments);

        $this->assertCount(2, $tree);
        $this->assertSame(1, $tree[0]['id']);
        $this->assertCount(1, $tree[0]['replies']);
        $this->assertSame(2, $tree[0]['replies'][0]['id']);
        $this->assertCount(1, $tree[0]['replies'][0]['replies']);
        $this->assertSame(3, $tree[0]['replies'][0]['replies'][0]['id']);
        $this->assertSame(4, $tree[1]['id']);
        $this->assertSame([], $tree[1]['replies']);
    }

    public function testBuildTreeLiftsOrphanToRoot(): void
    {
        // Con mồ côi (cha ngoài tập lọc Approved) không được làm mất.
        $comments = [
            new Comment(1, 1, 'orphan', 999, CommentStatus::APPROVED, 5),
        ];

        $tree = $this->buildTree($comments);

        $this->assertCount(1, $tree);
        $this->assertSame(5, $tree[0]['id']);
    }

    /**
     * @param Comment[] $comments
     * @return array<int, array<string, mixed>>
     */
    private function buildTree(array $comments): array
    {
        $method = new ReflectionMethod(CommentController::class, 'buildTree');
        $method->setAccessible(true);

        return $method->invoke($this->controller, $comments);
    }
}
