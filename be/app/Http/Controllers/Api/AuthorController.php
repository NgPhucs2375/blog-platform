<?php

namespace App\Http\Controllers\Api;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Http\Request;

class AuthorController extends ApiController
{
    public function show(Request $request, string $username)
    {
        $author = User::where('status', 'Active')->where('username', $username)->firstOrFail();
        $tab = $request->query('tab', 'threads');
        $limit = min(50, max(1, (int) $request->query('limit', 12)));
        $posts = null;
        $comments = null;
        if ($tab === 'replies') {
            $comments = Comment::with(['post.author', 'user'])->where('user_id', $author->id)->where('status', 'Approved')->whereHas('post', fn ($query) => $query->where('status', 'Published'))->latest()->paginate($limit);
            $comments->getCollection()->transform(fn (Comment $comment) => [
                'id' => $comment->id,
                'content' => $comment->content,
                'createdAt' => $comment->created_at?->toISOString(),
                'post' => $comment->post ? ['id' => $comment->post->id, 'slug' => $comment->post->slug, 'title' => $comment->post->title, 'authorName' => $comment->post->author?->username] : null,
            ]);
        } else {
            $query = $tab === 'reposts'
                ? $author->repostedPosts()->where('posts.status', 'Published')
                : $author->posts()->where('status', 'Published');
            if ($tab === 'threads') {
                $query->where(fn ($threads) => $threads->whereNull('thread_id')->orWhere('thread_position', 0));
            }
            if ($tab === 'media') {
                $query->whereNotNull('cover_image')->where('cover_image', '!=', '');
            }
            $posts = $query->with(['author', 'category', 'tags', 'quotedPost.author'])->latest('published_at')->paginate($limit);
            $posts->getCollection()->transform(fn ($post) => $post->apiArray());
        }

        $payload = ['author' => ['id' => $author->id, 'username' => $author->username, 'bio' => $author->bio, 'avatarUrl' => $author->avatar_url, 'followersCount' => $author->followers()->count(), 'followingCount' => $author->following()->count(), 'postsCount' => $author->posts()->where('status', 'Published')->count(), 'viewsCount' => (int) $author->posts()->where('status', 'Published')->sum('view_count'), 'isFollowing' => $request->user() ? $request->user()->following()->whereKey($author->id)->exists() : false], 'tab' => $tab];
        if ($comments) {
            $payload['comments'] = $comments;
        } else {
            $payload['posts'] = $posts;
        }

        return $this->ok($payload);
    }
}
