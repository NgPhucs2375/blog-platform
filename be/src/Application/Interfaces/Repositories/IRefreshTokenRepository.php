<?php
declare(strict_types=1);

namespace src\Application\Interfaces\Repositories;

/**
 * Interface cho RefreshTokenRepository (quản lý phiên đăng nhập).
 */
interface IRefreshTokenRepository
{
    public function findById(int $id): ?object;
    public function findByHash(string $tokenHash): ?object;
    public function save(object $entity): int;
    public function update(object $entity): void;

    /** @return object[] các phiên còn hiệu lực của user, mới nhất trước. */
    public function findUsableByUser(int $userId): array;

    /** Thu hồi toàn bộ phiên của user (đăng xuất mọi thiết bị / chống reuse). */
    public function revokeAllForUser(int $userId): void;

    /** Xóa phiên đã hết hạn để bảng gọn (chạy kèm mỗi lần refresh). */
    public function deleteExpired(): void;

    public function delete(int $id): void;
}
