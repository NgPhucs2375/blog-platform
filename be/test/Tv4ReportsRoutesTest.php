<?php
declare(strict_types=1);

namespace Tests\Routing;

use PHPUnit\Framework\TestCase;
use src\Infrastructure\Repositories\CommentRepository;
use src\Infrastructure\Repositories\PostRepository;
use src\Infrastructure\Repositories\SystemLogRepository;
use src\Infrastructure\Repositories\UserRepository;
use src\WebApi\Controller\V1\CommentController;
use src\WebApi\Routing\Router;

/**
 * TV4 Module test – routes hỗ trợ Reports/Statistics (đúng domain Comment,
 * không lấn User/Post của TV2/TV3). Không chạm DB (repository là mock).
 */
class Tv4ReportsRoutesTest extends TestCase
{
    private Router $router;

    protected function setUp(): void
    {
        $controller = new CommentController(
            $this->createMock(CommentRepository::class),
            $this->createMock(PostRepository::class),
            $this->createMock(UserRepository::class),
            $this->createMock(SystemLogRepository::class)
        );
        $this->router = new Router();
        $this->router->register($controller);
    }

    public function testAdminQueueRequiresAdmin(): void
    {
        $found = $this->router->match('GET', '/api/v1/admin/comments');

        $this->assertNotNull($found);
        $this->assertSame('adminIndex', $found['action']);
        $this->assertTrue($found['auth']);
        $this->assertSame(['Admin'], $found['roles']);
    }

    public function testAdminStatsRequiresAdmin(): void
    {
        $found = $this->router->match('GET', '/api/v1/admin/comments/stats');

        $this->assertNotNull($found);
        $this->assertSame('stats', $found['action']);
        $this->assertTrue($found['auth']);
        $this->assertSame(['Admin'], $found['roles']);
    }

    public function testPublicCountIsPublic(): void
    {
        $found = $this->router->match('GET', '/api/v1/posts/7/comments/count');

        $this->assertNotNull($found);
        $this->assertSame('count', $found['action']);
        $this->assertFalse($found['auth']);
        $this->assertSame([7], $found['args']);
    }

    public function testCountRouteDoesNotClashWithListRoute(): void
    {
        $list = $this->router->match('GET', '/api/v1/posts/7/comments');
        $count = $this->router->match('GET', '/api/v1/posts/7/comments/count');

        $this->assertSame('index', $list['action']);
        $this->assertSame('count', $count['action']);
    }
}
