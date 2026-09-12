<?php
declare(strict_types=1);

namespace Tests\Application;

use PHPUnit\Framework\TestCase;
use src\Application\Services\ContentModerationService;
use src\Infrastructure\Repositories\ModerationRuleRepository;

class ContentModerationServiceTest extends TestCase
{
    private function service(array $rules): ContentModerationService
    {
        $repo = $this->createMock(ModerationRuleRepository::class);
        $repo->method('enabled')->willReturn($rules);
        $repo->method('normalize')->willReturnCallback(fn(array $rule) => [
            'id' => $rule['id'], 'name' => $rule['name'], 'pattern' => $rule['pattern'],
            'ruleType' => $rule['rule_type'], 'reason' => $rule['reason'], 'isEnabled' => true,
        ]);
        return new ContentModerationService($repo);
    }

    public function testPassesWhenThereAreNoEnabledRules(): void
    {
        $result = $this->service([])->check('Bài hợp lệ', 'Nội dung bình thường');
        $this->assertSame('pass', $result['outcome']);
    }

    public function testRejectsKeywordInTitleOrContent(): void
    {
        $rule = ['id' => 1, 'name' => 'Chặn quảng cáo', 'pattern' => 'quảng cáo', 'rule_type' => 'keyword', 'reason' => 'Không đăng nội dung quảng cáo'];
        $result = $this->service([$rule])->check('Bài viết', 'Đây là QUẢNG CÁO không được phép');
        $this->assertSame('reject', $result['outcome']);
        $this->assertSame('Không đăng nội dung quảng cáo', $result['reason']);
    }

    public function testRejectsRegexCaseInsensitively(): void
    {
        $rule = ['id' => 2, 'name' => 'Chặn spam', 'pattern' => 'spam\\s+link', 'rule_type' => 'regex', 'reason' => 'Nội dung có dấu hiệu spam'];
        $result = $this->service([$rule])->check('SPAM LINK ngay', '');
        $this->assertSame('reject', $result['outcome']);
    }

    public function testRejectsInvalidRegexBeforeItCanBeSaved(): void
    {
        $this->expectExceptionMessage('Regex không hợp lệ');
        $this->service([])->assertValidRule('regex', '[khong-dong');
    }
}
