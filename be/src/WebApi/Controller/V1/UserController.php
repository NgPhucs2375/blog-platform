<?php
declare(strict_types=1);

namespace src\WebApi\Controller\V1;

use src\WebApi\Controller\BaseController;
use src\Infrastructure\Repositories\UserRepository;
use src\Infrastructure\Repositories\RefreshTokenRepository;
use src\Infrastructure\Repositories\SystemLogRepository;
use src\Domain\Entities\User;
use src\Domain\Entities\SystemLog;
use src\Domain\Enums\UserRole;
use src\Domain\Enums\UserStatus;
use src\Domain\Enums\LogAction;
use src\Domain\Enums\LogTargetType;
use src\Domain\Validation\AuthValidator;
use src\WebApi\Routing\Route;
use Exception;
use Throwable;

class UserController extends BaseController
{
    private const VALID_ROLES = ['Admin', 'User'];
    private const VALID_STATUSES = ['Active', 'Locked'];
    private const VALID_SORTS = [
        'created_at_desc', 'created_at_asc',
        'username_asc', 'username_desc',
        'email_asc', 'email_desc',
    ];

    public function __construct(
        private UserRepository $userRepository,
        private ?RefreshTokenRepository $refreshRepository = null,
        private ?SystemLogRepository $logRepository = null
    ) {}

    #[Route('GET', '/api/v1/admin/users', auth: true, roles: ['Admin'])]
    public function index(array $user): void
    {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 10;
        $search = isset($_GET['search']) ? trim((string)$_GET['search']) : '';
        $role = isset($_GET['role']) ? trim((string)$_GET['role']) : '';
        $status = isset($_GET['status']) ? trim((string)$_GET['status']) : '';
        $sort = isset($_GET['sort']) ? trim((string)$_GET['sort']) : 'created_at_desc';
        $includeDeleted = isset($_GET['includeDeleted'])
            && in_array(strtolower(trim((string)$_GET['includeDeleted'])), ['1', 'true', 'yes'], true);

        if ($role !== '' && !in_array($role, self::VALID_ROLES, true)) {
            $this->error("Role không hợp lệ. Chỉ chấp nhận: Admin, User.", 422);
        }
        if ($status !== '' && !in_array($status, self::VALID_STATUSES, true)) {
            $this->error("Status không hợp lệ. Chỉ chấp nhận: Active, Locked.", 422);
        }
        if (!in_array($sort, self::VALID_SORTS, true)) {
            $this->error("Sort không hợp lệ.", 422);
        }

        $users = $this->userRepository->listUsers(
            $search !== '' ? $search : null,
            $role !== '' ? $role : null,
            $status !== '' ? $status : null,
            $sort, $page, $limit, $includeDeleted
        );
        $total = $this->userRepository->countListUsers(
            $search !== '' ? $search : null,
            $role !== '' ? $role : null,
            $status !== '' ? $status : null,
            $includeDeleted
        );

        $data = array_map(fn($u) => $u->toArray(), $users);

        $this->json([
            'users' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $limit > 0 ? (int)ceil($total / $limit) : 0,
            ],
            'filters' => [
                'search' => $search,
                'role' => $role,
                'status' => $status,
                'sort' => $sort,
                'includeDeleted' => $includeDeleted,
            ],
        ], 200, "Lấy danh sách người dùng thành công.");
    }

    #[Route('GET', '/api/v1/admin/users/{id}', auth: true, roles: ['Admin'])]
    public function show(array $user, int $id): void
    {
        $found = $this->userRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }

        $this->json($found->toArray(), 200, "Lấy thông tin người dùng thành công.");
    }

    #[Route('POST', '/api/v1/admin/users', auth: true, roles: ['Admin'])]
    public function store(array $user): void
    {
        $data = $this->getJsonBody();
        $userName = trim((string)($data['userName'] ?? $data['username'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');
        $role = trim((string)($data['role'] ?? 'User'));
        $status = trim((string)($data['status'] ?? 'Active'));

        $errors = AuthValidator::validateRegister($userName, $email, $password);
        if (!in_array($role, self::VALID_ROLES, true)) {
            $errors['role'] = "Role không hợp lệ. Chỉ chấp nhận: Admin, User.";
        }
        if (!in_array($status, self::VALID_STATUSES, true)) {
            $errors['status'] = "Status không hợp lệ. Chỉ chấp nhận: Active, Locked.";
        }
        if ($errors !== []) {
            $this->error("Dữ liệu tạo người dùng không hợp lệ.", 422, $errors);
        }

        if ($this->userRepository->existsByEmail($email)) {
            $this->error("Email đã được sử dụng.", 409, ['email' => "Email đã được sử dụng."]);
        }
        if ($this->userRepository->existsByUserName($userName)) {
            $this->error("Tên người dùng đã tồn tại.", 409, ['userName' => "Tên người dùng đã tồn tại."]);
        }

        try {
            $entity = new User(
                $userName,
                $email,
                password_hash($password, PASSWORD_BCRYPT),
                UserRole::from($role),
                UserStatus::from($status),
                createdBy: (int)$user['sub']
            );
            $newId = $this->userRepository->save($entity);
            $saved = $this->userRepository->findById($newId);

            $this->writeLog((int)$user['sub'], LogAction::CREATE, $newId, null, $saved?->toArray());

            $this->json($saved ? $saved->toArray() : ['userId' => $newId], 201, "Tạo người dùng thành công.");
        } catch (Exception $e) {
            if ($e->getCode() === '23505' || str_contains($e->getMessage(), 'duplicate')) {
                $this->error("Tên người dùng hoặc email đã được sử dụng.", 409);
            }
            $this->error($e->getMessage(), 400);
        }
    }

    #[Route('PUT', '/api/v1/admin/users/{id}/role', auth: true, roles: ['Admin'])]
    public function updateRole(array $user, int $id): void
    {
        $data = $this->getJsonBody();
        if (empty($data['role']) || !in_array($data['role'], self::VALID_ROLES, true)) {
            $this->error("Role không hợp lệ. Chỉ chấp nhận: Admin, User.", 422);
        }

        $found = $this->userRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }
        if ($found->isDeleted()) {
            $this->error("Không thể đổi role cho tài khoản đã xóa. Hãy khôi phục trước.", 422);
        }

        // Chặn tự hạ quyền chính mình để tránh khóa luôn cửa admin.
        if ($id === (int)$user['sub'] && $data['role'] === UserRole::USER->value && $found->isAdmin()) {
            $this->error("Không thể tự hạ quyền Admin của chính mình.", 403);
        }

        $old = $found->toArray();
        $found->changeRole(UserRole::from($data['role']), (int)$user['sub']);
        $this->userRepository->update($found);

        $this->writeLog((int)$user['sub'], LogAction::UPDATE, $id, $old, $found->toArray());

        $this->json($found->toArray(), 200, "Cập nhật role thành công.");
    }

    #[Route('POST', '/api/v1/admin/users/{id}/lock', auth: true, roles: ['Admin'])]
    public function lock(array $user, int $id): void
    {
        $found = $this->userRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }
        if ($found->isDeleted()) {
            $this->error("Không thể khóa tài khoản đã xóa.", 422);
        }
        if ($found->getRole()->value === 'Admin') {
            $this->error("Không thể khóa tài khoản Admin.", 403);
        }
        if ($id === (int)$user['sub']) {
            $this->error("Không thể tự khóa chính mình.", 403);
        }

        $old = $found->toArray();
        $found->lock((int)$user['sub']);
        $this->userRepository->update($found);
        $this->revokeSessions($id);

        $this->writeLog((int)$user['sub'], LogAction::CHANGE_STATUS, $id, $old, $found->toArray());

        $this->json($found->toArray(), 200, "Đã khóa tài khoản người dùng.");
    }

    #[Route('POST', '/api/v1/admin/users/{id}/unlock', auth: true, roles: ['Admin'])]
    public function unlock(array $user, int $id): void
    {
        $found = $this->userRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }
        if ($found->isDeleted()) {
            $this->error("Không thể mở khóa tài khoản đã xóa. Hãy khôi phục trước.", 422);
        }

        $old = $found->toArray();
        $found->unlock((int)$user['sub']);
        $this->userRepository->update($found);

        $this->writeLog((int)$user['sub'], LogAction::CHANGE_STATUS, $id, $old, $found->toArray());

        $this->json($found->toArray(), 200, "Đã mở khóa tài khoản người dùng.");
    }

    #[Route('POST', '/api/v1/admin/users/{id}/restore', auth: true, roles: ['Admin'])]
    public function restore(array $user, int $id): void
    {
        $found = $this->userRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }
        if (!$found->isDeleted()) {
            $this->error("Tài khoản chưa bị xóa.", 422);
        }
        // Email/username có thể đã bị người khác tái sử dụng sau khi xóa mềm.
        if ($this->emailTakenByOther($found->getEmail(), $id)
            || $this->userNameTakenByOther($found->getUserName(), $id)) {
            $this->error("Không thể khôi phục vì email hoặc tên người dùng đã được sử dụng.", 409);
        }

        $old = $found->toArray();
        $found->restore((int)$user['sub']);
        $this->userRepository->update($found);

        $this->writeLog((int)$user['sub'], LogAction::UPDATE, $id, $old, $found->toArray());

        $this->json($found->toArray(), 200, "Đã khôi phục tài khoản người dùng.");
    }

    #[Route('DELETE', '/api/v1/admin/users/{id}', auth: true, roles: ['Admin'])]
    public function delete(array $user, int $id): void
    {
        $found = $this->userRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }

        if ($found->getRole()->value === 'Admin') {
            $this->error("Không thể xóa tài khoản Admin.", 403);
        }
        if ($id === (int)$user['sub']) {
            $this->error("Không thể tự xóa chính mình.", 403);
        }

        $permanent = isset($_GET['permanent'])
            && in_array(strtolower(trim((string)$_GET['permanent'])), ['1', 'true', 'yes'], true);

        $old = $found->toArray();
        if ($permanent) {
            $this->revokeSessions($id);
            $this->userRepository->hardDelete($id);
        } else {
            if ($found->isDeleted()) {
                $this->error("Tài khoản đã bị xóa trước đó.", 422);
            }
            $found->softDelete((int)$user['sub']);
            $this->userRepository->update($found);
            $this->revokeSessions($id);
        }

        $this->writeLog((int)$user['sub'], LogAction::DELETE, $id, $old, null);

        $this->json(null, 200, $permanent ? "Đã xóa vĩnh viễn người dùng." : "Đã xóa người dùng thành công.");
    }

    #[Route('POST', '/api/v1/admin/users/bulk-lock', auth: true, roles: ['Admin'])]
    public function bulkLock(array $user): void
    {
        $ids = $this->parseBulkIds();
        $result = ['success' => [], 'failed' => []];
        foreach ($ids as $id) {
            $found = $this->userRepository->findById($id);
            if (!$found || $found->isDeleted()
                || $found->getRole()->value === 'Admin'
                || $id === (int)$user['sub']) {
                $result['failed'][] = ['id' => $id, 'reason' => 'Không thể khóa (không tồn tại / Admin / chính mình / đã xóa).'];
                continue;
            }
            $old = $found->toArray();
            $found->lock((int)$user['sub']);
            $this->userRepository->update($found);
            $this->revokeSessions($id);
            $this->writeLog((int)$user['sub'], LogAction::CHANGE_STATUS, $id, $old, $found->toArray());
            $result['success'][] = $id;
        }
        $this->json($result, 200, "Khóa hàng loạt hoàn tất.");
    }

    #[Route('POST', '/api/v1/admin/users/bulk-unlock', auth: true, roles: ['Admin'])]
    public function bulkUnlock(array $user): void
    {
        $ids = $this->parseBulkIds();
        $result = ['success' => [], 'failed' => []];
        foreach ($ids as $id) {
            $found = $this->userRepository->findById($id);
            if (!$found || $found->isDeleted()) {
                $result['failed'][] = ['id' => $id, 'reason' => 'Không tồn tại hoặc đã xóa.'];
                continue;
            }
            $old = $found->toArray();
            $found->unlock((int)$user['sub']);
            $this->userRepository->update($found);
            $this->writeLog((int)$user['sub'], LogAction::CHANGE_STATUS, $id, $old, $found->toArray());
            $result['success'][] = $id;
        }
        $this->json($result, 200, "Mở khóa hàng loạt hoàn tất.");
    }

    #[Route('POST', '/api/v1/admin/users/bulk-delete', auth: true, roles: ['Admin'])]
    public function bulkDelete(array $user): void
    {
        $ids = $this->parseBulkIds();
        $result = ['success' => [], 'failed' => []];
        foreach ($ids as $id) {
            $found = $this->userRepository->findById($id);
            if (!$found || $found->isDeleted()
                || $found->getRole()->value === 'Admin'
                || $id === (int)$user['sub']) {
                $result['failed'][] = ['id' => $id, 'reason' => 'Không thể xóa (không tồn tại / Admin / chính mình / đã xóa).'];
                continue;
            }
            $old = $found->toArray();
            $found->softDelete((int)$user['sub']);
            $this->userRepository->update($found);
            $this->revokeSessions($id);
            $this->writeLog((int)$user['sub'], LogAction::DELETE, $id, $old, null);
            $result['success'][] = $id;
        }
        $this->json($result, 200, "Xóa hàng loạt hoàn tất.");
    }

    /**
     * @return int[]
     */
    private function parseBulkIds(): array
    {
        $data = $this->getJsonBody();
        $ids = $data['ids'] ?? [];
        if (!is_array($ids) || $ids === []) {
            $this->error("Danh sách ids không hợp lệ.", 422);
        }
        if (count($ids) > 50) {
            $this->error("Chỉ xử lý tối đa 50 tài khoản mỗi lần.", 422);
        }
        $clean = [];
        foreach ($ids as $id) {
            if (is_int($id) && $id > 0) {
                $clean[] = $id;
            } elseif (is_string($id) && ctype_digit($id) && (int)$id > 0) {
                $clean[] = (int)$id;
            }
        }
        if ($clean === []) {
            $this->error("Danh sách ids không hợp lệ.", 422);
        }
        return array_values(array_unique($clean));
    }

    private function revokeSessions(int $userId): void
    {
        if ($this->refreshRepository === null) {
            return;
        }
        try {
            $this->refreshRepository->revokeAllForUser($userId);
        } catch (Throwable) {
            // Không chặn flow chính nếu bảng sessions lỗi.
        }
    }

    private function writeLog(int $actorId, LogAction $action, int $targetId, ?array $old, ?array $new): void
    {
        if ($this->logRepository === null) {
            return;
        }
        try {
            $this->logRepository->save(new SystemLog(
                $actorId, $action, LogTargetType::USERS, $targetId, $old, $new
            ));
        } catch (Throwable) {
            // Bảng system_logs có thể chưa migrate — bỏ qua để không vỡ API chính.
        }
    }

    private function emailTakenByOther(string $email, int $selfId): bool
    {
        $other = $this->userRepository->findByEmail($email);
        return $other !== null && $other->getId() !== $selfId;
    }

    private function userNameTakenByOther(string $userName, int $selfId): bool
    {
        $other = $this->userRepository->findByUserName($userName);
        return $other !== null && $other->getId() !== $selfId;
    }
}
