<?php

namespace App\Http\Controllers\Api;

use App\Models\ModerationRule;
use Illuminate\Http\Request;

class ModerationRuleController extends ApiController
{
    private function data($rules)
    {
        return collect($rules)->map(fn ($rule) => $rule instanceof ModerationRule ? $rule->apiArray() : $rule)->values();
    }

    public function index()
    {
        return $this->ok($this->data(ModerationRule::orderBy('id')->get()));
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255', 'pattern' => 'required|string|max:2000', 'ruleType' => 'required|in:keyword,regex', 'reason' => 'nullable|string|max:2000', 'isEnabled' => 'sometimes|boolean']);
        $rule = ModerationRule::create(['name' => $data['name'], 'pattern' => $data['pattern'], 'rule_type' => $data['ruleType'], 'reason' => $data['reason'] ?? '', 'is_enabled' => $data['isEnabled'] ?? true]);

        return $this->ok($rule->apiArray(), 'Tạo quy tắc thành công.', 201);
    }

    public function update(Request $request, int $id)
    {
        $rule = ModerationRule::findOrFail($id);
        $data = $request->validate(['name' => 'required|string|max:255', 'pattern' => 'required|string|max:2000', 'ruleType' => 'required|in:keyword,regex', 'reason' => 'nullable|string|max:2000', 'isEnabled' => 'sometimes|boolean']);
        $rule->update(['name' => $data['name'], 'pattern' => $data['pattern'], 'rule_type' => $data['ruleType'], 'reason' => $data['reason'] ?? '', 'is_enabled' => $data['isEnabled'] ?? $rule->is_enabled]);

        return $this->ok($rule->fresh()->apiArray());
    }

    public function toggle(int $id)
    {
        $rule = ModerationRule::findOrFail($id);
        $rule->update(['is_enabled' => ! $rule->is_enabled]);

        return $this->ok($rule->fresh()->apiArray());
    }

    public function destroy(int $id)
    {
        ModerationRule::findOrFail($id)->delete();

        return $this->ok(null, 'Đã xóa quy tắc.');
    }

    public function test(Request $request)
    {
        $data = $request->validate(['title' => 'required|string', 'content' => 'required|string']);
        $text = $data['title'].' '.$data['content'];
        $matches = [];
        foreach (ModerationRule::where('is_enabled', true)->get() as $rule) {
            $matched = $rule->rule_type === 'regex' ? @preg_match($rule->pattern, $text) === 1 : mb_stripos($text, $rule->pattern) !== false;
            if ($matched) {
                $matches[] = $rule->apiArray();
            }
        }

        return $this->ok(['outcome' => $matches ? 'reject' : 'pass', 'reason' => $matches[0]['reason'] ?? null, 'matchedRules' => $matches]);
    }
}
