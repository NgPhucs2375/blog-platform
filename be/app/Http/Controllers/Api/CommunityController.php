<?php

namespace App\Http\Controllers\Api;

use App\Models\Community;
use App\Models\Post;
use App\Models\User;
use App\Services\ReaderContentFilter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CommunityController extends ApiController
{
    public function index(Request $request)
    {
        $communities = Community::where('is_public', true)
            ->withCount(['members', 'posts' => fn ($query) => $query->where('status', 'Published')])
            ->when($request->filled('search'), fn ($query) => $query->where(fn ($search) => $search->where('name', 'like', '%'.$request->query('search').'%')->orWhere('topic', 'like', '%'.$request->query('search').'%')))
            ->orderByDesc('members_count')->orderBy('name')->paginate(min(50, max(1, (int) $request->query('limit', 20))));
        $communities->getCollection()->transform(fn (Community $community) => $this->communityArray($community, $request));

        return $this->ok($communities);
    }

    public function show(Request $request, string $slug)
    {
        $community = Community::where('is_public', true)->where('slug', $slug)
            ->withCount(['members', 'posts' => fn ($query) => $query->where('status', 'Published')])->firstOrFail();

        return $this->ok($this->communityArray($community, $request));
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:120', 'topic' => 'nullable|string|max:120', 'description' => 'nullable|string|max:2000', 'icon' => 'nullable|string|max:16']);
        $baseSlug = Str::slug($data['name']);
        $slug = $baseSlug;
        while (Community::where('slug', $slug)->exists()) {
            $slug = $baseSlug.'-'.Str::lower(Str::random(5));
        }
        $community = DB::transaction(function () use ($request, $data, $slug): Community {
            $community = Community::create(['creator_id' => $request->user()->id, 'name' => $data['name'], 'slug' => $slug, 'topic' => $data['topic'] ?? null, 'description' => $data['description'] ?? null, 'icon' => $data['icon'] ?? null]);
            $community->members()->attach($request->user()->id, ['role' => 'Moderator']);

            return $community;
        });
        $community->loadCount(['members', 'posts' => fn ($query) => $query->where('status', 'Published')]);

        return $this->ok($this->communityArray($community, $request), 'Đã tạo cộng đồng.', 201);
    }

    public function join(Request $request, int $id)
    {
        $community = Community::where('is_public', true)->findOrFail($id);
        $request->user()->communities()->syncWithoutDetaching([$community->id => ['role' => 'Member']]);

        return $this->ok(['isMember' => true, 'membersCount' => $community->members()->count()]);
    }

    public function leave(Request $request, int $id)
    {
        $community = Community::where('is_public', true)->findOrFail($id);
        $request->user()->communities()->detach($community->id);

        return $this->ok(['isMember' => false, 'membersCount' => $community->members()->count()]);
    }

    public function posts(Request $request, string $slug)
    {
        $community = Community::where('is_public', true)->where('slug', $slug)->firstOrFail();
        $posts = app(ReaderContentFilter::class)->apply(Post::with(['author', 'category', 'tags', 'quotedPost.author', 'community'])->where('status', 'Published')->where('community_id', $community->id)->where(fn ($threads) => $threads->whereNull('thread_id')->orWhere('thread_position', 0)), $request->user())->latest('published_at')->paginate(min(50, max(1, (int) $request->query('limit', 20))));
        $posts->getCollection()->transform(fn (Post $post) => $post->apiArray());

        return $this->ok(['community' => $this->communityArray($community, $request), 'posts' => $posts->items(), 'pagination' => ['page' => $posts->currentPage(), 'total' => $posts->total(), 'totalPages' => $posts->lastPage()]]);
    }

    public function updateMembership(Request $request, int $id)
    {
        $data = $request->validate(['flair' => 'nullable|string|max:40|regex:/^[\pL\pN _.-]*$/u']);
        $community = Community::where('is_public', true)->findOrFail($id);
        if (! $community->members()->where('users.id', $request->user()->id)->exists()) {
            return $this->fail('Bạn cần tham gia cộng đồng trước.', 403);
        }
        $community->members()->updateExistingPivot($request->user()->id, ['flair' => trim($data['flair'] ?? '') ?: null]);

        return $this->ok(['flair' => trim($data['flair'] ?? '') ?: null], 'Đã cập nhật nhãn thành viên.');
    }

    public function update(Request $request, int $id)
    {
        $community = Community::where('is_public', true)->findOrFail($id);
        if (! $this->canModerate($community, $request)) {
            return $this->fail('Chỉ người quản lý cộng đồng mới có quyền này.', 403);
        }
        $data = $request->validate(['name' => 'sometimes|required|string|max:120', 'topic' => 'sometimes|nullable|string|max:120', 'description' => 'sometimes|nullable|string|max:2000', 'icon' => 'sometimes|nullable|string|max:16']);
        $community->update($data);

        return $this->ok($this->communityArray($community->fresh(), $request), 'Đã cập nhật cộng đồng.');
    }

    public function moderationQueue(Request $request, string $slug)
    {
        $community = Community::where('is_public', true)->where('slug', $slug)->firstOrFail();
        if (! $this->canModerate($community, $request)) {
            return $this->fail('Chỉ người quản lý cộng đồng mới xem được hàng chờ.', 403);
        }
        $posts = Post::with(['author', 'category', 'tags'])->where('community_id', $community->id)->whereIn('status', ['Pending', 'Rejected'])->latest()->limit(100)->get()->map(fn (Post $post) => $post->apiArray());

        return $this->ok($posts);
    }

    public function membersForModeration(Request $request, int $id)
    {
        $community = Community::where('is_public', true)->findOrFail($id);
        if (! $this->canModerate($community, $request)) {
            return $this->fail('Chỉ người quản lý cộng đồng mới xem được thành viên.', 403);
        }

        return $this->ok($community->members()->select('users.id', 'users.username')->orderBy('users.username')->get()->map(fn (User $member) => ['id' => $member->id, 'username' => $member->username, 'flair' => $member->pivot->flair, 'isChampion' => (bool) $member->pivot->is_champion, 'role' => $member->pivot->role]));
    }

    public function moderatePost(Request $request, int $id, int $postId)
    {
        $community = Community::where('is_public', true)->findOrFail($id);
        if (! $this->canModerate($community, $request)) {
            return $this->fail('Chỉ người quản lý cộng đồng mới xử lý được bài viết.', 403);
        }
        $data = $request->validate(['action' => 'required|in:approve,hide']);
        $post = Post::where('community_id', $community->id)->findOrFail($postId);
        $post->update(['status' => $data['action'] === 'approve' ? 'Published' : 'Hidden', 'published_at' => $data['action'] === 'approve' ? now() : $post->published_at]);

        return $this->ok(['id' => $post->id, 'status' => strtolower($post->status)], 'Đã cập nhật trạng thái bài viết.');
    }

    public function setChampion(Request $request, int $id, int $userId)
    {
        $community = Community::where('is_public', true)->findOrFail($id);
        if (! $this->canModerate($community, $request)) {
            return $this->fail('Chỉ người quản lý cộng đồng mới cấp được huy hiệu.', 403);
        }
        $data = $request->validate(['isChampion' => 'required|boolean']);
        if (! $community->members()->where('users.id', $userId)->exists()) {
            return $this->fail('Người dùng chưa tham gia cộng đồng.', 404);
        }
        $community->members()->updateExistingPivot($userId, ['is_champion' => $data['isChampion']]);

        return $this->ok(['userId' => $userId, 'isChampion' => $data['isChampion']]);
    }

    public function setModerator(Request $request, int $id, int $userId)
    {
        $community = Community::where('is_public', true)->findOrFail($id);
        if ($request->user()->role !== 'Admin' && $community->creator_id !== $request->user()->id) {
            return $this->fail('Chỉ người tạo cộng đồng mới quản lý được vai trò.', 403);
        }
        $data = $request->validate(['isModerator' => 'required|boolean']);
        if (! $community->members()->where('users.id', $userId)->exists()) {
            return $this->fail('Người dùng chưa tham gia cộng đồng.', 404);
        }
        $community->members()->updateExistingPivot($userId, ['role' => $data['isModerator'] ? 'Moderator' : 'Member']);

        return $this->ok(['userId' => $userId, 'role' => $data['isModerator'] ? 'Moderator' : 'Member']);
    }

    private function canModerate(Community $community, Request $request): bool
    {
        return $request->user()->role === 'Admin' || $community->creator_id === $request->user()->id || $community->members()->where('users.id', $request->user()->id)->wherePivot('role', 'Moderator')->exists();
    }

    private function communityArray(Community $community, Request $request): array
    {
        $membership = $request->user() ? $community->members()->where('users.id', $request->user()->id)->first() : null;

        return ['id' => $community->id, 'name' => $community->name, 'slug' => $community->slug, 'topic' => $community->topic, 'description' => $community->description, 'icon' => $community->icon,
            'creatorId' => $community->creator_id, 'membersCount' => (int) ($community->members_count ?? $community->members()->count()),
            'postsCount' => (int) ($community->posts_count ?? $community->posts()->where('status', 'Published')->count()),
            'isMember' => (bool) $membership, 'myRole' => $membership?->pivot?->role, 'myFlair' => $membership?->pivot?->flair, 'isChampion' => (bool) ($membership?->pivot?->is_champion ?? false), 'canModerate' => $request->user() ? $this->canModerate($community, $request) : false];
    }
}
