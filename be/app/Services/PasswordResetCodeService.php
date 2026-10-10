<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class PasswordResetCodeService
{
    private const TTL_MINUTES = 10;

    private const MAX_ATTEMPTS = 5;

    public function send(string $email): string
    {
        $email = mb_strtolower(trim($email));
        $code = (string) random_int(100000, 999999);
        Cache::put($this->key($email), [
            'hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(self::TTL_MINUTES)->timestamp,
        ], now()->addMinutes(self::TTL_MINUTES));

        return $code;
    }

    public function verify(string $email, string $code): bool
    {
        $email = mb_strtolower(trim($email));
        $key = $this->key($email);
        $record = Cache::get($key);
        if (! is_array($record) || ($record['attempts'] ?? self::MAX_ATTEMPTS) >= self::MAX_ATTEMPTS) {
            Cache::forget($key);

            return false;
        }

        if (! Hash::check($code, $record['hash'] ?? '')) {
            $record['attempts'] = ($record['attempts'] ?? 0) + 1;
            Cache::put($key, $record, max(1, ($record['expires_at'] ?? now()->timestamp) - now()->timestamp));

            return false;
        }

        return true;
    }

    public function forget(string $email): void
    {
        Cache::forget($this->key(mb_strtolower(trim($email))));
    }

    private function key(string $email): string
    {
        return 'password-reset-code:'.hash('sha256', $email);
    }
}
