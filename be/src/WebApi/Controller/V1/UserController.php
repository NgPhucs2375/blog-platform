<?php
declare(strict_types=1);

namespace src\WebApi\Controller\V1;

use src\WebApi\Controller\BaseController;
use src\Infrastructure\Repositories\UserRepository;
use src\WebApi\Routing\Route;

class UserController extends BaseController
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    #[Route('GET', '/api/v1/admin/users', auth: true, roles: ['Admin'])]
    public function index(array $user): void
    {

        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, (int)$_GET['limit'])) : 10;
        $search = isset($_GET['search']) ? trim((string)$_GET['search']) : '';
        $role = isset($_GET['role']) ? trim((string)$_GET['role']) : '';

        if ($search !== '') {
            $users = $this->userRepository->searchUsers($search, $page, $limit);
            $total = $this->userRepository->countSearchUsers($search);
        } elseif ($role !== '' && in_array($role, ['Admin', 'User'])) {
            $users = $this->userRepository->findByRole($role, $page, $limit);
            $total = $this->userRepository->countByRole($role);
        } else {
            $users = $this->userRepository->getAllUsers($page, $limit);
            $total = $this->userRepository->countUsers();
        }

        $data = array_map(fn($u) => $u->toArray(), $users);

        $this->json([
            'users' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int)ceil($total / $limit),
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

    #[Route('PUT', '/api/v1/admin/users/{id}/role', auth: true, roles: ['Admin'])]
    public function updateRole(array $user, int $id): void
    {
        $data = $this->getJsonBody();
        if (empty($data['role']) || !in_array($data['role'], ['Admin', 'User'])) {
            $this->error("Role không hợp lệ. Chỉ chấp nhận: Admin, User.", 422);
        }

        $found = $this->userRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }

        $found->updateProfile($found->getUserName(), $found->getEmail());
        if ($data['role'] === 'Admin') {
            $found->unlock();
        }
        $this->userRepository->update($found);

        $this->json($found->toArray(), 200, "Cập nhật role thành công.");
    }

    #[Route('POST', '/api/v1/admin/users/{id}/lock', auth: true, roles: ['Admin'])]
    public function lock(array $user, int $id): void
    {
        $found = $this->userRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }

        if ($found->getRole()->value === 'Admin') {
            $this->error("Không thể khóa tài khoản Admin.", 403);
        }

        $found->lock();
        $this->userRepository->update($found);

        $this->json($found->toArray(), 200, "Đã khóa tài khoản người dùng.");
    }

    #[Route('POST', '/api/v1/admin/users/{id}/unlock', auth: true, roles: ['Admin'])]
    public function unlock(array $user, int $id): void
    {
        $found = $this->userRepository->findById($id);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }

        $found->unlock();
        $this->userRepository->update($found);

        $this->json($found->toArray(), 200, "Đã mở khóa tài khoản người dùng.");
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

        $this->userRepository->delete($id);

        $this->json(null, 200, "Đã xóa người dùng thành công.");
    }
}
