<?php

namespace App\WebApi\Controllers\V1;

use App\WebApi\Controllers\BaseController;
use App\Infrastructure\Repositories\UserRepository;
use App\Infrastructure\Services\JwtTokenService;
use App\Domain\Entities\User;
use App\Domain\Enums\UserRole;
use App\Domain\Enums\UserStatus;
use Exception;

class AuthController extends BaseController
{
    private UserRepository $userRepository;
    private JwtTokenService $jwtService;

    public function __construct(UserRepository $userRepository, JwtTokenService $jwtService)
    {
        $this->userRepository = $userRepository;
        $this->jwtService = $jwtService;
    }

    public function register()
    {
        $data = $this->getJsonBody();

        if (empty($data['userName']) || empty($data['email']) || empty($data['password'])) {
            $this->error("Vui lòng cung cấp đầy đủ: userName, email, password.", 422);
        }

        if ($this->userRepository->findByEmail($data['email'])) {
            $this->error("Email đã được sử dụng.", 409);
        }

        if ($this->userRepository->findByUserName($data['userName'])) {
            $this->error("Tên người dùng đã tồn tại.", 409);
        }

        try {
            $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
            $user = new User(
                $data['userName'],
                $data['email'],
                $passwordHash,
                UserRole::USER,
                UserStatus::ACTIVE
            );

            $newId = $this->userRepository->save($user);
            $this->json(['userId' => $newId], 201, "Đăng ký tài khoản thành công.");
        } catch (Exception $e) {
            $this->error($e->getMessage(), 400);
        }
    }

    public function login()
    {
        $data = $this->getJsonBody();

        if (empty($data['email']) || empty($data['password'])) {
            $this->error("Vui lòng nhập Email và Mật khẩu.", 422);
        }

        $user = $this->userRepository->findByEmail($data['email']);
        if (!$user || !password_verify($data['password'], $user->getPasswordHash())) {
            $this->error("Tài khoản hoặc mật khẩu không chính xác.", 401);
        }

        if (!$user->isActive()) {
            $this->error("Tài khoản của bạn đã bị khóa.", 403);
        }

        $token = $this->jwtService->generateToken($user->getId(), $user->getRole()->value);

        $this->json([
            'token' => $token,
            'user' => $user->toArray()
        ], 200, "Đăng nhập thành công.");
    }
}