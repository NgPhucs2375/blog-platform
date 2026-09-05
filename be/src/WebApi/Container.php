<?php
declare(strict_types=1);

namespace src\WebApi;

use RuntimeException;
use src\Infrastructure\Context\DbContext;
use src\Infrastructure\Repositories\CategoryRepository;
use src\Infrastructure\Repositories\PostRepository;
use src\Infrastructure\Repositories\RefreshTokenRepository;
use src\Infrastructure\Repositories\SystemLogRepository;
use src\Infrastructure\Repositories\UserRepository;
use src\Infrastructure\Services\JwtTokenService;
use src\WebApi\Controller\V1\AuthController;
use src\WebApi\Controller\V1\CategoryController;
use src\WebApi\Controller\V1\PostController;
use src\WebApi\Controller\V1\ProfileController;
use src\WebApi\Controller\V1\UserController;
use src\WebApi\Controller\HealthController;
use src\WebApi\Middlewares\AuthMiddleware;
use src\WebApi\Middlewares\CorsMiddleware;
use src\WebApi\Routing\Router;

/**
 * Composition root của ứng dụng: nơi duy nhất biết cách dựng
 * và nối các object với nhau. Thay thế các hàm make*() + biến
 * global trong public/index.php trước đây.
 *
 * - DbContext/Jwt/Auth dùng chung 1 instance cho cả request (singleton ).
 * - Repository/Controller dựng mới qua factory method khi cần.
 * - JWT_SECRET thiếu → fail-fast ngay lúc boot thay vì lặng lẽ
 *   dùng key cứng như trước (lỗi bảo mật).
 */
class Container
{
    private ?DbContext $dbContext = null;
    private ?JwtTokenService $jwtService = null;
    private ?AuthMiddleware $authMiddleware = null;
    private ?CorsMiddleware $corsMiddleware = null;
    private ?Router $router = null;

    // --- Hạ tầng dùng chung ---

    public function db(): DbContext
    {
        return $this->dbContext ??= new DbContext();
    }

    public function jwt(): JwtTokenService
    {
        return $this->jwtService ??= new JwtTokenService($this->jwtSecret());
    }

    public function auth(): AuthMiddleware
    {
        return $this->authMiddleware ??= new AuthMiddleware($this->jwtSecret());
    }

    public function cors(): CorsMiddleware
    {
        return $this->corsMiddleware ??= new CorsMiddleware();
    }

    // --- Repository ---

    public function users(): UserRepository
    {
        return new UserRepository($this->db());
    }

    public function posts(): PostRepository
    {
        return new PostRepository($this->db());
    }

    public function categories(): CategoryRepository
    {
        return new CategoryRepository($this->db());
    }

    public function systemLogs(): SystemLogRepository
    {
        return new SystemLogRepository($this->db());
    }

    public function refreshTokens(): RefreshTokenRepository
    {
        return new RefreshTokenRepository($this->db());
    }

    // --- Controller ---

    public function authController(): AuthController
    {
        return new AuthController($this->users(), $this->jwt(), $this->refreshTokens());
    }

    public function userController(): UserController
    {
        return new UserController($this->users());
    }

    public function profileController(): ProfileController
    {
        return new ProfileController($this->users());
    }

    public function postController(): PostController
    {
        return new PostController($this->posts(), $this->systemLogs());
    }

    public function categoryController(): CategoryController
    {
        return new CategoryController($this->categories());
    }

    public function healthController(): HealthController
    {
        return new HealthController();
    }

    // --- Router đã nạp đủ controller (Step 4 sẽ gắn attribute lên controller) ---

    public function router(): Router
    {
        if ($this->router === null) {
            $this->router = new Router($this->auth());
            $this->router->register($this->authController());
            $this->router->register($this->userController());
            $this->router->register($this->profileController());
            $this->router->register($this->postController());
            $this->router->register($this->categoryController());
            $this->router->register($this->healthController());
        }
        return $this->router;
    }

    private function jwtSecret(): string
    {
        $secret = getenv('JWT_SECRET');
        if ($secret === false || trim($secret) === '') {
            throw new RuntimeException('Thiếu biến môi trường JWT_SECRET.');
        }
        return $secret;
    }
}
