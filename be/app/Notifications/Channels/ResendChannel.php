<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ResendChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $apiKey = (string) config('services.resend.key');
        $fromAddress = (string) config('services.resend.from');

        if ($apiKey === '') {
            throw new RuntimeException('The RESEND_API_KEY environment variable is not configured.');
        }

        if ($fromAddress === '') {
            throw new RuntimeException('The RESEND_FROM_ADDRESS environment variable is not configured.');
        }

        $fromName = (string) config('mail.from.name', 'Blog Platform');
        $message = $notification->toMail($notifiable);

        Http::withToken($apiKey)
            ->acceptJson()
            ->connectTimeout(5)
            ->timeout(10)
            ->post('https://api.resend.com/emails', [
                'from' => sprintf('%s <%s>', $fromName, $fromAddress),
                'to' => [$notifiable->routeNotificationFor('mail', $notification)],
                'subject' => $message->subject,
                'html' => (string) $message->render(),
            ])
            ->throw();
    }
}
