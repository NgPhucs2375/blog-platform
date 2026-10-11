<?php

namespace App\Http\Controllers\Api;

use App\Models\PollVote;
use App\Models\Post;
use App\Models\User;
use App\Models\ReaderControl;
use App\Notifications\BlogActivityNotification;
use App\Services\PostModerationService;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ReaderController extends ApiController
{
    public function controls(Request $request)
    {
        return $this->ok(ReaderControl::where('user_id', $request->user()->id)->with(['targetUser:id,username', 'post:id,title', 'category:id,name'])->latest()->get());
    }

    public function storeControl(Request $request)
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['block', 'mute', 'hide_post', 'less_category'])],
            'targetId' => 'required|integer|min:1',
        ]);
        $columns = match ($data['type']) {
            'block', 'mute' => ['target_user_id' => $data['targetId']],
            'hide_post' => ['post_id' => $data['targetId']],
            'less_category' => ['category_id' => $data['targetId']],
        };
        $target = match ($data['type']) {
            'block', 'mute' => User::where('status', 'Active')->findOrFail($data['targetId']),
            'hide_post' => Post::where('status', 'Published')->findOrFail($data['targetId']),
            'less_category' => \App\Models\Category::findOrFail($data['targetId']),
        };
        if (in_array($data['type'], ['block', 'mute'], true) && $target->id === $request->user()->id) {
            return $this->fail('Bạn không thể áp dụng thao tác này cho chính mình.', 422);
        }
        if ($data['type'] === 'block') {
            $request->user()->following()->detach($target->id);
            $target->following()->detach($request->user()->id);
        }
        $control = ReaderControl::firstOrCreate(['user_id' => $request->user()->id, 'type' => $data['type']] + $columns);

        return $this->ok($control, 'Đã lưu tùy chọn nội dung.', 201);
    }

    public function destroyControl(Request $request, int $id)
    {
        ReaderControl::where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return $this->ok(null, 'Đã gỡ tùy chọn nội dung.');
    }

    public function preferences(Request $request)
    {
        $settings = DB::table('reader_feed_settings')->where('user_id', $request->user()->id)->first();

        return $this->ok(['defaultFeed' => $settings?->default_feed ?? 'discover', 'pinnedFeedIds' => $settings ? (json_decode($settings->pinned_feed_ids ?: '[]', true) ?: []) : []]);
    }

    public function updatePreferences(Request $request)
    {
        $data = $request->validate([
            'defaultFeed' => 'sometimes|required|string|max:100',
            'pinnedFeedIds' => 'sometimes|required|array|max:20',
            'pinnedFeedIds.*' => 'integer|min:1',
        ]);
        $settings = DB::table('reader_feed_settings')->where('user_id', $request->user()->id)->first();
        $defaultFeed = $data['defaultFeed'] ?? $settings?->default_feed ?? 'discover';
        if (! in_array($defaultFeed, ['discover', 'following', 'liked', 'saved'], true)) {
            if (! preg_match('/^custom-(\d+)$/', $defaultFeed, $match) || ! $request->user()->customFeeds()->whereKey((int) $match[1])->exists()) {
                return $this->fail('Bảng tin mặc định không hợp lệ.', 422);
            }
        }
        $pinned = $data['pinnedFeedIds'] ?? ($settings ? (json_decode($settings->pinned_feed_ids ?: '[]', true) ?: []) : []);
        $pinned = array_values(array_unique(array_map('intval', $pinned)));
        if ($pinned && $request->user()->customFeeds()->whereIn('id', $pinned)->count() !== count($pinned)) {
            return $this->fail('Danh sách bảng tin ghim không hợp lệ.', 422);
        }
        DB::table('reader_feed_settings')->updateOrInsert(['user_id' => $request->user()->id], ['default_feed' => $defaultFeed, 'pinned_feed_ids' => json_encode($pinned), 'updated_at' => now(), 'created_at' => $settings?->created_at ?? now()]);

        return $this->ok(['defaultFeed' => $defaultFeed, 'pinnedFeedIds' => $pinned], 'Đã lưu tùy chọn bảng tin.');
    }

    public function state(Request $request, int $id)
    {
        $post = Post::where('status', 'Published')->findOrFail($id);

        return $this->ok([
            'liked' => $post->likers()->where('users.id', $request->user()->id)->exists(),
            'bookmarked' => $post->bookmarkers()->where('users.id', $request->user()->id)->exists(),
            'reposted' => $post->reposters()->where('users.id', $request->user()->id)->exists(),
            'followingAuthor' => $request->user()->following()->where('users.id', $post->author_id)->exists(),
            'likesCount' => $post->likers()->count(),
            'repostsCount' => $post->reposters()->count() + $post->quotePosts()->where('status', 'Published')->count(),
            'followersCount' => $post->author?->followers()->count() ?? 0,
        ]);
    }

    public function like(Request $request, int $id)
    {
        $post = Post::where('status', 'Published')->findOrFail($id);
        $changes = $request->user()->likedPosts()->syncWithoutDetaching([$post->id]);
        if ($changes['attached'] && $post->author_id !== $request->user()->id) {
            $post->author?->notify(new BlogActivityNotification($post, 'like'));
        }

        return $this->ok(['liked' => true, 'likesCount' => $post->likers()->count()]);
    }

    public function unlike(Request $request, int $id)
    {
        $post = Post::findOrFail($id);
        $request->user()->likedPosts()->detach($post->id);

        return $this->ok(['liked' => false, 'likesCount' => $post->likers()->count()]);
    }

    public function bookmark(Request $request, int $id)
    {
        $post = Post::where('status', 'Published')->findOrFail($id);
        $request->user()->bookmarkedPosts()->syncWithoutDetaching([$post->id]);

        return $this->ok(['bookmarked' => true]);
    }

    public function unbookmark(Request $request, int $id)
    {
        $post = Post::findOrFail($id);
        $request->user()->bookmarkedPosts()->detach($post->id);

        return $this->ok(['bookmarked' => false]);
    }

    public function repost(Request $request, int $id)
    {
        $post = Post::where('status', 'Published')->findOrFail($id);
        $changes = $request->user()->repostedPosts()->syncWithoutDetaching([$post->id]);
        if ($changes['attached'] && $post->author_id !== $request->user()->id) {
            $post->author?->notify(new BlogActivityNotification($post, 'repost'));
        }

        return $this->ok(['reposted' => true, 'repostsCount' => $post->reposters()->count() + $post->quotePosts()->where('status', 'Published')->count()]);
    }

    public function unrepost(Request $request, int $id)
    {
        $post = Post::findOrFail($id);
        $request->user()->repostedPosts()->detach($post->id);

        return $this->ok(['reposted' => false, 'repostsCount' => $post->reposters()->count() + $post->quotePosts()->where('status', 'Published')->count()]);
    }

    public function quote(Request $request, int $id)
    {
        $data = $request->validate(['commentary' => 'nullable|string|max:10000']);
        $original = Post::with('author')->where('status', 'Published')->findOrFail($id);
        if (! $original->canBeQuotedBy($request->user())) {
            return $this->fail('Tác giả đã giới hạn người có thể trích dẫn bài viết này.', 403);
        }
        $commentary = trim($data['commentary'] ?? '');
        $title = 'Trích dẫn: '.Str::limit($original->title, 480, '');
        $status = app(PostModerationService::class)->statusFor('Published', $request->user()->role === 'Admin', $title, $commentary);
        $quote = Post::create([
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'content' => $commentary,
            'excerpt' => Str::limit($commentary, 180),
            'category_id' => $original->category_id,
            'author_id' => $request->user()->id,
            'quoted_post_id' => $original->id,
            'status' => $status,
            'published_at' => $status === 'Published' ? now() : null,
        ]);
        if ($status === 'Published' && $original->author_id !== $request->user()->id) {
            $original->author?->notify(new BlogActivityNotification($original, 'quote'));
        }

        return $this->ok([
            'post' => $quote->load(['author', 'category', 'tags', 'quotedPost.author'])->apiArray(),
            'status' => strtolower($status),
            'repostsCount' => $original->reposters()->count() + $original->quotePosts()->where('status', 'Published')->count(),
        ], $status === 'Published' ? 'Đã đăng bài trích dẫn.' : 'Bài trích dẫn đang chờ kiểm duyệt.', 201);
    }

    public function vote(Request $request, int $id)
    {
        $data = $request->validate(['optionIndex' => 'required|integer|min:0']);
        $post = Post::where('status', 'Published')->findOrFail($id);
        $options = $post->poll_options ?? [];
        if (! $options || $data['optionIndex'] >= count($options)) {
            return $this->fail('Lựa chọn bình chọn không hợp lệ.', 422);
        }
        if ($post->poll_ends_at?->isPast()) {
            return $this->fail('Cuộc bình chọn đã kết thúc.', 409);
        }
        if (PollVote::where('post_id', $post->id)->where('user_id', $request->user()->id)->exists()) {
            return $this->fail('Bạn đã bình chọn cho bài viết này.', 409);
        }
        try {
            PollVote::create(['post_id' => $post->id, 'user_id' => $request->user()->id, 'option_index' => $data['optionIndex']]);
        } catch (QueryException $exception) {
            if (PollVote::where('post_id', $post->id)->where('user_id', $request->user()->id)->exists()) {
                return $this->fail('Bạn đã bình chọn cho bài viết này.', 409);
            }
            throw $exception;
        }
        $counts = $post->pollVotes()->selectRaw('option_index, count(*) as total')->groupBy('option_index')->pluck('total', 'option_index');

        return $this->ok(['myVote' => (int) $data['optionIndex'], 'voteCounts' => collect($options)->keys()->map(fn ($index) => (int) ($counts[$index] ?? 0))->values(), 'totalVotes' => (int) $counts->sum()]);
    }

    public function share(int $id)
    {
        $post = Post::where('status', 'Published')->findOrFail($id);
        $post->increment('share_count');

        return $this->ok(['sharesCount' => (int) $post->fresh()->share_count]);
    }

    public function bookmarks(Request $request)
    {
        $posts = $request->user()->bookmarkedPosts()->with(['author', 'category', 'tags'])->latest('bookmarks.created_at')->paginate(min(100, max(1, (int) $request->query('limit', 20))));

        return $this->ok($posts);
    }

    public function follow(Request $request, int $id)
    {
        $author = User::where('status', 'Active')->findOrFail($id);
        if ($author->id === $request->user()->id) {
            return $this->fail('Không thể theo dõi chính mình.', 409);
        }
        $request->user()->following()->syncWithoutDetaching([$author->id]);

        return $this->ok(['following' => true, 'followersCount' => $author->followers()->count()]);
    }

    public function unfollow(Request $request, int $id)
    {
        $author = User::findOrFail($id);
        $request->user()->following()->detach($author->id);

        return $this->ok(['following' => false, 'followersCount' => $author->followers()->count()]);
    }
}
