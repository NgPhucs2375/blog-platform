<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_url', config('app.url')), '/')
            .'/reset-password?'.http_build_query([
                'token' => $this->token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ]);
        $expiryMinutes = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject('Yêu cầu đặt lại mật khẩu')
            ->greeting('Xin chào '.($notifiable->username ?: 'bạn').'!')
            ->line('Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Blog Platform của bạn.')
            ->action('Đặt lại mật khẩu', $url)
            ->line("Liên kết này có hiệu lực trong {$expiryMinutes} phút.")
            ->line('Nếu bạn không yêu cầu thay đổi mật khẩu, hãy bỏ qua email này.');
    }
}