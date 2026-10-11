<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification
{
    public function __construct(private string $url) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Xác minh email Blog Platform')
            ->greeting('Xin chào!')
            ->line('Vui lòng xác minh địa chỉ email để bảo vệ tài khoản của bạn.')
            ->action('Xác minh email', $this->url)
            ->line('Liên kết có hiệu lực trong một giờ.');
    }
}
