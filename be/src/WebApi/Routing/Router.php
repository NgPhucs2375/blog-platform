<?php
declare(strict_types=1);

namespace src\WebApi\Routing;

use InvalidArgumentException;
use ReflectionClass;
use ReflectionMethod;
use src\WebApi\Middlewares\AuthMiddleware;
use src\WebApi\Middlewares\RoleMiddleware;
use src\WebApi\Services\ResponseService;
use Throwable;

/**
 * Router tối giản thay khối if-route viết tay trong public/index.php.
 *
 * Vòng đời 1 request:
 *   1. Container đăng ký controller: $router->register($authController);
 *   2. Entry point dispatch: $router->dispatch($_SERVER['REQUEST_METHOD'], $uri);
 *   3. Router tìm route khớp (method + path) → chạy pipeline:
 *        AuthMiddleware (nếu auth: true) → RoleMiddleware (nếu có roles)
 *        → gọi action với (payload $user?, ...path params)
 *   4. Không khớp route → JSON 404. Exception lọt ra → JSON 500
 *      (không còn fatal HTML trắng trang như trước).
 *
 * Lưu ý: ResponseService::error()/json() có kiểu trả về `never` (exit ngay),
 * nên action hiện tại luôn kết thúc bên trong. Nếu action nào return dữ liệu
 * (thay vì gọi $this->json), Router sẽ bọc thành JSON 200.
 */
class Router
{
    /**
     * @var array<int, array{method:string, regex:string, params:string[], controller:object, action:string, auth:bool, roles:string[]}>
     */
    private array $routes = [];

    public function __construct(private ?AuthMiddleware $authMiddleware = null)
    {
    }

    /**
     * Quét mọi public method của controller, thu thập attribute #[Route].
     * Một action được gắn nhiều attribute (IS_REPEATABLE), ví dụ cả GET lẫn HEAD.
     *
     * @throws InvalidArgumentException khi đăng ký trùng method + path.
     */
    public function register(object $controller): void
    {
        $reflection = new ReflectionClass($controller);

        foreach ($reflection->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
            foreach ($method->getAttributes(Route::class) as $attribute) {
                /** @var Route $route */
                $route = $attribute->newInstance();
                [$regex, $paramNames] = $this->compile($route->path);
                $httpMethod = strtoupper($route->method);

                foreach ($this->routes as $existing) {
                    if ($existing['method'] === $httpMethod && $existing['regex'] === $regex) {
                        throw new InvalidArgumentException(
                            "Trùng route: {$httpMethod} {$route->path} " .
                            "({$reflection->getName()}::{$method->getName()})"
                        );
                    }
                }

                $this->routes[] = [
                    'method' => $httpMethod,
                    'regex' => $regex,
                    'params' => $paramNames,
                    'controller' => $controller,
                    'action' => $method->getName(),
                    'auth' => $route->auth,
                    'roles' => $route->roles,
                ];
            }
        }
    }

    /**
     * Tìm route khớp mà KHÔNG thực thi — hàm thuần, dùng được trong unit test.
     *
     * @return array{controller:object, action:string, auth:bool, roles:string[], args:array}|null
     */
    public function match(string $method, string $uri): ?array
    {
        $httpMethod = strtoupper($method);
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';

        foreach ($this->routes as $route) {
            if ($route['method'] !== $httpMethod) {
                continue;
            }
            if (preg_match($route['regex'], $path, $matches) !== 1) {
                continue;
            }

            $args = [];
            foreach ($route['params'] as $name) {
                $args[] = $this->castParam($matches[$name] ?? null);
            }

            return [
                'controller' => $route['controller'],
                'action' => $route['action'],
                'auth' => $route['auth'],
                'roles' => $route['roles'],
                'args' => $args,
            ];
        }

        return null;
    }

    /**
     * Điều phối request tới action phù hợp. Hàm này không bao giờ return
     * trong luồng chạy thật (mọi nhánh đều exit qua ResponseService).
     */
    public function dispatch(string $method, string $uri): void
    {
        $found = $this->match($method, $uri);

        if ($found === null) {
            ResponseService::error('Route không tồn tại: ' . $method . ' ' . $uri, 404);
        }

        $this->invoke($found);
    }

    /**
     * Chạy pipeline middleware rồi gọi action.
     * AuthMiddleware/RoleMiddleware tự exit 401/403 khi fail (giữ nguyên class cũ).
     */
    private function invoke(array $found): void
    {
        try {
            $args = $found['args'];

            if ($found['auth']) {
                if ($this->authMiddleware === null) {
                    ResponseService::error('Route yêu cầu xác thực nhưng thiếu AuthMiddleware.', 500);
                }
                $user = $this->authMiddleware->handle();

                if (!empty($found['roles'])) {
                    RoleMiddleware::checkRole($user, $found['roles']);
                }

                array_unshift($args, $user);
            }

            $result = $found['controller']->{$found['action']}(...$args);

            if ($result !== null) {
                ResponseService::json($result);
            }
        } catch (Throwable $e) {
            ResponseService::error('Lỗi hệ thống: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Biên dịch path pattern thành regex.
     *   '/api/v1/admin/users/{id}'      → '#^/api/v1/admin/users/(?P<id>[^/]+)$#'
     *   '/api/v1/posts/{slug:[a-z0-9-]+}' → dùng regex sau dấu ':'.
     *
     * @return array{0:string, 1:string[]} [regex, tên param theo thứ tự xuất hiện]
     */
    private function compile(string $path): array
    {
        $paramNames = [];

        $regex = preg_replace_callback(
            '#\{(\w+)(?::([^}]+))?\}#',
            function (array $m) use (&$paramNames): string {
                $paramNames[] = $m[1];
                return '(?P<' . $m[1] . '>' . ($m[2] ?? '[^/]+') . ')';
            },
            $path
        );

        return ['#^' . $regex . '$#', $paramNames];
    }

    /**
     * Path param toàn số (ví dụ {id}) tự cast sang int để action
     * khai báo `int $id` đúng kiểu strict_types.
     */
    private function castParam(?string $value): int|string|null
    {
        if ($value !== null && ctype_digit($value)) {
            return (int) $value;
        }
        return $value;
    }
}
