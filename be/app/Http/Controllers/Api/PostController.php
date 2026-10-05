<?php

namespace App\Http\Controllers\Api;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PostController extends ApiController
{
    public function index(Request $request)
    {
        $query = Post::with(['author', 'category'])->where('status', 'Published');
        if ($request->filled('keyword')) {
            $query->where(fn ($q) => $q->where('title', 'like', '%'.$request->query('keyword').'%')->orWhere('content', 'like', '%'.$request->query('keyword').'%'));
        }
        if ($request->filled('categoryId')) {
            $query->where('category_id', (int) $request->query('categoryId'));
        }
        if ($request->filled('authorId')) {
            $query->where('author_id', (int) $request->query('authorId'));
        }
        if ($request->filled('fromDate')) {
            $query->whereDate('created_at', '>=', $request->query('fromDate'));
        }
        if ($request->filled('toDate')) {
            $query->whereDate('created_at', '<=', $request->query('toDate'));
        }
        $total = (clone $query)->count();
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 100)));
        $posts = $query->latest('published_at')->latest()->skip(($page - 1) * $limit)->take($limit)->get()->map->apiArray()->values();

        return $this->ok(['posts' => $posts, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)]]);
    }

    public function show(string $id)
    {
        $post = Post::with(['author', 'category'])->where('status', 'Published')->where(fn ($q) => ctype_digit($id) ? $q->whereKey((int) $id) : $q->where('slug', $id))->firstOrFail();

        return $this->ok($post->apiArray());
    }

    public function manage(Request $request, int $id)
    {
        $post = Post::with(['author', 'category'])->findOrFail($id);
        if ($request->user()->role !== 'Admin' && $post->author_id !== $request->user()->id) {
            return $this->fail('Bạn không có quyền xem bài viết này.', 403);
        }

        return $this->ok($post->apiArray());
    }

    public function mine(Request $request)
    {
        return $this->ok(Post::with(['author', 'category'])->where('author_id', $request->user()->id)->latest()->get()->map->apiArray()->values());
    }

    public function store(Request $request)
    {
        $data = $request->validate(['title' => 'required|string|max:500', 'slug' => 'nullable|string|max:500|unique:posts,slug', 'content' => 'required|string', 'excerpt' => 'nullable|string', 'categoryId' => 'required|integer|exists:categories,id', 'category_id' => 'sometimes|integer|exists:categories,id', 'status' => ['nullable', Rule::in(['PUBLISHED', 'DRAFT', 'Published', 'Draft', 'Pending'])], 'coverImage' => 'nullable|string|max:1000', 'cover_image' => 'nullable|string|max:1000']);
        $status = strtoupper($data['status'] ?? 'DRAFT') === 'PUBLISHED' && $request->user()->role === 'Admin' ? 'Published' : 'Pending';
        $post = Post::create(['title' => $data['title'], 'slug' => $data['slug'] ?: Str::slug($data['title']).'-'.Str::lower(Str::random(6)), 'content' => $data['content'], 'excerpt' => $data['excerpt'] ?? Str::limit(strip_tags($data['content']), 180), 'category_id' => $data['categoryId'] ?? $data['category_id'], 'author_id' => $request->user()->id, 'status' => $status, 'cover_image' => $data['coverImage'] ?? $data['cover_image'] ?? null, 'published_at' => $status === 'Published' ? now() : null]);

        return $this->ok($post->load(['author', 'category'])->apiArray(), 'Tạo bài viết thành công.', 201);
    }

    public function update(Request $request, int $id)
    {
        $post = Post::findOrFail($id);
        if ($request->user()->role !== 'Admin' && $post->author_id !== $request->user()->id) {
            return $this->fail('Bạn không có quyền sửa bài viết này.', 403);
        }
        $data = $request->validate(['title' => 'sometimes|required|string|max:500', 'slug' => ['sometimes', 'required', 'string', 'max:500', Rule::unique('posts', 'slug')->ignore($id)], 'content' => 'sometimes|required|string', 'excerpt' => 'nullable|string', 'categoryId' => 'sometimes|integer|exists:categories,id', 'category_id' => 'sometimes|integer|exists:categories,id', 'status' => ['sometimes', Rule::in(['published', 'draft', 'Published', 'Draft', 'Pending'])], 'coverImage' => 'nullable|string|max:1000', 'cover_image' => 'nullable|string|max:1000']);
        $status = $data['status'] ?? $post->status;
        if (strtolower($status) === 'published' && $request->user()->role !== 'Admin' && $post->status !== 'Published') {
            $status = 'Pending';
        }
        $post->update(['title' => $data['title'] ?? $post->title, 'slug' => $data['slug'] ?? $post->slug, 'content' => $data['content'] ?? $post->content, 'excerpt' => $data['excerpt'] ?? $post->excerpt, 'category_id' => $data['categoryId'] ?? $data['category_id'] ?? $post->category_id, 'status' => ucfirst(strtolower($status)), 'cover_image' => $data['coverImage'] ?? $data['cover_image'] ?? $post->cover_image, 'published_at' => ucfirst(strtolower($status)) === 'Published' ? ($post->published_at ?? now()) : null, 'updated_by' => $request->user()->id]);

        return $this->ok($post->fresh()->load(['author', 'category'])->apiArray(), 'Cập nhật bài viết thành công.');
    }

    public function destroy(Request $request, int $id)
    {
        $post = Post::findOrFail($id);
        if ($request->user()->role !== 'Admin' && $post->author_id !== $request->user()->id) {
            return $this->fail('Bạn không có quyền xóa bài viết này.', 403);
        }
        $post->delete();

        return $this->ok(null, 'Xóa bài viết thành công.');
    }

    public function view(int $id)
    {
        $post = Post::where('status', 'Published')->findOrFail($id);
        $post->increment('view_count');

        return $this->ok(['viewCount' => $post->fresh()->view_count]);
    }

    public function approve(int $id)
    {
        $post = Post::findOrFail($id);
        $post->update(['status' => 'Published', 'published_at' => now()]);

        return $this->ok($post->fresh()->load(['author', 'category'])->apiArray(), 'Đã duyệt bài viết.');
    }
}
