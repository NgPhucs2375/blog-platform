<?php

namespace App\Http\Controllers\Api;

use App\Models\Post;
use App\Models\PostRevision;
use App\Models\Tag;
use App\Notifications\BlogActivityNotification;
use App\Services\PostModerationService;
use App\Services\ReaderContentFilter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PostController extends ApiController
{
    public function index(Request $request)
    {
        $query = Post::with(['author', 'category', 'tags', 'quotedPost.author', 'quotedPost.category', 'community'])
            ->where('status', 'Published')
            ->where(fn ($threads) => $threads->whereNull('thread_id')->orWhere('thread_position', 0));
        if ($request->filled('keyword')) {
            $query->where(fn ($q) => $q->where('title', 'like', '%'.$request->query('keyword').'%')->orWhere('content', 'like', '%'.$request->query('keyword').'%'));
        }
        if ($request->filled('categoryId')) {
            $query->where('category_id', (int) $request->query('categoryId'));
        }
        if ($request->filled('authorId')) {
            $query->where('author_id', (int) $request->query('authorId'));
        }
        if ($request->filled('community')) {
            $query->whereHas('community', fn ($community) => $community->where('slug', $request->query('community')));
        }
        if ($request->filled('tag')) {
            $query->whereHas('tags', fn ($tags) => $tags->where('slug', $request->query('tag')));
        }
        if ($request->filled('fromDate')) {
            $query->whereDate('published_at', '>=', $request->query('fromDate'));
        }
        if ($request->filled('toDate')) {
            $query->whereDate('published_at', '<=', $request->query('toDate'));
        }
        $query = app(ReaderContentFilter::class)->apply($query, $request->user());
        $total = (clone $query)->count();
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 12)));
        $posts = $query->latest('published_at')->latest()->skip(($page - 1) * $limit)->take($limit)->get()->map(fn (Post $post) => $post->apiArray())->values();

        return $this->ok(['posts' => $posts, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)]]);
    }

    public function show(Request $request, string $id)
    {
        $query = Post::with(['author', 'category', 'tags', 'quotedPost.author', 'quotedPost.category'])->where('status', 'Published')->where(fn ($q) => ctype_digit($id) ? $q->whereKey((int) $id) : $q->where('slug', $id));
        $post = app(ReaderContentFilter::class)->apply($query, $request->user())->firstOrFail();

        return $this->ok($post->apiArray());
    }

    public function manage(Request $request, int $id)
    {
        $post = Post::with(['author', 'category', 'tags'])->findOrFail($id);
        if ($request->user()->role !== 'Admin' && $post->author_id !== $request->user()->id) {
            return $this->fail('Bạn không có quyền xem bài viết này.', 403);
        }

        return $this->ok($post->apiArray());
    }

    public function controls(Request $request, int $id)
    {
        $post = Post::findOrFail($id);
        if ($request->user()->role !== 'Admin' && $post->author_id !== $request->user()->id) {
            return $this->fail('Bạn không có quyền thay đổi cài đặt bài viết này.', 403);
        }
        $data = $request->validate([
            'replyPermission' => ['required', Rule::in(['everyone', 'followers', 'none'])],
            'quotePermission' => ['required', Rule::in(['everyone', 'followers', 'none'])],
            'replyApproval' => 'required|boolean',
        ]);
        $post->update([
            'reply_permission' => $data['replyPermission'],
            'quote_permission' => $data['quotePermission'],
            'reply_approval' => $data['replyApproval'],
        ]);

        return $this->ok($post->fresh()->load(['author', 'category', 'tags', 'community'])->apiArray(), 'Đã cập nhật quyền tương tác.');
    }

    public function mine(Request $request)
    {
        $posts = Post::with(['author', 'category', 'tags'])->where('author_id', $request->user()->id)->latest()->paginate(min(100, max(1, (int) $request->query('limit', 20))));

        return $this->ok($posts);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'nullable|string|max:500', 'slug' => 'nullable|string|max:500|unique:posts,slug',
            'content' => 'required|string', 'excerpt' => 'nullable|string|max:2000',
            'categoryId' => 'nullable|integer|exists:categories,id', 'category_id' => 'sometimes|nullable|integer|exists:categories,id',
            'status' => ['nullable', Rule::in(['published', 'draft', 'scheduled', 'PENDING', 'PUBLISHED', 'DRAFT', 'SCHEDULED', 'Published', 'Draft', 'Scheduled', 'Pending'])],
            'scheduledAt' => 'nullable|date|after:now', 'coverImage' => 'nullable|string|max:1000', 'cover_image' => 'nullable|string|max:1000',
            'metaTitle' => 'nullable|string|max:255', 'metaDescription' => 'nullable|string|max:320', 'tags' => 'sometimes|array|max:20', 'tags.*' => 'string|max:100',
            'media' => 'sometimes|array|max:10', 'media.*.url' => 'required_with:media|string|max:1000', 'media.*.type' => ['required_with:media', Rule::in(['image', 'video'])],
            'pollOptions' => 'sometimes|nullable|array|min:2|max:4', 'pollOptions.*' => 'required|string|max:100', 'pollEndsAt' => 'nullable|date|after:now',
            'replyPermission' => ['sometimes', Rule::in(['everyone', 'followers', 'none'])], 'quotePermission' => ['sometimes', Rule::in(['everyone', 'followers', 'none'])], 'replyApproval' => 'sometimes|boolean',
            'communityId' => 'nullable|integer|exists:communities,id',
        ]);
        $data['title'] = trim($data['title'] ?? '') ?: Str::limit(trim(strip_tags($data['content'])), 80, '');
        $requestedStatus = ucfirst(strtolower($data['status'] ?? 'Draft'));
        $isAdmin = $request->user()->role === 'Admin';
        if (! empty($data['communityId']) && ! $request->user()->communities()->whereKey($data['communityId'])->exists()) {
            return $this->fail('Bạn cần tham gia cộng đồng trước khi đăng bài.', 403);
        }
        $status = app(PostModerationService::class)->statusFor($requestedStatus, $isAdmin, $data['title'], $data['content']);
        if (! in_array($status, ['Published', 'Scheduled', 'Pending'], true)) {
            $status = 'Draft';
        }
        if ($status === 'Scheduled' && empty($data['scheduledAt'])) {
            return $this->fail('scheduledAt là bắt buộc khi lên lịch xuất bản.', 422);
        }
        $post = DB::transaction(function () use ($data, $status, $request, $requestedStatus) {
            $post = Post::create([
                'title' => $data['title'], 'slug' => ($data['slug'] ?? null) ?: Str::slug($data['title']).'-'.Str::lower(Str::random(6)),
                'content' => $data['content'], 'excerpt' => $data['excerpt'] ?? Str::limit(strip_tags($data['content']), 180),
                'category_id' => $data['categoryId'] ?? $data['category_id'] ?? null, 'author_id' => $request->user()->id,
                'status' => $status, 'cover_image' => $data['coverImage'] ?? $data['cover_image'] ?? null,
                'published_at' => $status === 'Published' ? now() : null,
                'scheduled_at' => $requestedStatus === 'Scheduled' ? ($data['scheduledAt'] ?? null) : null,
                'meta_title' => $data['metaTitle'] ?? null, 'meta_description' => $data['metaDescription'] ?? null,
                'media' => $data['media'] ?? null, 'poll_options' => isset($data['pollOptions']) ? array_values($data['pollOptions']) : null,
                'poll_ends_at' => $data['pollEndsAt'] ?? null, 'reply_permission' => $data['replyPermission'] ?? 'everyone',
                'quote_permission' => $data['quotePermission'] ?? 'everyone', 'reply_approval' => $data['replyApproval'] ?? false,
                'community_id' => $data['communityId'] ?? null,
            ]);
            $this->syncTags($post, $data['tags'] ?? []);

            return $post;
        });
        if ($status === 'Published') {
            $this->notifyAudience($post);
        }

        return $this->ok($post->load(['author', 'category', 'tags'])->apiArray(), 'Tạo bài viết thành công.', 201);
    }

    public function storeThread(Request $request)
    {
        $data = $request->validate([
            'categoryId' => 'nullable|integer|exists:categories,id',
            'items' => 'required|array|min:2|max:10',
            'items.*.content' => 'required|string|max:10000',
            'items.*.media' => 'sometimes|array|max:10',
            'items.*.media.*.url' => 'required_with:items.*.media|string|max:1000',
            'items.*.media.*.type' => ['required_with:items.*.media', Rule::in(['image', 'video'])],
            'tags' => 'sometimes|array|max:20', 'tags.*' => 'string|max:100',
            'communityId' => 'nullable|integer|exists:communities,id',
        ]);
        if (! empty($data['communityId']) && ! $request->user()->communities()->whereKey($data['communityId'])->exists()) {
            return $this->fail('Bạn cần tham gia cộng đồng trước khi đăng bài.', 403);
        }
        $threadId = (string) Str::uuid();
        $posts = DB::transaction(function () use ($data, $request, $threadId): array {
            $created = [];
            foreach ($data['items'] as $position => $item) {
                $content = trim($item['content']);
                $title = Str::limit(trim(strip_tags($content)), 80, '');
                $status = app(PostModerationService::class)->statusFor('Published', $request->user()->role === 'Admin', $title, $content);
                $post = Post::create([
                    'title' => $title, 'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
                    'content' => $content, 'excerpt' => Str::limit(strip_tags($content), 180),
                    'category_id' => $data['categoryId'] ?? null, 'author_id' => $request->user()->id,
                    'status' => $status, 'published_at' => $status === 'Published' ? now() : null,
                    'media' => $item['media'] ?? null, 'thread_id' => $threadId, 'thread_position' => $position,
                    'community_id' => $data['communityId'] ?? null,
                ]);
                $this->syncTags($post, $data['tags'] ?? []);
                $created[] = $post;
            }

            return $created;
        });
        foreach ($posts as $post) {
            if ($post->status === 'Published') {
                $this->notifyAudience($post);
            }
        }

        return $this->ok(['threadId' => $threadId, 'posts' => collect($posts)->map(fn (Post $post) => $post->load(['author', 'category', 'tags', 'community'])->apiArray())->values()], 'Đã đăng chuỗi bài viết.', 201);
    }

    public function update(Request $request, int $id)
    {
        $post = Post::findOrFail($id);
        if ($request->user()->role !== 'Admin' && $post->author_id !== $request->user()->id) {
            return $this->fail('Bạn không có quyền sửa bài viết này.', 403);
        }
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:500', 'slug' => ['sometimes', 'required', 'string', 'max:500', Rule::unique('posts', 'slug')->ignore($id)],
            'content' => 'sometimes|required|string', 'excerpt' => 'nullable|string|max:2000',
            'categoryId' => 'sometimes|integer|exists:categories,id', 'category_id' => 'sometimes|integer|exists:categories,id',
            'status' => ['sometimes', Rule::in(['published', 'draft', 'scheduled', 'PUBLISHED', 'DRAFT', 'SCHEDULED', 'Published', 'Draft', 'Scheduled', 'Pending'])],
            'scheduledAt' => 'nullable|date|after:now', 'coverImage' => 'nullable|string|max:1000', 'cover_image' => 'nullable|string|max:1000',
            'metaTitle' => 'nullable|string|max:255', 'metaDescription' => 'nullable|string|max:320', 'tags' => 'sometimes|array|max:20', 'tags.*' => 'string|max:100',
            'media' => 'sometimes|array|max:10', 'media.*.url' => 'required_with:media|string|max:1000', 'media.*.type' => ['required_with:media', Rule::in(['image', 'video'])],
            'pollOptions' => 'sometimes|nullable|array|min:2|max:4', 'pollOptions.*' => 'required|string|max:100', 'pollEndsAt' => 'nullable|date|after:now',
            'replyPermission' => ['sometimes', Rule::in(['everyone', 'followers', 'none'])], 'quotePermission' => ['sometimes', Rule::in(['everyone', 'followers', 'none'])], 'replyApproval' => 'sometimes|boolean',
            'communityId' => 'nullable|integer|exists:communities,id',
        ]);
        if (array_key_exists('communityId', $data) && $data['communityId'] && ! $request->user()->communities()->whereKey($data['communityId'])->exists()) {
            return $this->fail('Bạn cần tham gia cộng đồng trước khi chuyển bài viết vào đó.', 403);
        }
        if (array_intersect(array_keys($data), ['title', 'content', 'excerpt'])) {
            PostRevision::create(['post_id' => $post->id, 'user_id' => $request->user()->id, 'title' => $post->title, 'content' => $post->content, 'excerpt' => $post->excerpt]);
        }
        $newStatus = ucfirst(strtolower($data['status'] ?? $post->status));
        $newStatus = app(PostModerationService::class)->statusFor(
            $newStatus,
            $request->user()->role === 'Admin',
            $data['title'] ?? $post->title,
            $data['content'] ?? $post->content,
        );
        if ($newStatus === 'Scheduled' && empty($data['scheduledAt']) && ! $post->scheduled_at) {
            return $this->fail('scheduledAt là bắt buộc khi lên lịch xuất bản.', 422);
        }
        $wasPublished = $post->status === 'Published';
        $post->update([
            'title' => $data['title'] ?? $post->title, 'slug' => $data['slug'] ?? $post->slug,
            'content' => $data['content'] ?? $post->content, 'excerpt' => $data['excerpt'] ?? $post->excerpt,
            'category_id' => $data['categoryId'] ?? $data['category_id'] ?? $post->category_id,
            'status' => $newStatus, 'cover_image' => array_key_exists('coverImage', $data) ? $data['coverImage'] : ($data['cover_image'] ?? $post->cover_image),
            'published_at' => $newStatus === 'Published' ? ($post->published_at ?? now()) : null,
            'scheduled_at' => in_array($newStatus, ['Scheduled', 'Pending'], true) ? ($data['scheduledAt'] ?? $post->scheduled_at) : null,
            'meta_title' => $data['metaTitle'] ?? $post->meta_title, 'meta_description' => $data['metaDescription'] ?? $post->meta_description,
            'media' => array_key_exists('media', $data) ? $data['media'] : $post->media,
            'poll_options' => array_key_exists('pollOptions', $data) ? ($data['pollOptions'] ? array_values($data['pollOptions']) : null) : $post->poll_options,
            'poll_ends_at' => array_key_exists('pollEndsAt', $data) ? $data['pollEndsAt'] : $post->poll_ends_at,
            'reply_permission' => $data['replyPermission'] ?? $post->reply_permission ?? 'everyone',
            'quote_permission' => $data['quotePermission'] ?? $post->quote_permission ?? 'everyone',
            'reply_approval' => $data['replyApproval'] ?? $post->reply_approval ?? false,
            'community_id' => array_key_exists('communityId', $data) ? $data['communityId'] : $post->community_id,
            'updated_by' => $request->user()->id,
        ]);
        if (array_key_exists('tags', $data)) {
            $this->syncTags($post, $data['tags']);
        }
        if (! $wasPublished && $newStatus === 'Published') {
            $this->notifyAudience($post);
        }

        return $this->ok($post->fresh()->load(['author', 'category', 'tags'])->apiArray(), 'Cập nhật bài viết thành công.');
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

    public function view(Request $request, int $id)
    {
        $post = Post::where('status', 'Published')->findOrFail($id);
        $visitorHash = hash('sha256', $request->ip().'|'.$request->userAgent().'|'.$post->id.'|'.now()->toDateString());
        $recorded = DB::table('post_views')->where('post_id', $post->id)->where('visitor_hash', $visitorHash)->where('viewed_at', '>=', now()->startOfDay())->exists();
        if (! $recorded) {
            DB::table('post_views')->insert(['post_id' => $post->id, 'user_id' => $request->user()?->id, 'visitor_hash' => $visitorHash, 'viewed_at' => now()]);
            $post->increment('view_count');
        }

        return $this->ok(['viewCount' => $post->fresh()->view_count, 'counted' => ! $recorded]);
    }

    public function adminQueue(Request $request)
    {
        $query = Post::with(['author', 'category', 'tags'])
            ->when($request->filled('status'), fn ($builder) => $builder->where('status', ucfirst(strtolower($request->query('status')))))
            ->latest();
        $posts = $query->paginate(min(100, max(1, (int) $request->query('limit', 30))));

        return $this->ok(['posts' => $posts->getCollection()->map(fn (Post $post) => $post->apiArray())->values(), 'pagination' => ['page' => $posts->currentPage(), 'total' => $posts->total()]]);
    }

    public function approve(int $id)
    {
        $post = Post::findOrFail($id);
        $wasPublished = $post->status === 'Published';
        $post->update(['status' => $post->scheduled_at && $post->scheduled_at->isFuture() ? 'Scheduled' : 'Published', 'published_at' => $post->scheduled_at && $post->scheduled_at->isFuture() ? null : now()]);
        if (! $wasPublished && $post->status === 'Published') {
            $this->notifyAudience($post);
            $post->author?->notify(new BlogActivityNotification($post, 'approved'));
        }

        return $this->ok($post->fresh()->load(['author', 'category', 'tags'])->apiArray(), 'Đã duyệt bài viết.');
    }

    private function syncTags(Post $post, array $names): void
    {
        $tagIds = collect($names)->map(fn (string $name) => trim($name))->filter()->map(function (string $name): int {
            $name = trim($name);
            $slug = Str::slug($name);
            $tag = Tag::firstOrCreate(['slug' => $slug], ['name' => $name]);

            return $tag->id;
        })->unique()->all();
        $post->tags()->sync($tagIds);
    }

    private function notifyAudience(Post $post): void
    {
        $post->loadMissing('author');
        $post->author->followers()->get()->each->notify(new BlogActivityNotification($post));
        DB::table('newsletter_subscriptions')->whereNotNull('confirmed_at')->orderBy('id')->chunk(200, function ($subscribers) use ($post): void {
            foreach ($subscribers as $subscriber) {
                $url = rtrim((string) config('app.frontend_url', config('app.url')), '/').'/posts/'.$post->slug;
                $unsubscribe = URL::signedRoute('newsletter.unsubscribe', ['token' => $subscriber->unsubscribe_token]);
                try {
                    Mail::raw($post->title."\n\n".$post->excerpt."\n\nĐọc bài: ".$url."\nHủy nhận tin: ".$unsubscribe, fn ($message) => $message->to($subscriber->email)->subject('Bài viết mới: '.$post->title));
                } catch (\Throwable $exception) {
                    report($exception);
                }
            }
        });
    }
}
