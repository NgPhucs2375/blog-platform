<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomFeed extends Model
{
    protected $fillable = ['user_id', 'name', 'filters', 'is_public'];

    protected function casts(): array
    {
        return ['filters' => 'array', 'is_public' => 'boolean'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
