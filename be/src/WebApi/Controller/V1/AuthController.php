<?php
declare(strict_types=1);

namespace src\WebApi\Controller\V1;

use src\WebApi\Controller\BaseController;
use src\Infrastructure\Repositories\UserRepository;
use src\Infrastructure\Repositories\RefreshTokenRepository;
use src\Infrastructure\Services\JwtTokenService;
use src\Domain\Entities\RefreshToken;
use src\Domain\Entities\User;
use src\Domain\Enums\UserRole;
use src\Domain\Enums\UserStatus;
use src\Domain\Validation\AuthValidator;
use DateTimeImmutable;
use Exception;
use src\WebApi\Routing\Route;

class AuthController extends BaseController
{
    public function __construct(
        private UserRepository $userRepository,
        private JwtTokenService $jwtService,
        private RefreshTokenRepository $refreshRepository
    ) {}

    #[Route('POST', '/api/v1/auth/register')]
    public function register(): void
    {
        $data = $this->getJsonBody();
        $userName = trim((string)($data['userName'] ?? ''));
        $email = trim((string)($data['email'] ?? ''));
        $password = (string)($data['password'] ?? '');

        // Validate BE là chốt chặn cuối (FE cũng validate nhưng bypass được).
        $errors = AuthValidator::validateRegister($userName, $email, $password);
        if ($errors !== []) {
            $this->error("Dữ liệu đăng ký không hợp lệ.", 422, $errors);
        }

        if ($this->userRepository->findByEmail($email)) {
            $this->error("Email đã được sử dụng.", 409, ['email' => "Email đã được sử dụng."]);
        }

        if ($this->userRepository->findByUserName($userName)) {
            $this->error("Tên người dùng đã tồn tại.", 409, ['userName' => "Tên người dùng đã tồn tại."]);
        }

        try {
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $user = new User(
                $userName,
                $email,
                $passwordHash,
                UserRole::USER,
                UserStatus::ACTIVE
            );

            $newId = $this->userRepository->save($user);
            $this->json(['userId' => $newId], 201, "Đăng ký tài khoản thành công.");
        } catch (Exception $e) {
            // Race condition lọt qua check trùng ở trên -> UNIQUE DB chặn lại.
            if ($e->getCode() === '23505' || str_contains($e->getMessage(), 'duplicate')) {
                $this->error("Tên người dùng hoặc email đã được sử dụng.", 409);
            }
            $this->error($e->getMessage(), 400);
        }
    }

    #[Route('POST', '/api/v1/auth/login')]
    public function login(): void
    {
        $data = $this->getJsonBody();

        if (empty($data['email']) || empty($data['password'])) {
            $this->error("Vui lòng nhập Email và Mật khẩu.", 422);
        }

        $user = $this->userRepository->findByEmail(trim((string)$data['email']));
        if (!$user || !password_verify((string)$data['password'], $user->getPasswordHash())) {
            $this->error("Tài khoản hoặc mật khẩu không chính xác.", 401);
        }

        if (!$user->isActive()) {
            $this->error("Tài khoản của bạn đã bị khóa.", 403);
        }

        $this->json($this->issueTokenPair($user), 200, "Đăng nhập thành công.");
    }

    /**
     * Đổi refresh token lấy cặp token mới (xoay vòng).
     * FE gọi ngầm khi access token hết hạn — user không phải đăng nhập lại.
     */
    #[Route('POST', '/api/v1/auth/refresh')]
    public function refresh(): void
    {
        $data = $this->getJsonBody();
        $presented = (string)($data['refresh_token'] ?? '');
        if ($presented === '') {
            $this->error("Thiếu refresh token.", 422);
        }

        $row = $this->refreshRepository->findByHash(JwtTokenService::hashRefreshToken($presented));

        if ($row === null) {
            $this->error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
        }

        // Token đã rotate mà bị gửi lại => nghi bị đánh cắp => chém cả chùm.
        if ($row->isReuseOfRotated()) {
            $this->refreshRepository->revokeAllForUser($row->getUserId());
            $this->error("Phiên đăng nhập bị thu hồi vì lý do bảo mật. Vui lòng đăng nhập lại.", 401);
        }

        if (!$row->isUsable()) {
            $this->error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
        }

        $user = $this->userRepository->findById($row->getUserId());
        if ($user === null) {
            $this->error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", 401);
        }
        if (!$user->isActive()) {
            $this->error("Tài khoản của bạn đã bị khóa.", 403);
        }

        // Xoay vòng: thu hồi token cũ (ghi vết replaced_by), cấp cặp mới.
        $pair = $this->issueTokenPair($user);
        $newRow = $this->refreshRepository->findByHash(
            JwtTokenService::hashRefreshToken($pair['refresh_token'])
        );
        $row->revoke($newRow?->getId());
        $this->refreshRepository->update($row);
        $this->refreshRepository->deleteExpired();

        $this->json($pair, 200, "Gia hạn phiên đăng nhập thành công.");
    }

    /**
     * Đăng xuất: thu hồi refresh token (public để chạy được cả khi
     * access token đã hết hạn). Luôn trả 200 để không lộ thông tin phiên.
     */
    #[Route('POST', '/api/v1/auth/logout')]
    public function logout(): void
    {
        $data = $this->getJsonBody();
        $presented = (string)($data['refresh_token'] ?? '');

        if ($presented !== '') {
            $row = $this->refreshRepository->findByHash(JwtTokenService::hashRefreshToken($presented));
            if ($row !== null) {
                $this->refreshRepository->delete($row->getId());
            }
        }

        $this->json(null, 200, "Đăng xuất thành công.");
    }

    /** Danh sách phiên đang hoạt động của chính user (trang "thiết bị đã đăng nhập"). */
    #[Route('GET', '/api/v1/auth/sessions', auth: true)]
    public function sessions(array $user): void
    {
        $rows = $this->refreshRepository->findUsableByUser((int)$user['sub']);
        $this->json(
            array_map(fn(RefreshToken $r) => $r->toArray(), $rows),
            200,
            "Lấy danh sách phiên đăng nhập thành công."
        );
    }

    /** Thu hồi 1 phiên cụ thể (đăng xuất khỏi 1 thiết bị). */
    #[Route('DELETE', '/api/v1/auth/sessions/{id}', auth: true)]
    public function revokeSession(array $user, int $id): void
    {
        $row = $this->refreshRepository->findById($id);
        if ($row === null || $row->getUserId() !== (int)$user['sub']) {
            $this->error("Không tìm thấy phiên đăng nhập.", 404);
        }

        $this->refreshRepository->delete($row->getId());
        $this->json(null, 200, "Đã thu hồi phiên đăng nhập.");
    }

    /**
     * Cấp 1 cặp token + lưu phiên refresh xuống DB.
     * @return array{access_token:string, refresh_token:string, token_type:string, expires_in:int, user:array}
     */
    private function issueTokenPair(User $user): array
    {
        $accessToken = $this->jwtService->generateAccessToken(
            $user->getId(),
            $user->getRole()->value
        );
        $refresh = $this->jwtService->generateRefreshToken();

        $session = new RefreshToken(
            $user->getId(),
            $refresh['hash'],
            (new DateTimeImmutable())->setTimestamp($refresh['expiresAt']),
            null,
            null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null
        );
        $this->refreshRepository->save($session);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refresh['token'],
            'token_type' => 'Bearer',
            'expires_in' => $this->jwtService->getAccessTtl(),
            'user' => $user->toArray(),
        ];
    }
}
