<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

class Post extends Model
{
    protected $fillable = ['title', 'slug', 'content', 'excerpt', 'cover_image', 'media', 'poll_options', 'poll_ends_at', 'thread_id', 'thread_position', 'reply_permission', 'quote_permission', 'reply_approval', 'community_id', 'status', 'author_id', 'quoted_post_id', 'category_id', 'view_count', 'published_at', 'scheduled_at', 'updated_by', 'meta_title', 'meta_description'];

    protected function casts(): array
    {
        return ['published_at' => 'datetime', 'scheduled_at' => 'datetime', 'poll_ends_at' => 'datetime', 'media' => 'array', 'poll_options' => 'array', 'reply_approval' => 'boolean'];
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

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'post_tags');
    }

    public function likers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'post_likes')->withTimestamps();
    }

    public function bookmarkers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'bookmarks')->withTimestamps();
    }

    public function reposters(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'post_reposts')->withTimestamps();
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(PostRevision::class)->latest('created_at');
    }

    public function quotedPost(): BelongsTo
    {
        return $this->belongsTo(self::class, 'quoted_post_id');
    }

    public function quotePosts(): HasMany
    {
        return $this->hasMany(self::class, 'quoted_post_id');
    }

    public function pollVotes(): HasMany
    {
        return $this->hasMany(PollVote::class);
    }

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function canBeRepliedToBy(User $user): bool
    {
        return match ($this->reply_permission ?? 'everyone') {
            'followers' => $user->id === $this->author_id || $this->author?->followers()->whereKey($user->id)->exists(),
            'none' => false,
            default => true,
        };
    }

    public function canBeQuotedBy(User $user): bool
    {
        return match ($this->quote_permission ?? 'everyone') {
            'followers' => $user->id === $this->author_id || $this->author?->followers()->whereKey($user->id)->exists(),
            'none' => false,
            default => true,
        };
    }

    public function apiArray(): array
    {
        $media = $this->media ?? ($this->cover_image ? [['url' => $this->cover_image, 'type' => 'image']] : []);
        $communityMember = $this->community?->members()->where('users.id', $this->author_id)->first();
        $options = $this->poll_options ?? [];
        $voteCounts = $this->pollVotes()->selectRaw('option_index, count(*) as total')->groupBy('option_index')->pluck('total', 'option_index');
        $threadItems = $this->thread_id ? self::with('author')->where('thread_id', $this->thread_id)->where('status', 'Published')->orderBy('thread_position')->get()->map(fn (Post $item) => [
            'id' => $item->id,
            'slug' => $item->slug,
            'content' => $item->content,
            'media' => $item->media ?? [],
            'position' => $item->thread_position,
            'authorName' => $item->author?->username,
        ])->values()->all() : [];

        return ['id' => $this->id, 'title' => $this->title, 'slug' => $this->slug,
            'content' => $this->content, 'excerpt' => $this->excerpt,
            'metaTitle' => $this->meta_title, 'metaDescription' => $this->meta_description,
            'scheduledAt' => $this->scheduled_at?->toISOString(),
            'tags' => $this->tags->map->apiArray()->values(),
            'likesCount' => $this->likers()->count(), 'commentsCount' => $this->comments()->where('status', 'Approved')->count(), 'repostsCount' => $this->reposters()->count() + $this->quotePosts()->where('status', 'Published')->count(), 'sharesCount' => (int) ($this->share_count ?? 0),
            'coverImage' => $this->cover_image, 'cover_image' => $this->cover_image, 'media' => $media,
            'poll' => $options ? ['options' => array_values($options), 'voteCounts' => collect($options)->keys()->map(fn ($index) => (int) ($voteCounts[$index] ?? 0))->values(), 'totalVotes' => (int) $voteCounts->sum(), 'endsAt' => $this->poll_ends_at?->toISOString(), 'hasEnded' => $this->poll_ends_at?->isPast() ?? false, 'myVote' => Auth::id() ? $this->pollVotes()->where('user_id', Auth::id())->value('option_index') : null] : null,
            'threadId' => $this->thread_id, 'threadPosition' => (int) $this->thread_position, 'threadItems' => $threadItems,
            'replyPermission' => $this->reply_permission ?? 'everyone', 'quotePermission' => $this->quote_permission ?? 'everyone', 'replyApproval' => (bool) $this->reply_approval,
            'community' => $this->community ? ['id' => $this->community->id, 'name' => $this->community->name, 'slug' => $this->community->slug, 'authorFlair' => $communityMember?->pivot?->flair, 'authorIsChampion' => (bool) ($communityMember?->pivot?->is_champion ?? false)] : null,
            'status' => strtolower($this->status), 'categoryId' => $this->category_id,
            'category_id' => $this->category_id, 'category' => $this->category?->apiArray(),
            'viewCount' => $this->view_count, 'view_count' => $this->view_count,
            'authorId' => $this->author_id, 'author_id' => $this->author_id,
            'authorName' => $this->author?->username, 'author_name' => $this->author?->username,
            'followersCount' => $this->author?->followers()->count() ?? 0,
            'author' => $this->author ? ['id' => $this->author->id, 'userName' => $this->author->username, 'username' => $this->author->username, 'avatarUrl' => $this->author->avatar_url, 'followersCount' => $this->author->followers()->count()] : null,
            'createdAt' => $this->created_at?->toISOString(), 'created_at' => $this->created_at?->toISOString(),
            'publishedAt' => $this->published_at?->toISOString(), 'updatedAt' => $this->updated_at?->toISOString(),
            'quotedPost' => $this->quoted_post_id && $this->quotedPost ? [
                'id' => $this->quotedPost->id,
                'slug' => $this->quotedPost->slug,
                'title' => $this->quotedPost->title,
                'content' => $this->quotedPost->content,
                'coverImage' => $this->quotedPost->cover_image,
                'authorName' => $this->quotedPost->author?->username,
                'author' => $this->quotedPost->author ? ['id' => $this->quotedPost->author->id, 'userName' => $this->quotedPost->author->username, 'avatarUrl' => $this->quotedPost->author->avatar_url] : null,
            ] : null];
    }
}
