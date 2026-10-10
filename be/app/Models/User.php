<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetPasswordNotification;
use App\Services\EmailVerificationCodeService;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail as MustVerifyEmailContract;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['username', 'email', 'password', 'role', 'status', 'bio', 'avatar_url', 'google_id', 'github_id', 'created_by', 'updated_by', 'deleted_by'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmailContract
{
    use HasFactory, MustVerifyEmailTrait, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'deleted_at' => 'datetime',
        ];
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'author_id');
    }

    public function following(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'user_follows', 'follower_id', 'followed_id')->withTimestamps();
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(self::class, 'user_follows', 'followed_id', 'follower_id')->withTimestamps();
    }

    public function likedPosts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_likes')->withTimestamps();
    }

    public function bookmarkedPosts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'bookmarks')->withTimestamps();
    }

    public function repostedPosts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_reposts')->withTimestamps();
    }

    public function communities(): BelongsToMany
    {
        return $this->belongsToMany(Community::class, 'community_members')->withPivot('role')->withTimestamps();
    }

    public function customFeeds(): HasMany
    {
        return $this->hasMany(CustomFeed::class);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    public function sendEmailVerificationNotification(): void
    {
        app(EmailVerificationCodeService::class)->send($this);
    }

    public function apiArray(): array
    {
        return [
            'id' => $this->id,
            'userName' => $this->username,
            'email' => $this->email,
            'role' => $this->role,
            'status' => $this->status,
            'bio' => $this->bio,
            'avatarUrl' => $this->avatar_url,
            'emailVerifiedAt' => $this->email_verified_at?->toISOString(),
            'followersCount' => $this->followers()->count(),
            'followingCount' => $this->following()->count(),
            'isActive' => $this->status === 'Active',
            'createdAt' => $this->created_at?->toISOString(),
            'createdBy' => $this->created_by,
            'updatedAt' => $this->updated_at?->toISOString(),
            'updatedBy' => $this->updated_by,
            'deletedAt' => $this->deleted_at?->toISOString(),
            'deletedBy' => $this->deleted_by,
            'isDeleted' => $this->trashed(),
        ];
    }
}
