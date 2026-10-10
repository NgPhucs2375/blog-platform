<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class BrevoChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $apiKey = (string) config('services.brevo.api_key');
        $fromAddress = (string) config('services.brevo.from_email');

        if ($apiKey === '') {
            throw new RuntimeException('The BREVO_API_KEY environment variable is not configured.');
        }

        if ($fromAddress === '') {
            throw new RuntimeException('The BREVO_FROM_EMAIL environment variable is not configured.');
        }

        $fromName = (string) config('services.brevo.from_name', 'Blog Platform');
        $message = $notification->toMail($notifiable);

        Http::withHeaders(['api-key' => $apiKey])
            ->acceptJson()
            ->connectTimeout(5)
            ->timeout(10)
            ->post('https://api.brevo.com/v3/smtp/email', [
                'sender' => ['name' => $fromName, 'email' => $fromAddress],
                'to' => [['email' => $notifiable->routeNotificationFor('mail', $notification)]],
                'subject' => $message->subject,
                'htmlContent' => (string) $message->render(),
            ])
            ->throw();
    }
}
