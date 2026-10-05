<?php
declare(strict_types=1);

namespace Tests\Domain;

use PHPUnit\Framework\TestCase;
use src\Domain\Validation\AuthValidator;

/**
 * Unit test thuần cho luật validate auth (không cần DB).
 */
class AuthValidatorTest extends TestCase
{
    public function testValidRegisterPasses(): void
    {
        $errors = AuthValidator::validateRegister("NguyenVanA", "a@example.com", "Abcdef1!");

        $this->assertSame([], $errors);
    }

    public function testWeakPasswordListsMissingGroups(): void
    {
        $message = AuthValidator::validatePassword("abcdef");

        $this->assertNotNull($message);
        $this->assertStringContainsString("Ít nhất 8 ký tự", $message);
        $this->assertStringContainsString("chữ hoa", $message);
        $this->assertStringContainsString("chữ số", $message);
        $this->assertStringContainsString("ký tự đặc biệt", $message);
    }

    public function testStrongPasswordPasses(): void
    {
        $this->assertNull(AuthValidator::validatePassword("Abcdef1!"));
    }

    public function testInvalidUserNameAndEmail(): void
    {
        $errors = AuthValidator::validateRegister("ab", "khong-phai-email", "Abcdef1!");

        $this->assertArrayHasKey("userName", $errors);
        $this->assertArrayHasKey("email", $errors);
        $this->assertArrayNotHasKey("password", $errors);
    }
}
