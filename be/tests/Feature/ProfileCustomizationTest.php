<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileCustomizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_customize_fields_shown_on_their_public_profile(): void
    {
        $user = User::create([
            'username' => 'reader',
            'email' => 'reader@example.test',
            'password' => 'reader-password',
            'status' => 'Active',
            'role' => 'User',
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();
        $session = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'reader-password',
        ])->assertOk()->json('data');

        $this->withToken($session['access_token'])->putJson('/api/v1/profile', [
            'displayName' => 'Reader Name',
            'userName' => 'reader_name',
            'bio' => 'A short introduction.',
            'avatarUrl' => '/api/v1/media/blog/2026/10/avatar.jpg',
            'interests' => ['books', 'design'],
            'profileLink' => 'https://example.com',
            'podcastUrl' => 'https://example.com/podcast',
            'instagramUrl' => 'https://instagram.com/reader',
            'showInstagram' => true,
            'showViews' => true,
        ])->assertOk()
            ->assertJsonPath('data.displayName', 'Reader Name')
            ->assertJsonPath('data.avatarUrl', '/api/v1/media/blog/2026/10/avatar.jpg')
            ->assertJsonPath('data.interests.0', 'books')
            ->assertJsonPath('data.showInstagram', true);

        $this->getJson('/api/v1/authors/reader_name')
            ->assertOk()
            ->assertJsonPath('data.author.displayName', 'Reader Name')
            ->assertJsonPath('data.author.instagramUrl', 'https://instagram.com/reader')
            ->assertJsonPath('data.author.showViews', true);
    }
}
