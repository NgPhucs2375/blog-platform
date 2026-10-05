<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    protected $fillable = ['title', 'slug', 'content', 'excerpt', 'cover_image', 'status', 'author_id', 'category_id', 'view_count', 'published_at', 'updated_by'];

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function apiArray(): array
    {
        return ['id' => $this->id, 'title' => $this->title, 'slug' => $this->slug,
            'content' => $this->content, 'excerpt' => $this->excerpt,
            'coverImage' => $this->cover_image, 'cover_image' => $this->cover_image,
            'status' => strtolower($this->status), 'categoryId' => $this->category_id,
            'category_id' => $this->category_id, 'category' => $this->category?->apiArray(),
            'viewCount' => $this->view_count, 'view_count' => $this->view_count,
            'authorId' => $this->author_id, 'author_id' => $this->author_id,
            'authorName' => $this->author?->username, 'author_name' => $this->author?->username,
            'author' => $this->author ? ['id' => $this->author->id, 'userName' => $this->author->username, 'username' => $this->author->username] : null,
            'createdAt' => $this->created_at?->toISOString(), 'created_at' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString()];
    }
}
