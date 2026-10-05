<?php
declare(strict_types=1);

namespace Tests\Domain;

use PHPUnit\Framework\TestCase;
use src\Domain\Entities\User;
use src\Domain\Enums\UserRole;
use src\Domain\Enums\UserStatus;

/**
 * Regression test cho User Manager:
 * - changeRole() phải đổi role thật (bug cũ: updateRole không đổi role).
 * - lock/unlock + audit updatedBy.
 * - softDelete/restore/isDeleted.
 */
class UserTest extends TestCase
{
    private function makeUser(): User
    {
        return new User('nguyenvana', 'a@example.com', 'hash', UserRole::USER, UserStatus::ACTIVE);
    }

    public function testChangeRoleUpdatesRole(): void
    {
        $user = $this->makeUser();
        $user->changeRole(UserRole::ADMIN, 1);

        $this->assertSame(UserRole::ADMIN, $user->getRole());
        $this->assertTrue($user->isAdmin());
        $this->assertSame(1, $user->getUpdatedBy());
        $this->assertNotNull($user->getUpdatedAt());
    }

    public function testChangeRoleBackToUser(): void
    {
        $user = new User('u', 'u@example.com', 'h', UserRole::ADMIN, UserStatus::ACTIVE);
        $user->changeRole(UserRole::USER, 2);

        $this->assertSame(UserRole::USER, $user->getRole());
        $this->assertFalse($user->isAdmin());
    }

    public function testLockUnlockTracksUpdatedBy(): void
    {
        $user = $this->makeUser();
        $user->lock(7);
        $this->assertSame(UserStatus::LOCKED, $user->getStatus());
        $this->assertSame(7, $user->getUpdatedBy());
        $this->assertFalse($user->isActive());

        $user->unlock(8);
        $this->assertTrue($user->isActive());
        $this->assertSame(8, $user->getUpdatedBy());
    }

    public function testSoftDeleteAndRestore(): void
    {
        $user = $this->makeUser();
        $this->assertFalse($user->isDeleted());

        $user->softDelete(9);
        $this->assertTrue($user->isDeleted());
        $this->assertNotNull($user->getDeletedAt());
        $this->assertSame(9, $user->getDeletedBy());

        $user->restore(10);
        $this->assertFalse($user->isDeleted());
        $this->assertNull($user->getDeletedAt());
        $this->assertNull($user->getDeletedBy());
        $this->assertSame(10, $user->getUpdatedBy());
    }

    public function testToArrayExposesAuditAndSoftDelete(): void
    {
        $user = $this->makeUser();
        $arr = $user->toArray();

        $this->assertArrayHasKey('role', $arr);
        $this->assertArrayHasKey('status', $arr);
        $this->assertArrayHasKey('updatedBy', $arr);
        $this->assertArrayHasKey('isDeleted', $arr);
        $this->assertFalse($arr['isDeleted']);
        $this->assertArrayNotHasKey('passwordHash', $arr);
        $this->assertArrayNotHasKey('password_hash', $arr);
    }
}
