<?php
declare(strict_types=1);

namespace Tests\Routing;

use PHPUnit\Framework\TestCase;
use src\Infrastructure\Repositories\PostRepository;
use src\Infrastructure\Repositories\SystemLogRepository;
use src\WebApi\Controller\V1\PostController;
use src\WebApi\Controller\V1\SystemLogController;
use src\WebApi\Routing\Router;

/**
 * TV4 Module test – routes Search/Filter/Pagination + SystemLogs
 * (Job 4.3 + 4.4 + 4.5). Không chạm DB (repository đều là mock).
 */
class Tv4SearchLogRoutesTest extends TestCase
{
    private Router $router;

    protected function setUp(): void
    {
        $this->router = new Router();
        $this->router->register(new PostController(
            $this->createMock(PostRepository::class),
            $this->createMock(SystemLogRepository::class)
        ));
        $this->router->register(new SystemLogController(
            $this->createMock(SystemLogRepository::class)
        ));
    }

    public function testPostSearchRouteIsPublic(): void
    {
        $found = $this->router->match('GET', '/api/v1/posts');

        $this->assertNotNull($found);
        $this->assertSame('index', $found['action']);
        $this->assertFalse($found['auth']);
    }

    public function testPostSearchIgnoresQueryString(): void
    {
        // keyword/categoryId/authorId/fromDate/toDate/page/limit nằm ở $_GET, không thuộc path.
        $found = $this->router->match('GET', '/api/v1/posts?keyword=hello&authorId=1&page=2');

        $this->assertNotNull($found);
        $this->assertSame('index', $found['action']);
    }

    public function testPostApproveRequiresAdmin(): void
    {
        $found = $this->router->match('POST', '/api/v1/posts/9/approve');

        $this->assertNotNull($found);
        $this->assertSame('approve', $found['action']);
        $this->assertTrue($found['auth']);
        $this->assertSame(['Admin'], $found['roles']);
        $this->assertSame([9], $found['args']);
    }

    public function testSystemLogsRouteRequiresAdmin(): void
    {
        $found = $this->router->match('GET', '/api/v1/admin/logs');

        $this->assertNotNull($found);
        $this->assertSame('index', $found['action']);
        $this->assertTrue($found['auth']);
        $this->assertSame(['Admin'], $found['roles']);
    }

    public function testSystemLogsIgnoresQueryString(): void
    {
        $found = $this->router->match('GET', '/api/v1/admin/logs?action=CREATE&targetType=Comments&page=1');

        $this->assertNotNull($found);
        $this->assertSame('index', $found['action']);
    }

    public function testPaginationMath(): void
    {
        // Format thống nhất Job 4.4: totalPages = ceil(total / limit).
        $this->assertSame(0, (int)ceil(0 / 10));
        $this->assertSame(1, (int)ceil(1 / 10));
        $this->assertSame(2, (int)ceil(11 / 10));
        $this->assertSame(3, (int)ceil(21 / 10));
    }
}
