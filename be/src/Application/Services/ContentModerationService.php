<?php
declare(strict_types=1);

namespace src\Application\Services;

use RuntimeException;
use src\Infrastructure\Repositories\ModerationRuleRepository;

class ContentModerationService
{
    public function __construct(private ModerationRuleRepository $rules) {}

    /** @return array{outcome:string, reason:?string, matchedRules:array<int, array>} */
    public function check(string $title, string $content): array
    {
        try {
            $rules = $this->rules->enabled();
            if ($rules === []) return ['outcome' => 'pass', 'reason' => null, 'matchedRules' => []];

            $text = $title . "\n" . $content;
            $matches = [];
            foreach ($rules as $rule) {
                if ($this->matches($rule, $text)) {
                    $matches[] = $this->rules->normalize($rule);
                }
            }
            if ($matches === []) return ['outcome' => 'pass', 'reason' => null, 'matchedRules' => []];

            return ['outcome' => 'reject', 'reason' => 'Bài viết có chứa ngôn từ không phù hợp và đã bị từ chối xuất bản.', 'matchedRules' => $matches];
        } catch (\Throwable $e) {
            return ['outcome' => 'error', 'reason' => 'Bộ lọc kiểm duyệt gặp lỗi: ' . $e->getMessage(), 'matchedRules' => []];
        }
    }

    public function assertValidRule(string $type, string $pattern): void
    {
        if (!in_array($type, ['keyword', 'regex'], true)) throw new RuntimeException('Loại quy tắc phải là keyword hoặc regex.');
        if (trim($pattern) === '') throw new RuntimeException('Mẫu kiểm duyệt không được để trống.');
        if ($type === 'regex') {
            $result = @preg_match($this->regex($pattern), 'kiem-tra');
            if ($result === false) throw new RuntimeException('Regex không hợp lệ.');
        }
    }

    private function matches(array $rule, string $text): bool
    {
        // PCRE /iu giu so sanh tu khoa khong phan biet hoa-thuong cho Unicode
        // va khong phu thuoc PHP extension mbstring trong image Docker hien tai.
        $pattern = $rule['rule_type'] === 'keyword' ? preg_quote($rule['pattern'], '~') : $rule['pattern'];
        return preg_match($this->regex($pattern), $text) === 1;
    }

    private function regex(string $pattern): string
    {
        return '~' . str_replace('~', '\\~', $pattern) . '~iu';
    }
}
