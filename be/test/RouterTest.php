<?php
declare(strict_types=1);

namespace Tests\Routing;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use src\WebApi\Routing\Route;
use src\WebApi\Routing\Router;

class FakeArticleController
{
    #[Route('GET', '/api/v1/articles')]
    public function index(): array
    {
        return [];
    }

    #[Route('GET', '/api/v1/articles/{id}', auth: true, roles: ['Admin'])]
    public function show(array $user, int $id): array
    {
        return [$id];
    }

    #[Route('GET', '/api/v1/articles/by-slug/{slug:[a-z]+[a-z0-9-]*}')]
    public function bySlug(string $slug): array
    {
        return [$slug];
    }
}

/**
 * Chỉ test Router::match() (hàm thuần, không exit).
 * dispatch()/invoke() luôn exit qua ResponseService nên không test in-process.
 */
class RouterTest extends TestCase
{
    private Router $router;

    protected function setUp(): void
    {
        $this->router = new Router();
        $this->router->register(new FakeArticleController());
    }

    public function testMatchPublicRoute(): void
    {
        $found = $this->router->match('GET', '/api/v1/articles');

        $this->assertNotNull($found);
        $this->assertSame('index', $found['action']);
        $this->assertFalse($found['auth']);
        $this->assertSame([], $found['args']);
    }

    public function testMatchRouteWithIdCastsToInt(): void
    {
        $found = $this->router->match('GET', '/api/v1/articles/42');

        $this->assertNotNull($found);
        $this->assertSame('show', $found['action']);
        $this->assertTrue($found['auth']);
        $this->assertSame(['Admin'], $found['roles']);
        $this->assertSame([42], $found['args']);
    }

    public function testMatchRouteWithCustomRegex(): void
    {
        $found = $this->router->match('GET', '/api/v1/articles/by-slug/hello-world-123');

        $this->assertNotNull($found);
        $this->assertSame('bySlug', $found['action']);
        $this->assertSame(['hello-world-123'], $found['args']);
    }

    public function testMatchReturnsNullForUnknownRoute(): void
    {
        $this->assertNull($this->router->match('GET', '/api/v1/nope'));
    }

    public function testMatchReturnsNullForWrongMethod(): void
    {
        $this->assertNull($this->router->match('POST', '/api/v1/articles'));
    }

    public function testMatchIgnoresQueryString(): void
    {
        $found = $this->router->match('GET', '/api/v1/articles?page=2');

        $this->assertNotNull($found);
        $this->assertSame('index', $found['action']);
    }

    public function testDuplicateRouteThrows(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->router->register(new FakeArticleController());
    }
}
