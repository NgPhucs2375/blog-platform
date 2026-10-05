<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModerationRule extends Model
{
    protected $fillable = ['name', 'pattern', 'rule_type', 'reason', 'is_enabled'];

    protected function casts(): array
    {
        return ['is_enabled' => 'boolean'];
    }

    public function apiArray(): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'pattern' => $this->pattern, 'ruleType' => $this->rule_type, 'reason' => $this->reason, 'isEnabled' => $this->is_enabled, 'createdAt' => $this->created_at?->toISOString(), 'updatedAt' => $this->updated_at?->toISOString()];
    }
}
