<?php
declare(strict_types=1);

namespace src\WebApi\Routing;

use Attribute;

/**
 * Khai báo route ngay trên method controller (cảm hứng từ attribute routing của C#).
 *
 * Ví dụ:
 *   #[Route('POST', '/api/v1/auth/register')]
 *   public function register(): void { ... }
 *
 *   #[Route('GET', '/api/v1/admin/users/{id}', auth: true, roles: ['Admin'])]
 *   public function show(array $user, int $id): void { ... }
 *
 * Quy ước path param:
 *   - {id}    → khớp 1 segment bất kỳ ([^/]+), số nguyên tự cast sang int
 *   - {id:\d+} → khớp theo regex tự định nghĩa sau dấu hai chấm
 *
 * Quy ước action (do Router thực thi):
 *   - Route public (auth: false): action không nhận tham số auth,
 *     chỉ nhận path param theo đúng thứ tự xuất hiện trong path.
 *   - Route auth: true: tham số ĐẦU TIÊN của action phải là `array $user`
 *     (payload JWT do AuthMiddleware trả về), sau đó mới tới path param.
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Route
{
    public function __construct(
        public string $method,
        public string $path,
        public bool $auth = false,
        public array $roles = []
    ) {
    }
}
