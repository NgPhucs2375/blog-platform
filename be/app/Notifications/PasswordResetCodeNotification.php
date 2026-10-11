<?php

namespace App\Notifications;

use App\Notifications\Channels\BrevoChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetCodeNotification extends Notification
{
    public function __construct(public readonly string $code) {}

    public function via(object $notifiable): array
    {
        return [BrevoChannel::class];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Mã xác minh đặt lại mật khẩu Blog Platform')
            ->greeting('Xin chào '.($notifiable->username ?: 'bạn').'!')
            ->line('Nhập mã xác minh sau để đặt lại mật khẩu:')
            ->line($this->code)
            ->line('Mã có hiệu lực trong 10 phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.');
    }
}
