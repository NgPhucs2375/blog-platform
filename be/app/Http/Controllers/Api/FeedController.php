<?php

namespace App\Http\Controllers\Api;

use App\Models\CustomFeed;
use App\Models\Post;
use App\Services\ReaderContentFilter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeedController extends ApiController
{
    public function following(Request $request)
    {
        $authorIds = $request->user()->following()->select('users.id');
        $query = app(ReaderContentFilter::class)->apply(Post::with(['author', 'category', 'tags', 'quotedPost.author', 'community'])
            ->where('status', 'Published')
            ->whereIn('author_id', $authorIds)
            ->where(fn ($threads) => $threads->whereNull('thread_id')->orWhere('thread_position', 0))
            ->whereNull('quoted_post_id'), $request->user());

        return $this->postsResponse($query, $request);
    }

    public function liked(Request $request)
    {
        $query = app(ReaderContentFilter::class)->apply($request->user()->likedPosts()
            ->with(['author', 'category', 'tags', 'quotedPost.author', 'community'])
            ->where('posts.status', 'Published')
            ->latest('post_likes.created_at'), $request->user());

        return $this->postsResponse($query, $request);
    }

    public function insights(Request $request)
    {
        $days = min(90, max(7, (int) $request->query('days', 30)));
        $start = now()->subDays($days - 1)->startOfDay();
        $authorId = $request->user()->id;
        $postIds = Post::where('author_id', $authorId)->where('status', 'Published')->select('id');
        $series = collect();
        foreach ([
            'views' => DB::table('post_views')->whereIn('post_id', $postIds)->where('viewed_at', '>=', $start)->selectRaw('DATE(viewed_at) as day, count(*) as total')->groupBy('day')->get(),
            'likes' => DB::table('post_likes')->whereIn('post_id', $postIds)->where('created_at', '>=', $start)->selectRaw('DATE(created_at) as day, count(*) as total')->groupBy('day')->get(),
            'replies' => DB::table('comments')->whereIn('post_id', $postIds)->where('status', 'Approved')->where('created_at', '>=', $start)->selectRaw('DATE(created_at) as day, count(*) as total')->groupBy('day')->get(),
            'reposts' => DB::table('post_reposts')->whereIn('post_id', $postIds)->where('created_at', '>=', $start)->selectRaw('DATE(created_at) as day, count(*) as total')->groupBy('day')->get(),
            'followers' => DB::table('user_follows')->where('followed_id', $authorId)->where('created_at', '>=', $start)->selectRaw('DATE(created_at) as day, count(*) as total')->groupBy('day')->get(),
        ] as $metric => $rows) {
            foreach ($rows as $row) {
                $series->put($row->day, array_merge($series->get($row->day, []), [$metric => (int) $row->total]));
            }
        }
        $daily = collect(range(0, $days - 1))->map(function (int $offset) use ($start, $series): array {
            $day = $start->copy()->addDays($offset)->toDateString();
            $values = $series->get($day, []);

            return ['date' => $day, 'views' => $values['views'] ?? 0, 'likes' => $values['likes'] ?? 0, 'replies' => $values['replies'] ?? 0, 'reposts' => $values['reposts'] ?? 0, 'followers' => $values['followers'] ?? 0];
        });
        $posts = Post::with(['author', 'category', 'tags'])
            ->where('author_id', $authorId)->where('status', 'Published')
            ->withCount(['likers', 'comments' => fn ($query) => $query->where('status', 'Approved'), 'reposters'])
            ->latest('published_at')->limit(10)->get()
            ->map(fn (Post $post) => ['post' => $post->apiArray(), 'views' => (int) $post->view_count, 'likes' => (int) $post->likers_count, 'replies' => (int) $post->comments_count, 'reposts' => (int) $post->reposters_count]);

        return $this->ok(['days' => $days, 'totals' => [
            'views' => (int) Post::where('author_id', $authorId)->where('status', 'Published')->sum('view_count'),
            'followers' => (int) $request->user()->followers()->count(),
            'newFollowers' => (int) DB::table('user_follows')->where('followed_id', $authorId)->where('created_at', '>=', $start)->count(),
        ], 'daily' => $daily, 'topPosts' => $posts]);
    }

    public function customFeeds(Request $request)
    {
        return $this->ok($request->user()->customFeeds()->latest()->get()->map(fn (CustomFeed $feed) => $this->feedArray($feed)));
    }

    public function publicCustomFeeds(Request $request)
    {
        return $this->ok(CustomFeed::with('user:id,username')->where('is_public', true)->latest()->paginate(min(50, max(1, (int) $request->query('limit', 20))))->through(fn (CustomFeed $feed) => $this->feedArray($feed)));
    }

    public function storeCustomFeed(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'filters' => 'required|array|min:1',
            'filters.categoryId' => 'sometimes|integer|exists:categories,id',
            'filters.tag' => 'sometimes|string|max:120',
            'filters.authorId' => 'sometimes|integer|exists:users,id',
            'filters.author' => 'sometimes|string|max:100',
            'filters.communityId' => 'sometimes|integer|exists:communities,id',
            'isPublic' => 'sometimes|boolean',
        ]);
        if (! array_intersect(['categoryId', 'tag', 'authorId', 'author', 'communityId'], array_keys($data['filters']))) {
            return $this->fail('Chọn ít nhất một tiêu chí cho bảng tin.', 422);
        }
        $feed = $request->user()->customFeeds()->create(['name' => $data['name'], 'filters' => $data['filters'], 'is_public' => $data['isPublic'] ?? false]);

        return $this->ok($this->feedArray($feed), 'Đã tạo bảng tin.', 201);
    }

    public function customFeedPosts(Request $request, int $id)
    {
        $feed = CustomFeed::whereKey($id)->where(fn ($query) => $query->where('is_public', true)->when($request->user(), fn ($owned) => $owned->orWhere('user_id', $request->user()->id)))->firstOrFail();
        $filters = $feed->filters;
        $query = app(ReaderContentFilter::class)->apply(Post::with(['author', 'category', 'tags', 'quotedPost.author', 'community'])->where('status', 'Published')->whereNull('quoted_post_id')->where(fn ($threads) => $threads->whereNull('thread_id')->orWhere('thread_position', 0)), $request->user());
        if (isset($filters['categoryId'])) {
            $query->where('category_id', $filters['categoryId']);
        }
        if (isset($filters['tag'])) {
            $query->whereHas('tags', fn ($tags) => $tags->where('slug', $filters['tag']));
        }
        if (isset($filters['authorId'])) {
            $query->where('author_id', $filters['authorId']);
        }
        if (isset($filters['author'])) {
            $query->whereHas('author', fn ($author) => $author->where('username', ltrim($filters['author'], '@')));
        }
        if (isset($filters['communityId'])) {
            $query->where('community_id', $filters['communityId']);
        }

        return $this->postsResponse($query, $request);
    }

    public function destroyCustomFeed(Request $request, int $id)
    {
        $feed = $request->user()->customFeeds()->findOrFail($id);
        $feed->delete();

        return $this->ok(null, 'Đã xóa bảng tin.');
    }

    private function postsResponse($query, Request $request)
    {
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(50, max(1, (int) $request->query('limit', 20)));
        $paginator = $query->latest('published_at')->paginate($limit, ['posts.*'], 'page', $page);

        return $this->ok(['posts' => $paginator->getCollection()->map(fn (Post $post) => $post->apiArray())->values(), 'pagination' => ['page' => $paginator->currentPage(), 'limit' => $paginator->perPage(), 'total' => $paginator->total(), 'totalPages' => $paginator->lastPage()]]);
    }

    private function feedArray(CustomFeed $feed): array
    {
        return ['id' => $feed->id, 'name' => $feed->name, 'filters' => $feed->filters, 'isPublic' => $feed->is_public, 'creator' => $feed->user ? ['username' => $feed->user->username] : null];
    }
}
