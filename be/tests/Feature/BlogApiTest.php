<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlogApiTest extends TestCase
{
    use RefreshDatabase;

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
        $this->postJson('/api/v1/auth/register', ['userName' => 'reader', 'email' => 'reader@example.test', 'password' => 'reader-password'])
            ->assertCreated()
            ->assertJsonPath('data.userId', 1);

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
