<?php

namespace App\Notifications;

use App\Notifications\Channels\ResendChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerificationCodeNotification extends Notification
{
    public function __construct(public readonly string $code) {}

    public function via(object $notifiable): array
    {
        return [ResendChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject('Mã xác minh email Blog Platform')
            ->greeting('Xin chào '.($notifiable->username ?: 'bạn').'!')
            ->line('Nhập mã xác minh sau để xác nhận bạn có quyền truy cập email này:')
            ->line($this->code)->line('Mã có hiệu lực trong 10 phút. Nếu bạn không đăng ký, hãy bỏ qua email này.');
    }
}
