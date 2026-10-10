<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use App\Notifications\EmailVerificationCodeNotification;
use App\Notifications\PasswordResetCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BlogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_responses_include_security_headers(): void
    {
        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    public function test_public_categories_and_published_posts_are_returned_in_frontend_shape(): void
    {
        $author = User::create(['username' => 'writer', 'email' => 'writer@example.test', 'password' => 'test-password', 'role' => 'User', 'status' => 'Active']);
        $category = Category::create(['name' => 'Công nghệ', 'slug' => 'cong-nghe']);
        Post::create(['title' => 'Bài kiểm tra', 'slug' => 'bai-kiem-tra', 'content' => 'Nội dung', 'author_id' => $author->id, 'category_id' => $category->id, 'status' => 'Published', 'published_at' => now()]);

        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'cong-nghe');

        $this->getJson('/api/v1/posts')
            ->assertOk()
            ->assertJsonPath('data.posts.0.title', 'Bài kiểm tra')
            ->assertJsonPath('data.posts.0.author.userName', 'writer');
    }

    public function test_registration_and_bearer_authentication_match_frontend_contract(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/auth/register', ['userName' => 'reader', 'email' => 'reader@example.test', 'password' => 'reader-password'])
            ->assertCreated()
            ->assertJsonPath('data.userId', 1)
            ->assertJsonPath('data.email', 'reader@example.test');

        $user = User::where('email', 'reader@example.test')->firstOrFail();
        $code = null;
        Notification::assertSentTo($user, EmailVerificationCodeNotification::class, function (EmailVerificationCodeNotification $notification) use (&$code): bool {
            $code = $notification->code;

            return true;
        });

        $this->postJson('/api/v1/auth/login', ['email' => 'reader@example.test', 'password' => 'reader-password'])
            ->assertForbidden()
            ->assertJsonPath('data.emailVerified', false);
        $this->postJson('/api/v1/auth/email/verify-code', ['email' => $user->email, 'code' => '000000'])
            ->assertUnprocessable();
        $this->postJson('/api/v1/auth/email/verify-code', ['email' => $user->email, 'code' => $code])
            ->assertOk()
            ->assertJsonPath('data.verified', true);
        $this->postJson('/api/v1/auth/email/verify-code', ['email' => $user->email, 'code' => $code])
            ->assertUnprocessable();

        $login = $this->postJson('/api/v1/auth/login', ['email' => 'reader@example.test', 'password' => 'reader-password'])
            ->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.userName', 'reader');

        $token = $login->json('data.access_token');
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJsonPath('data.email', 'reader@example.test');
    }

    public function test_password_reset_sends_code_and_resets_password(): void
    {
        Notification::fake();

        $user = User::create(['username' => 'reader', 'email' => 'reader@example.test', 'password' => 'old-password', 'role' => 'User', 'status' => 'Active']);

        $this->postJson('/api/v1/auth/password/forgot', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath('success', true);

        $code = null;
        Notification::assertSentTo($user, PasswordResetCodeNotification::class, function (PasswordResetCodeNotification $notification) use (&$code): bool {
            $code = $notification->code;

            return true;
        });

        $this->postJson('/api/v1/auth/password/reset', [
            'email' => $user->email,
            'code' => $code,
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])->assertOk()->assertJsonPath('success', true);

        self::assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_password_reset_code_is_single_use_and_rejects_invalid_codes(): void
    {
        Notification::fake();
        $user = User::create(['username' => 'reader', 'email' => 'reader@example.test', 'password' => 'old-password', 'role' => 'User', 'status' => 'Active']);
        $this->postJson('/api/v1/auth/password/forgot', ['email' => $user->email])->assertOk();
        $code = null;
        Notification::assertSentTo($user, PasswordResetCodeNotification::class, function (PasswordResetCodeNotification $notification) use (&$code): bool {
            $code = $notification->code;

            return true;
        });
        $payload = ['email' => $user->email, 'code' => '000000', 'password' => 'new-password-123', 'password_confirmation' => 'new-password-123'];
        $this->postJson('/api/v1/auth/password/reset', $payload)->assertUnprocessable();
        $payload['code'] = $code;
        $this->postJson('/api/v1/auth/password/reset', $payload)->assertOk();
        $this->postJson('/api/v1/auth/password/reset', $payload)->assertUnprocessable();
    }

    public function test_password_reset_request_does_not_reveal_unknown_email(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/password/forgot', ['email' => 'unknown@example.test'])
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_google_login_reports_missing_server_client_id(): void
    {
        config(['services.google.client_id' => '']);

        $this->postJson('/api/v1/auth/social/google', ['credential' => 'not-a-real-token'])
            ->assertServiceUnavailable()
            ->assertJsonPath('success', false);
    }

    public function test_google_login_requires_an_id_token_credential(): void
    {
        config(['services.google.client_id' => 'test-client-id']);

        $this->postJson('/api/v1/auth/social/google', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('credential');
    }
}
