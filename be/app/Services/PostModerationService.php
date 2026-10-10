<?php

namespace App\Services;

use App\Models\ModerationRule;

class PostModerationService
{
    /** @return list<ModerationRule> */
    public function matchingRules(string $title, string $content): array
    {
        $text = $title.' '.$content;

        return ModerationRule::where('is_enabled', true)->get()->filter(function (ModerationRule $rule) use ($text): bool {
            if ($rule->rule_type === 'regex') {
                return @preg_match($rule->pattern, $text) === 1;
            }

            return $rule->pattern !== '' && mb_stripos($text, $rule->pattern) !== false;
        })->values()->all();
    }

    public function statusFor(string $requestedStatus, bool $isAdmin, string $title, string $content): string
    {
        if (! in_array($requestedStatus, ['Published', 'Scheduled'], true)) {
            return $requestedStatus;
        }

        if (! $isAdmin && $this->matchingRules($title, $content)) {
            return 'Pending';
        }

        return $requestedStatus;
    }
}
