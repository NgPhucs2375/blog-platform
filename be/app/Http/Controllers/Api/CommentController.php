<?php

namespace App\Http\Controllers\Api;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Notifications\BlogActivityNotification;
use Illuminate\Http\Request;

class CommentController extends ApiController
{
    public function index(int $postId)
    {
        Post::where('status', 'Published')->findOrFail($postId);
        $rows = Comment::with('user')->where('post_id', $postId)->where('status', 'Approved')->whereNull('parent_id')->oldest()->get();

        return $this->ok($rows->map(fn ($c) => $this->commentArray($c))->values());
    }

    public function count(int $postId)
    {
        return $this->ok(['count' => Comment::where('post_id', $postId)->where('status', 'Approved')->count()]);
    }

    public function store(Request $request, int $postId)
    {
        $post = Post::where('status', 'Published')->findOrFail($postId);
        if (! $post->canBeRepliedToBy($request->user())) {
            return $this->fail('Tác giả đã giới hạn người có thể trả lời bài viết này.', 403);
        }
        $data = $request->validate([
            'content' => 'required_without:imageUrl|nullable|string|max:10000',
            'imageUrl' => ['required_without:content', 'nullable', 'string', 'max:1000', 'regex:/^(https?:\\/\\/[^\\/]+|\\/)[^\\s]*$/'],
        ]);
        $status = $post->reply_approval ? 'Pending' : 'Approved';
        $comment = Comment::create(['post_id' => $postId, 'user_id' => $request->user()->id, 'content' => $data['content'] ?? '', 'image_url' => $data['imageUrl'] ?? null, 'status' => $status]);
        if ($status === 'Approved') {
            $this->notifyForComment($comment, $post);
        }

        return $this->ok($this->commentArray($comment->load('user')), $status === 'Approved' ? 'Đã đăng bình luận.' : 'Bình luận đang chờ tác giả duyệt.', 201);
    }

    public function reply(Request $request, int $id)
    {
        $parent = Comment::findOrFail($id);
        $post = Post::where('status', 'Published')->findOrFail($parent->post_id);
        abort_unless($parent->status === 'Approved', 404);
        if (! $post->canBeRepliedToBy($request->user())) {
            return $this->fail('Tác giả đã giới hạn người có thể trả lời bài viết này.', 403);
        }
        $data = $request->validate([
            'content' => 'required_without:imageUrl|nullable|string|max:10000',
            'imageUrl' => ['required_without:content', 'nullable', 'string', 'max:1000', 'regex:/^(https?:\\/\\/[^\\/]+|\\/)[^\\s]*$/'],
        ]);
        $status = $post->reply_approval ? 'Pending' : 'Approved';
        $comment = Comment::create(['post_id' => $parent->post_id, 'user_id' => $request->user()->id, 'parent_id' => $id, 'content' => $data['content'] ?? '', 'image_url' => $data['imageUrl'] ?? null, 'status' => $status]);
        if ($status === 'Approved') {
            $this->notifyForComment($comment, $post, $parent->user_id);
        }

        return $this->ok($this->commentArray($comment->load('user')), $status === 'Approved' ? 'Đã đăng phản hồi.' : 'Phản hồi đang chờ tác giả duyệt.', 201);
    }

    public function moderate(int $id, string $status)
    {
        $comment = Comment::findOrFail($id);
        $wasApproved = $comment->status === 'Approved';
        $comment->update(['status' => $status]);
        if ($status === 'Approved' && ! $wasApproved) {
            $post = Post::find($comment->post_id);
            if ($post && $post->status === 'Published') {
                $parentUser = $comment->parent_id ? Comment::find($comment->parent_id)?->user_id : null;
                $recipients = collect([$post->author_id, $parentUser])->filter()->unique()->reject(fn ($id) => $id === $comment->user_id);
                User::whereIn('id', $recipients)->get()->each(function (User $user) use ($post, $parentUser): void {
                    $user->notify(new BlogActivityNotification($post, $user->id === $parentUser ? 'reply' : 'comment'));
                });
            }
        }

        return $this->ok($comment->fresh());
    }

    public function pendingForPost(Request $request, int $postId)
    {
        $post = Post::findOrFail($postId);
        if ($request->user()->role !== 'Admin' && $request->user()->id !== $post->author_id) {
            return $this->fail('Bạn không có quyền duyệt phản hồi cho bài viết này.', 403);
        }
        $comments = Comment::with('user')->where('post_id', $postId)->where('status', 'Pending')->oldest()->get();

        return $this->ok($comments->map(fn (Comment $comment) => $this->commentArray($comment))->values());
    }

    public function reviewForPost(Request $request, int $postId, int $commentId, string $status)
    {
        $post = Post::findOrFail($postId);
        if ($request->user()->role !== 'Admin' && $request->user()->id !== $post->author_id) {
            return $this->fail('Bạn không có quyền duyệt phản hồi cho bài viết này.', 403);
        }
        $comment = Comment::where('post_id', $postId)->where('status', 'Pending')->findOrFail($commentId);
        $comment->update(['status' => $status]);
        if ($status === 'Approved') {
            $parentUserId = $comment->parent_id ? Comment::find($comment->parent_id)?->user_id : null;
            $this->notifyForComment($comment, $post, $parentUserId);
        }

        return $this->ok($this->commentArray($comment->fresh()->load('user')), $status === 'Approved' ? 'Đã duyệt phản hồi.' : 'Đã từ chối phản hồi.');
    }

    public function destroy(Request $request, int $id)
    {
        $comment = Comment::findOrFail($id);
        if ($request->user()->role !== 'Admin' && $comment->user_id !== $request->user()->id) {
            return $this->fail('Không có quyền xóa bình luận này.', 403);
        }
        $comment->delete();

        return $this->ok(null, 'Đã xóa bình luận.');
    }

    public function admin(Request $request)
    {
        $query = Comment::with(['user', 'post'])->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))->latest();

        return $this->ok($query->paginate(min(100, max(1, (int) $request->query('limit', 20)))));
    }

    public function stats()
    {
        return $this->ok(['pending' => Comment::where('status', 'Pending')->count(), 'approved' => Comment::where('status', 'Approved')->count(), 'hidden' => Comment::where('status', 'Hidden')->count(), 'total' => Comment::count()]);
    }

    private function commentArray(Comment $comment): array
    {
        return ['id' => $comment->id, 'postId' => $comment->post_id, 'userId' => $comment->user_id, 'userName' => $comment->user?->username, 'content' => $comment->content, 'imageUrl' => $comment->image_url, 'parentId' => $comment->parent_id, 'status' => strtolower($comment->status), 'createdAt' => $comment->created_at?->toISOString(), 'replies' => $comment->replies()->with('user')->where('status', 'Approved')->oldest()->get()->map(fn ($reply) => $this->commentArray($reply))->values()];
    }

    private function notifyForComment(Comment $comment, Post $post, ?int $parentUserId = null): void
    {
        $recipients = collect([$post->author_id, $parentUserId])->filter()->unique()->reject(fn ($id) => $id === $comment->user_id);
        User::whereIn('id', $recipients)->get()->each(function (User $user) use ($post, $parentUserId): void {
            $user->notify(new BlogActivityNotification($post, $user->id === $parentUserId ? 'reply' : 'comment'));
        });
    }
}
