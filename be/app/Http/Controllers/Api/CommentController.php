<?php

namespace App\Http\Controllers\Api;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;

class CommentController extends ApiController
{
    public function index(int $postId)
    {
        $rows = Comment::with('user')->where('post_id', $postId)->where('status', 'Approved')->whereNull('parent_id')->oldest()->get();

        return $this->ok($rows->map(fn ($c) => $this->commentArray($c))->values());
    }

    public function count(int $postId)
    {
        return $this->ok(['count' => Comment::where('post_id', $postId)->where('status', 'Approved')->count()]);
    }

    public function store(Request $request, int $postId)
    {
        Post::where('status', 'Published')->findOrFail($postId);
        $data = $request->validate(['content' => 'required|string|max:10000']);
        $comment = Comment::create(['post_id' => $postId, 'user_id' => $request->user()->id, 'content' => $data['content'], 'status' => 'Pending']);

        return $this->ok($comment, 'Bình luận đã được gửi và đang chờ duyệt.', 201);
    }

    public function reply(Request $request, int $id)
    {
        $parent = Comment::findOrFail($id);
        $data = $request->validate(['content' => 'required|string|max:10000']);

        return $this->ok(Comment::create(['post_id' => $parent->post_id, 'user_id' => $request->user()->id, 'parent_id' => $id, 'content' => $data['content'], 'status' => 'Pending']), 'Trả lời đã được gửi.', 201);
    }

    public function moderate(int $id, string $status)
    {
        $comment = Comment::findOrFail($id);
        $comment->update(['status' => $status]);

        return $this->ok($comment->fresh());
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
        return ['id' => $comment->id, 'postId' => $comment->post_id, 'userId' => $comment->user_id, 'userName' => $comment->user?->username, 'content' => $comment->content, 'parentId' => $comment->parent_id, 'status' => strtolower($comment->status), 'createdAt' => $comment->created_at?->toISOString(), 'replies' => $comment->replies()->with('user')->where('status', 'Approved')->oldest()->get()->map(fn ($reply) => $this->commentArray($reply))->values()];
    }
}
