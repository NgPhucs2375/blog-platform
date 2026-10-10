<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class ResendAuthMailTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.resend.key' => 're_test_key',
            'services.resend.from' => 'onboarding@resend.dev',
            'mail.from.name' => 'Blog Platform',
        ]);
        Http::preventStrayRequests();
    }

    public function test_registration_sends_a_usable_verification_code_over_https(): void
    {
        Http::fake(['https://api.resend.com/emails' => Http::response(['id' => 'email-1'])]);
        $this->registerReader()->assertCreated();

        $request = Http::recorded()->last()[0];
        self::assertSame('POST', $request->method());
        self::assertTrue($request->hasHeader('Authorization', 'Bearer re_test_key'));
        self::assertSame(['reader@example.test'], $request['to']);
        self::assertSame('Blog Platform <onboarding@resend.dev>', $request['from']);
        self::assertSame('Mã xác minh email Blog Platform', $request['subject']);

        $this->postJson('/api/v1/auth/email/verify-code', [
            'email' => 'reader@example.test',
            'code' => $this->lastSentCode(),
        ])->assertOk()->assertJsonPath('data.verified', true);
        Http::assertSentCount(1);
    }

    public function test_failed_delivery_can_be_retried_without_registering_again(): void
    {
        Http::fake(['https://api.resend.com/emails' => Http::sequence()
            ->push(['message' => 'Sender domain is not verified'], 403)
            ->push(['id' => 'email-2'])]);

        $this->registerReader()->assertServiceUnavailable();
        $this->assertDatabaseCount('users', 1);
        $this->postJson('/api/v1/auth/email/verify-code', [
            'email' => 'reader@example.test',
            'code' => $this->lastSentCode(),
        ])->assertUnprocessable();

        $this->postJson('/api/v1/auth/email/resend-code', ['email' => 'reader@example.test'])->assertOk();
        $this->postJson('/api/v1/auth/email/verify-code', [
            'email' => 'reader@example.test',
            'code' => $this->lastSentCode(),
        ])->assertOk();
        Http::assertSentCount(2);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_password_reset_code_sent_over_https_resets_the_password(): void
    {
        Http::fake(['https://api.resend.com/emails' => Http::response(['id' => 'email-3'])]);
        $this->registerReader()->assertCreated();
        $this->postJson('/api/v1/auth/password/forgot', ['email' => 'reader@example.test'])->assertOk();

        $request = Http::recorded()->last()[0];
        self::assertSame('Mã xác minh đặt lại mật khẩu Blog Platform', $request['subject']);
        $this->postJson('/api/v1/auth/password/reset', [
            'email' => 'reader@example.test',
            'code' => $this->lastSentCode(),
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertOk();
        self::assertTrue(Hash::check('new-password-123', User::where('email', 'reader@example.test')->firstOrFail()->password));
    }

    private function registerReader(): TestResponse
    {
        return $this->postJson('/api/v1/auth/register', [
            'userName' => 'reader',
            'email' => 'reader@example.test',
            'password' => 'reader-password',
        ]);
    }

    private function lastSentCode(): string
    {
        $html = Http::recorded()->last()[0]['html'];
        self::assertSame(1, preg_match('/>\s*(\d{6})\s*</', $html, $matches));

        return $matches[1];
    }
}
