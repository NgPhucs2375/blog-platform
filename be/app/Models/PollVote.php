<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PollVote extends Model
{
    protected $fillable = ['post_id', 'user_id', 'option_index'];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
