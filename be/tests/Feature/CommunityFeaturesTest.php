<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Category;
use App\Models\ModerationRule;
use App\Models\Post;
use App\Models\User;
use App\Notifications\BlogActivityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Tests\TestCase;

class CommunityFeaturesTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $role = 'User'): User
    {
        $name = Str::random(12);

        return User::create(['username' => $name, 'email' => $name.'@example.test', 'password' => 'test-password', 'role' => $role, 'status' => 'Active']);
    }

    private function asUser(User $user): void
    {
        $token = Str::random(40);
        ApiToken::create(['user_id' => $user->id, 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addHour()]);
        $this->withToken($token);
    }

    private function article(User $user): Post
    {
        $category = Category::create(['name' => 'Chuyên mục', 'slug' => Str::random(10)]);

        return Post::create(['author_id' => $user->id, 'category_id' => $category->id, 'title' => 'Bài viết', 'slug' => Str::random(12), 'content' => 'Nội dung', 'status' => 'Published']);
    }

    public function test_community_members_can_set_flair_and_moderators_can_review_posts(): void
    {
        $creator = $this->account();
        $member = $this->account();
        $this->asUser($creator);
        $community = $this->postJson('/api/v1/communities', ['name' => 'Cộng đồng '.Str::random(6), 'icon' => '📚'])->assertCreated()->json('data');

        $this->asUser($member);
        $this->postJson('/api/v1/communities/'.$community['id'].'/join')->assertOk();
        $this->putJson('/api/v1/communities/'.$community['id'].'/membership', ['flair' => 'Người yêu sách'])->assertOk();
        $this->asUser($creator);
        $this->putJson('/api/v1/communities/'.$community['id'].'/members/'.$member->id.'/champion', ['isChampion' => true])->assertOk();
        $this->putJson('/api/v1/communities/'.$community['id'].'/members/'.$member->id.'/moderator', ['isModerator' => true])->assertOk();

        $category = Category::create(['name' => 'Chủ đề '.Str::random(5), 'slug' => Str::random(10)]);
        $pending = Post::create(['author_id' => $member->id, 'category_id' => $category->id, 'community_id' => $community['id'], 'title' => 'Bài chờ duyệt', 'slug' => Str::random(12), 'content' => 'Nội dung', 'status' => 'Pending']);
        $this->asUser($member);
        $this->getJson('/api/v1/communities/'.$community['slug'].'/moderation')->assertOk()->assertJsonPath('data.0.id', $pending->id);
        $this->postJson('/api/v1/communities/'.$community['id'].'/posts/'.$pending->id.'/moderate', ['action' => 'approve'])->assertOk();
        self::assertSame('Published', $pending->fresh()->status);
    }

    public function test_notifications_are_private_and_read_state_persists(): void
    {
        $owner = $this->account();
        $other = $this->account();
        $post = $this->article($other);
        $owner->notify(new BlogActivityNotification($post));
        $id = $owner->notifications()->first()->id;
        $this->asUser($other);
        $this->getJson('/api/v1/notifications')->assertOk()->assertJsonPath('data.unreadCount', 0);
        $this->patchJson('/api/v1/notifications/'.$id.'/read')->assertNotFound();
        $this->asUser($owner);
        $this->getJson('/api/v1/notifications')->assertJsonPath('data.unreadCount', 1);
        $this->patchJson('/api/v1/notifications/'.$id.'/read')->assertOk();
        $this->getJson('/api/v1/notifications')->assertJsonPath('data.unreadCount', 0);
    }

    public function test_tags_require_admin_and_detect_generated_slug_collisions(): void
    {
        $this->asUser($this->account());
        $this->postJson('/api/v1/tags', ['name' => 'Công nghệ'])->assertForbidden();
        $this->asUser($this->account('Admin'));
        $tag = $this->postJson('/api/v1/tags', ['name' => 'Công nghệ'])->assertCreated()->json('data.id');
        $this->postJson('/api/v1/tags', ['name' => 'Cong nghe'])->assertUnprocessable();
        $this->putJson('/api/v1/tags/'.$tag, ['name' => 'Đời sống'])->assertOk()->assertJsonPath('data.slug', 'doi-song');
        $this->deleteJson('/api/v1/tags/'.$tag)->assertOk();
    }

    public function test_local_image_upload_is_readable_and_rejects_other_files(): void
    {
        Storage::fake('public');
        config(['filesystems.default' => 'local', 'filesystems.disks.r2.bucket' => null]);
        $this->asUser($this->account());
        $image = UploadedFile::fake()->image('cover.png');
        $response = $this->postJson('/api/v1/media', ['image' => $image])->assertCreated();
        Storage::disk('public')->assertExists($response->json('data.path'));
        $this->get($response->json('data.url'))->assertOk();
        $this->postJson('/api/v1/media', ['image' => UploadedFile::fake()->create('bad.txt', 1, 'text/plain')])->assertUnprocessable();
    }

    public function test_legacy_media_urls_serve_private_r2_objects_after_existing_files_are_copied(): void
    {
        Storage::fake('r2');
        config(['filesystems.disks.r2.bucket' => 'blog-media', 'filesystems.disks.r2.url' => 'https://cdn.example.test']);
        $path = 'blog/2026/10/123e4567-e89b-12d3-a456-426614174000.jpg';
        Storage::disk('r2')->put($path, 'image bytes');
        $response = $this->get('/api/v1/media/2026/10/123e4567-e89b-12d3-a456-426614174000.jpg')->assertOk();
        $this->assertSame('image bytes', $response->streamedContent());
    }

    public function test_author_can_submit_cover_and_tags_but_cannot_bypass_review(): void
    {
        Mail::fake();
        ModerationRule::create(['name' => 'Từ ngữ cần xem lại', 'pattern' => 'trigger-review', 'rule_type' => 'keyword', 'reason' => 'Nội dung cần kiểm tra', 'is_enabled' => true]);
        $author = $this->account();
        $this->asUser($author);
        $category = Category::create(['name' => 'Công nghệ', 'slug' => 'tech']);
        $post = $this->postJson('/api/v1/posts', ['title' => 'Bài mới', 'content' => 'trigger-review', 'categoryId' => $category->id, 'coverImage' => '/api/v1/media/2026/10/example.png', 'tags' => ['PHP', 'PHP'], 'status' => 'PUBLISHED'])->assertCreated()->assertJsonPath('data.status', 'pending')->assertJsonCount(1, 'data.tags')->json('data');
        $this->getJson('/api/v1/posts/'.$post['id'])->assertNotFound();
        $this->asUser($this->account('Admin'));
        $this->postJson('/api/v1/posts/'.$post['id'].'/approve')->assertOk();
        $this->asUser($author);
        $this->putJson('/api/v1/posts/'.$post['id'], ['content' => 'Nội dung sửa', 'status' => 'published', 'coverImage' => ''])->assertOk()->assertJsonPath('data.status', 'published')->assertJsonPath('data.coverImage', null);
        $this->asUser($this->account());
        $this->putJson('/api/v1/posts/'.$post['id'], ['title' => 'Không được'])->assertForbidden();
    }

    public function test_newsletter_confirmation_and_signed_unsubscribe(): void
    {
        Mail::fake();
        $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'reader@example.test'])->assertOk();
        $row = DB::table('newsletter_subscriptions')->first();
        $this->assertNull($row->confirmed_at);
        DB::table('newsletter_subscriptions')->where('id', $row->id)->update(['confirmation_token' => hash('sha256', 'confirm-test')]);
        $this->getJson('/api/v1/newsletter/confirm/confirm-test')->assertOk();
        $this->getJson('/api/v1/newsletter/confirm/confirm-test')->assertStatus(410);
        $this->postJson('/api/v1/newsletter/subscribe', ['email' => 'reader@example.test'])->assertOk();
        $this->assertNotNull(DB::table('newsletter_subscriptions')->first()->confirmed_at);
        $this->getJson('/api/v1/newsletter/unsubscribe/'.$row->unsubscribe_token)->assertForbidden();
        $this->getJson(URL::signedRoute('newsletter.unsubscribe', ['token' => $row->unsubscribe_token]))->assertOk();
        $this->assertDatabaseCount('newsletter_subscriptions', 0);
    }

    public function test_only_approved_comments_generate_notifications_and_likes_are_idempotent(): void
    {
        $author = $this->account();
        $reader = $this->account();
        $post = $this->article($author);
        $this->asUser($reader);
        $comment = $this->postJson('/api/v1/posts/'.$post->id.'/comments', ['content' => 'Rất hay'])->assertCreated()->json('data.id');
        $this->assertSame(1, $author->notifications()->count());
        $this->postJson('/api/v1/posts/'.$post->id.'/likes')->assertOk();
        $this->postJson('/api/v1/posts/'.$post->id.'/likes')->assertOk();
        $this->assertSame(2, $author->notifications()->count());
        $this->asUser($this->account('Admin'));
        $this->postJson('/api/v1/comments/'.$comment.'/approve')->assertOk();
        $this->postJson('/api/v1/comments/'.$comment.'/approve')->assertOk();
        $this->assertSame(2, $author->notifications()->count());
    }
}
