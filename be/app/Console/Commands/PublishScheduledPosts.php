<?php

namespace App\Console\Commands;

use App\Models\Post;
use App\Notifications\BlogActivityNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class PublishScheduledPosts extends Command
{
    protected $signature = 'posts:publish-scheduled';

    protected $description = 'Publish scheduled blog posts and announce them to readers.';

    public function handle(): int
    {
        Post::query()
            ->where('status', 'Scheduled')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->with('author')
            ->chunkById(100, function ($posts): void {
                foreach ($posts as $post) {
                    $updated = Post::whereKey($post->id)
                        ->where('status', 'Scheduled')
                        ->where('scheduled_at', '<=', now())
                        ->update(['status' => 'Published', 'published_at' => now()]);
                    if (! $updated) {
                        continue;
                    }

                    $post->refresh();
                    $post->author?->followers()->get()->each->notify(new BlogActivityNotification($post));
                    DB::table('newsletter_subscriptions')->whereNotNull('confirmed_at')->orderBy('id')->chunk(200, function ($subscribers) use ($post): void {
                        foreach ($subscribers as $subscriber) {
                            $url = rtrim((string) config('app.frontend_url', config('app.url')), '/').'/posts/'.$post->slug;
                            $unsubscribe = rtrim((string) config('app.url'), '/').'/api/v1/newsletter/unsubscribe/'.$subscriber->unsubscribe_token;
                            Mail::raw($post->title."\n\n".$post->excerpt."\n\nĐọc bài: ".$url."\nHủy nhận tin: ".$unsubscribe, fn ($message) => $message->to($subscriber->email)->subject('Bài viết mới: '.$post->title));
                        }
                    });
                    $this->info('Published: '.$post->slug);
                }
            });

        return self::SUCCESS;
    }
}
