<?php
declare(strict_types=1);

namespace Tests\Domain;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use src\Domain\Entities\SystemLog;
use src\Domain\Enums\LogAction;
use src\Domain\Enums\LogTargetType;

/**
 * TV4 Module test – SystemLog entity + enums (Job 4.5).
 * Append-only: entity không có setter sửa/xóa, chỉ khởi tạo + đọc.
 */
class SystemLogTest extends TestCase
{
    public function testToArrayExposesRequiredFields(): void
    {
        $log = new SystemLog(1, LogAction::CREATE, LogTargetType::COMMENTS, 5, null, ['content' => 'Hi']);

        $arr = $log->toArray();

        $this->assertSame(1, $arr['userId']);
        $this->assertSame('CREATE', $arr['action']);
        $this->assertSame('Comments', $arr['targetType']);
        $this->assertSame(5, $arr['targetId']);
        $this->assertNull($arr['oldValue']);
        $this->assertSame(['content' => 'Hi'], $arr['newValue']);
        $this->assertArrayHasKey('createdAt', $arr);
    }

    public function testTargetTypeCoercesFromString(): void
    {
        $log = new SystemLog(1, LogAction::CHANGE_STATUS, 'Posts', 9, ['status' => 'Draft'], ['status' => 'Published']);

        $this->assertSame(LogTargetType::POSTS, $log->getTargetType());
    }

    public function testInvalidTargetTypeThrows(): void
    {
        $this->expectException(InvalidArgumentException::class);
        new SystemLog(1, LogAction::CREATE, 'Nope', 1);
    }

    public function testLogActionCasesCoverJobSpec(): void
    {
        $values = array_map(fn(LogAction $a) => $a->value, LogAction::cases());

        $this->assertSame(['CREATE', 'UPDATE', 'DELETE', 'CHANGE_STATUS'], $values);
    }

    public function testLogTargetTypeValuesIncludeTv4Targets(): void
    {
        $values = LogTargetType::values();

        $this->assertContains('Comments', $values);
        $this->assertContains('Posts', $values);
        $this->assertContains('Users', $values);
    }
}
