<?php

namespace App\Services;

use App\Models\ReaderControl;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ReaderContentFilter
{
    public function apply(Builder $posts, ?User $reader): Builder
    {
        if (! $reader) {
            return $posts;
        }

        $controls = ReaderControl::where('user_id', $reader->id)->get(['type', 'target_user_id', 'post_id', 'category_id']);
        $authors = $controls->whereIn('type', ['block', 'mute'])->pluck('target_user_id')->filter()->unique()->values();
        $hiddenPosts = $controls->where('type', 'hide_post')->pluck('post_id')->filter()->unique()->values();
        $lessCategories = $controls->where('type', 'less_category')->pluck('category_id')->filter()->unique()->values();

        if ($authors->isNotEmpty()) {
            $posts->whereNotIn('posts.author_id', $authors);
        }
        if ($hiddenPosts->isNotEmpty()) {
            $posts->whereNotIn('posts.id', $hiddenPosts);
        }
        if ($lessCategories->isNotEmpty()) {
            $placeholders = implode(',', array_fill(0, $lessCategories->count(), '?'));
            $posts->orderByRaw("CASE WHEN posts.category_id IN ({$placeholders}) THEN 1 ELSE 0 END", $lessCategories->all());
        }

        return $posts;
    }
}
