<?php
declare(strict_types=1);

namespace Tests\Routing;

use PHPUnit\Framework\TestCase;
use src\Application\Services\ContentModerationService;
use src\Infrastructure\Repositories\ModerationRuleRepository;
use src\WebApi\Controller\V1\ModerationRuleController;
use src\WebApi\Routing\Router;

class ModerationRoutesTest extends TestCase
{
    public function testAdminModerationRoutesAreRegisteredAndProtected(): void
    {
        $repo = $this->createMock(ModerationRuleRepository::class);
        $controller = new ModerationRuleController($repo, new ContentModerationService($repo));
        $router = new Router();
        $router->register($controller);

        foreach ([
            ['GET', '/api/v1/admin/moderation-rules', 'index'],
            ['POST', '/api/v1/admin/moderation-rules', 'create'],
            ['PUT', '/api/v1/admin/moderation-rules/2', 'update'],
            ['PATCH', '/api/v1/admin/moderation-rules/2/toggle', 'toggle'],
            ['DELETE', '/api/v1/admin/moderation-rules/2', 'delete'],
            ['POST', '/api/v1/admin/moderation-rules/test', 'test'],
        ] as [$method, $path, $action]) {
            $found = $router->match($method, $path);
            $this->assertNotNull($found);
            $this->assertSame($action, $found['action']);
            $this->assertTrue($found['auth']);
            $this->assertSame(['Admin'], $found['roles']);
        }
    }
}
