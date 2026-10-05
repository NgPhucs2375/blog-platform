<?php
declare(strict_types=1);

namespace src\Domain\Enums;

/**
 * Enum định danh loại đối tượng bị tác động trong SystemLog.
 * Thay thế mảng string set cứng trước đây để an toàn kiểu
 * và tái sử dụng, tương tự cách dùng LogAction.
 */
enum LogTargetType: string
{
    case USERS = 'Users';
    case CATEGORIES = 'Categories';
    case POSTS = 'Posts';
    case COMMENTS = 'Comments';
    case TAGS = 'Tags';
    case POST_TAGS = 'PostTags';
    case FOLLOWS = 'Follows';
    case LIKES = 'Likes';
    case NOTIFICATIONS = 'Notifications';

    /**
     * Chuẩn hóa đầu vào string|enum thành enum.
     * Giữ tương thích ngược với dữ liệu string cũ trong DB/controllers.
     *
     * @throws \InvalidArgumentException khi giá trị không hợp lệ.
     */
    public static function coerce(self|string $value): self
    {
        if ($value instanceof self) {
            return $value;
        }

        $normalized = self::tryFrom($value);
        if ($normalized === null) {
            throw new \InvalidArgumentException(
                "Đối tượng tác động (TargetType) không hợp lệ: " . $value
            );
        }

        return $normalized;
    }

    /**
     * @return string[] danh sách value hợp lệ (để validate / docs).
     */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }
}
