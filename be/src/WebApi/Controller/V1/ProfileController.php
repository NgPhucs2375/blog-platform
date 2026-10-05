<?php
declare(strict_types=1);

namespace src\WebApi\Controller\V1;

use src\WebApi\Controller\BaseController;
use src\Infrastructure\Repositories\UserRepository;
use src\Domain\Validation\AuthValidator;
use src\WebApi\Routing\Route;
use Exception;

class ProfileController extends BaseController
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    #[Route('GET', '/api/v1/profile', auth: true)]
    public function show(array $user): void
    {
        $userId = (int)$user['sub'];

        $found = $this->userRepository->findById($userId);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }

        $this->json($found->toArray(), 200, "Lấy thông tin cá nhân thành công.");
    }

    #[Route('PUT', '/api/v1/profile', auth: true)]
    public function update(array $user): void
    {
        $userId = (int)$user['sub'];

        $found = $this->userRepository->findById($userId);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }

        $data = $this->getJsonBody();
        $userName = $data['userName'] ?? $found->getUserName();
        $email = $data['email'] ?? $found->getEmail();

        try {
            $found->updateProfile($userName, $email);
            $this->userRepository->update($found);
            $this->json($found->toArray(), 200, "Cập nhật thông tin cá nhân thành công.");
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    #[Route('PUT', '/api/v1/profile/password', auth: true)]
    public function changePassword(array $user): void
    {
        $userId = (int)$user['sub'];

        $found = $this->userRepository->findById($userId);
        if (!$found) {
            $this->error("Không tìm thấy người dùng.", 404);
        }

        $data = $this->getJsonBody();

        if (empty($data['currentPassword']) || empty($data['newPassword'])) {
            $this->error("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.", 422);
        }

        if (!password_verify($data['currentPassword'], $found->getPasswordHash())) {
            $this->error("Mật khẩu hiện tại không chính xác.", 401);
        }

        // Validate BE (cùng luật với đăng ký — FE cũng check nhưng bypass được).
        $passwordError = AuthValidator::validatePassword((string)$data['newPassword']);
        if ($passwordError !== null) {
            $this->error("Mật khẩu mới không hợp lệ.", 422, ['newPassword' => $passwordError]);
        }

        $newHash = password_hash($data['newPassword'], PASSWORD_BCRYPT);
        $found->changePassword($newHash);
        $this->userRepository->update($found);

        $this->json(null, 200, "Đổi mật khẩu thành công.");
    }
}
