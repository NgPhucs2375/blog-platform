<?php
declare(strict_types=1);

namespace src\Domain\Validation;

/**
 * Luật validate cho luồng xác thực — CHẠY Ở BACKEND, là chốt chặn cuối.
 * (Frontend cũng validate để UX tốt, nhưng attacker gọi API trực tiếp
 * sẽ bypass hết, nên BE bắt buộc phải check lại.)
 *
 * Quy tắc mật khẩu mirror với FE (fe/frontend register page):
 * >= 8 ký tự + chữ hoa + chữ thường + số + ký tự đặc biệt.
 */
final class AuthValidator
{
    public const USERNAME_MIN = 3;
    public const USERNAME_MAX = 50;
    public const EMAIL_MAX = 255;
    public const PASSWORD_MIN = 8;

    private const USERNAME_PATTERN = '/^[A-Za-z0-9._-]+$/';

    /**
     * Validate form đăng ký.
     * @return array<string,string> lỗi theo từng field, rỗng = hợp lệ.
     */
    public static function validateRegister(string $userName, string $email, string $password): array
    {
        $errors = [];

        $userNameError = self::validateUserName($userName);
        if ($userNameError !== null) {
            $errors['userName'] = $userNameError;
        }

        $emailError = self::validateEmail($email);
        if ($emailError !== null) {
            $errors['email'] = $emailError;
        }

        $passwordError = self::validatePassword($password);
        if ($passwordError !== null) {
            $errors['password'] = $passwordError;
        }

        return $errors;
    }

    public static function validateUserName(string $userName): ?string
    {
        $value = trim($userName);
        $len = strlen($value);

        if ($value === '') {
            return "Vui lòng nhập tên người dùng.";
        }
        if ($len < self::USERNAME_MIN || $len > self::USERNAME_MAX) {
            return "Tên người dùng phải từ 3–50 ký tự.";
        }
        if (!preg_match(self::USERNAME_PATTERN, $value)) {
            return "Tên người dùng chỉ dùng chữ, số và . _ -";
        }
        return null;
    }

    public static function validateEmail(string $email): ?string
    {
        $value = trim($email);

        if ($value === '') {
            return "Vui lòng nhập email.";
        }
        if (strlen($value) > self::EMAIL_MAX) {
            return "Email quá dài (tối đa 255 ký tự).";
        }
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return "Địa chỉ email không hợp lệ.";
        }
        return null;
    }

    /**
     * Trả về null khi đạt, ngược lại là message liệt kê các nhóm còn thiếu
     * (để FE hiển thị y hệt message validate ở client).
     */
    public static function validatePassword(string $password): ?string
    {
        if ($password === '') {
            return "Vui lòng nhập mật khẩu.";
        }

        $missing = [];
        if (strlen($password) < self::PASSWORD_MIN) {
            $missing[] = "Ít nhất 8 ký tự";
        }
        if (!preg_match('/[a-z]/', $password)) {
            $missing[] = "Có chữ thường (a-z)";
        }
        if (!preg_match('/[A-Z]/', $password)) {
            $missing[] = "Có chữ hoa (A-Z)";
        }
        if (!preg_match('/[0-9]/', $password)) {
            $missing[] = "Có chữ số (0-9)";
        }
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            $missing[] = "Có ký tự đặc biệt (!@#...)";
        }

        if ($missing !== []) {
            return "Mật khẩu chưa đạt: " . implode(", ", $missing) . ".";
        }
        return null;
    }
}
