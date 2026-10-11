<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReaderControl extends Model
{
    protected $fillable = ['user_id', 'type', 'target_user_id', 'post_id', 'category_id'];

    public function targetUser(): BelongsTo { return $this->belongsTo(User::class, 'target_user_id'); }
    public function post(): BelongsTo { return $this->belongsTo(Post::class); }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
}
