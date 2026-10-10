<?php

namespace App\Http\Controllers\Api;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReportController extends ApiController
{
    public function index()
    {
        $posts = Post::query();
        $total = $posts->count();
        $published = (clone $posts)->where('status', 'Published')->count();
        $totalViews = (int) Post::sum('view_count');
        $engagements = (int) DB::table('post_likes')->count()
            + (int) DB::table('comments')->where('status', 'Approved')->count();
        $breakdown = Category::withCount(['posts as published_count' => fn ($q) => $q->where('status', 'Published')])->get();
        $totalPublished = max(1, $breakdown->sum('published_count'));
        $days = collect(range(6, 0))->map(fn ($offset) => now()->subDays($offset)->startOfDay());
        $viewCounts = DB::table('post_views')
            ->selectRaw('DATE(viewed_at) as view_date, COUNT(*) as total')
            ->where('viewed_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('view_date')
            ->pluck('total', 'view_date');

        return $this->ok([
            'totalViews' => $totalViews,
            'activeUsers' => User::where('status', 'Active')->count(),
            'totalPosts' => $total,
            'publishedPosts' => $published,
            'draftPosts' => (clone $posts)->whereIn('status', ['Draft', 'Pending'])->count(),
            'engagementRate' => $totalViews > 0 ? round($engagements * 100 / $totalViews, 2) : 0,
            'viewsTrend' => $days->map(fn ($day) => ['label' => $day->format('d/m'), 'count' => (int) ($viewCounts[$day->toDateString()] ?? 0)])->values(),
            'categoryBreakdown' => $breakdown->map(fn ($c) => ['name' => $c->name, 'count' => $c->published_count, 'percentage' => (int) round($c->published_count * 100 / $totalPublished), 'color' => '#0f766e'])->values(),
        ]);
    }
}
