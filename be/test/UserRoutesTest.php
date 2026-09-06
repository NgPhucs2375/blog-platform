<?php
declare(strict_types=1);

namespace Tests\Routing;

use PHPUnit\Framework\TestCase;
use src\WebApi\Routing\Router;
use src\Infrastructure\Repositories\UserRepository;
use src\WebApi\Controller\V1\UserController;

/**
 * Đảm bảo các route User Manager không trùng và match đúng,
 * kể cả route mới: store / restore / bulk-*.
 * Dùng UserRepository mock lỏng (không gọi DB trong test này).
 */
class UserRoutesTest extends TestCase
{
    private Router $router;

    protected function setUp(): void
    {
        $repo = $this->createMock(UserRepository::class);
        $controller = new UserController($repo);
        $this->router = new Router();
        $this->router->register($controller);
    }

    public function testMatchListAndDetail(): void
    {
        $list = $this->router->match('GET', '/api/v1/admin/users');
        $this->assertNotNull($list);
        $this->assertSame('index', $list['action']);

        $detail = $this->router->match('GET', '/api/v1/admin/users/42');
        $this->assertNotNull($detail);
        $this->assertSame('show', $detail['action']);
        $this->assertSame([42], $detail['args']);
    }

    public function testMatchRoleLockUnlockRestoreDelete(): void
    {
        $this->assertSame('updateRole', $this->router->match('PUT', '/api/v1/admin/users/1/role')['action']);
        $this->assertSame('lock', $this->router->match('POST', '/api/v1/admin/users/1/lock')['action']);
        $this->assertSame('unlock', $this->router->match('POST', '/api/v1/admin/users/1/unlock')['action']);
        $this->assertSame('restore', $this->router->match('POST', '/api/v1/admin/users/1/restore')['action']);
        $this->assertSame('delete', $this->router->match('DELETE', '/api/v1/admin/users/1')['action']);
    }

    public function testMatchStoreAndBulk(): void
    {
        $this->assertSame('store', $this->router->match('POST', '/api/v1/admin/users')['action']);
        $this->assertSame('bulkLock', $this->router->match('POST', '/api/v1/admin/users/bulk-lock')['action']);
        $this->assertSame('bulkUnlock', $this->router->match('POST', '/api/v1/admin/users/bulk-unlock')['action']);
        $this->assertSame('bulkDelete', $this->router->match('POST', '/api/v1/admin/users/bulk-delete')['action']);
    }

    public function testAdminRoutesRequireAdminRole(): void
    {
        $found = $this->router->match('GET', '/api/v1/admin/users');
        $this->assertNotNull($found);
        $this->assertTrue($found['auth']);
        $this->assertSame(['Admin'], $found['roles']);
    }
}
