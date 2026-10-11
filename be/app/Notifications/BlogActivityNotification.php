<?php

namespace App\Notifications;

use App\Models\Post;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BlogActivityNotification extends Notification
{
    use Queueable;

    public function __construct(public Post $post, public string $activity = 'published') {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_url', config('app.url')), '/').'/posts/'.$this->post->slug;

        return (new MailMessage)
            ->subject('Bài viết mới: '.$this->post->title)
            ->greeting('Xin chào!')
            ->line($this->post->author?->username.' vừa đăng bài viết mới.')
            ->action('Đọc bài viết', $url);
    }

    public function toArray(object $notifiable): array
    {
        return ['activity' => $this->activity, 'message' => match ($this->activity) {
            'comment' => 'Có bình luận mới trên bài viết',
            'reply' => 'Có phản hồi cho bình luận của bạn',
            'like' => 'Bài viết của bạn vừa được yêu thích',
            'repost' => 'Bài viết của bạn vừa được đăng lại',
            'quote' => 'Bài viết của bạn vừa được trích dẫn',
            'approved' => 'Bài viết của bạn đã được duyệt',
            default => 'Tác giả bạn theo dõi vừa đăng bài mới',
        }, 'postId' => $this->post->id, 'slug' => $this->post->slug, 'title' => $this->post->title, 'authorId' => $this->post->author_id, 'createdAt' => now()->toISOString()];
    }
}
