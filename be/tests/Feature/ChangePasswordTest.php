<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    private function account(): User
    {
        $user = User::create(['username' => 'reader', 'email' => 'reader@example.test', 'password' => 'old-password', 'status' => 'Active', 'role' => 'User']);
        $user->forceFill(['email_verified_at' => now()])->save();

        return $user;
    }

    private function login(User $user): array
    {
        return $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'old-password'])->assertOk()->json('data');
    }

    public function test_change_requires_authentication(): void
    {
        $this->putJson('/api/v1/profile/password', [])->assertUnauthorized();
    }

    #[DataProvider('invalidPasswords')]
    public function test_invalid_passwords_preserve_password_and_session(array $payload): void
    {
        $user = $this->account();
        $session = $this->login($user);
        $this->withToken($session['access_token'])->putJson('/api/v1/profile/password', $payload)->assertUnprocessable();
        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
        $this->getJson('/api/v1/profile')->assertOk();
        $this->assertDatabaseHas('refresh_tokens', ['user_id' => $user->id, 'revoked_at' => null]);
    }

    public static function invalidPasswords(): array
    {
        return [
            'wrong current' => [['currentPassword' => 'wrong-password', 'newPassword' => 'new-password', 'newPassword_confirmation' => 'new-password']],
            'mismatch' => [['currentPassword' => 'old-password', 'newPassword' => 'new-password', 'newPassword_confirmation' => 'another-password']],
            'missing confirmation' => [['currentPassword' => 'old-password', 'newPassword' => 'new-password']],
            'short' => [['currentPassword' => 'old-password', 'newPassword' => 'short', 'newPassword_confirmation' => 'short']],
            'same password' => [['currentPassword' => 'old-password', 'newPassword' => 'old-password', 'newPassword_confirmation' => 'old-password']],
        ];
    }

    public function test_password_change_revokes_all_sessions_and_reset_links(): void
    {
        $user = $this->account();
        $first = $this->login($user);
        $second = $this->login($user);
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => 'old-reset-token', 'created_at' => now()]);
        $this->withToken($first['access_token'])->putJson('/api/v1/profile/password', [
            'currentPassword' => 'old-password', 'newPassword' => 'new-password', 'newPassword_confirmation' => 'new-password',
        ])->assertOk();
        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
        $this->assertDatabaseMissing('api_tokens', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('refresh_tokens', ['user_id' => $user->id, 'revoked_at' => null]);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
        foreach ([$first, $second] as $session) {
            $this->withToken($session['access_token'])->getJson('/api/v1/profile')->assertUnauthorized();
            $this->postJson('/api/v1/auth/refresh', ['refresh_token' => $session['refresh_token']])->assertUnauthorized();
        }
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'old-password'])->assertUnauthorized();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'new-password'])->assertOk();
    }

    public function test_password_attempts_are_rate_limited(): void
    {
        $session = $this->login($this->account());
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->withToken($session['access_token'])->putJson('/api/v1/profile/password', [])->assertUnprocessable();
        }
        $this->putJson('/api/v1/profile/password', [])->assertStatus(429);
    }
}
