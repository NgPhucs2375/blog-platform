<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SocialFeedAndPostControlsTest extends TestCase
{
    use RefreshDatabase;

    private function account(): User
    {
        $name = Str::random(12);

        return User::create(['username' => $name, 'email' => $name.'@example.test', 'password' => 'test-password', 'role' => 'User', 'status' => 'Active']);
    }

    private function authenticate(User $user): void
    {
        $token = Str::random(40);
        ApiToken::create(['user_id' => $user->id, 'token_hash' => hash('sha256', $token), 'expires_at' => now()->addHour()]);
        $this->withToken($token);
    }

    private function article(User $author): Post
    {
        $category = Category::create(['name' => Str::random(10), 'slug' => Str::random(10)]);

        return Post::create(['author_id' => $author->id, 'category_id' => $category->id, 'title' => 'Bài viết', 'slug' => Str::random(12), 'content' => 'Nội dung', 'status' => 'Published', 'published_at' => now()]);
    }

    public function test_user_can_publish_a_post_without_a_category(): void
    {
        $author = $this->account();
        $this->authenticate($author);

        $this->postJson('/api/v1/posts', [
            'title' => 'Bài viết không chuyên mục',
            'content' => 'Nội dung bài viết không chọn chuyên mục.',
            'status' => 'published',
        ])
            ->assertCreated()
            ->assertJsonPath('data.categoryId', null);
    }

    public function test_reader_can_hide_posts_mute_authors_and_later_restore_them(): void
    {
        $reader = $this->account();
        $author = $this->account();
        $post = $this->article($author);
        $this->authenticate($reader);

        $this->getJson('/api/v1/posts')->assertOk()->assertJsonCount(1, 'data.posts');
        $controlId = $this->postJson('/api/v1/reader/controls', ['type' => 'mute', 'targetId' => $author->id])
            ->assertCreated()->json('data.id');
        $this->getJson('/api/v1/posts')->assertOk()->assertJsonCount(0, 'data.posts');
        $this->deleteJson('/api/v1/reader/controls/'.$controlId)->assertOk();
        $this->getJson('/api/v1/posts')->assertOk()->assertJsonCount(1, 'data.posts');

        $this->postJson('/api/v1/reader/controls', ['type' => 'hide_post', 'targetId' => $post->id])->assertCreated();
        $this->getJson('/api/v1/posts')->assertOk()->assertJsonCount(0, 'data.posts');
    }

    public function test_reader_can_see_less_of_a_category_without_hiding_it_entirely(): void
    {
        $reader = $this->account();
        $author = $this->account();
        $lessCategory = Category::create(['name' => 'Thời trang', 'slug' => Str::random(10)]);
        $otherCategory = Category::create(['name' => 'Công nghệ', 'slug' => Str::random(10)]);
        $lessPost = Post::create(['author_id' => $author->id, 'category_id' => $lessCategory->id, 'title' => 'Bài muốn giảm', 'slug' => Str::random(12), 'content' => 'Nội dung', 'status' => 'Published', 'published_at' => now()]);
        $otherPost = Post::create(['author_id' => $author->id, 'category_id' => $otherCategory->id, 'title' => 'Bài khác', 'slug' => Str::random(12), 'content' => 'Nội dung', 'status' => 'Published', 'published_at' => now()->subDay()]);
        $this->authenticate($reader);

        $this->postJson('/api/v1/reader/controls', ['type' => 'less_category', 'targetId' => $lessCategory->id])->assertCreated();
        $this->getJson('/api/v1/posts')->assertOk()->assertJsonCount(2, 'data.posts')->assertJsonPath('data.posts.0.id', $otherPost->id)->assertJsonPath('data.posts.1.id', $lessPost->id);
    }

    public function test_reader_can_save_a_default_feed_and_pinned_feed_ids(): void
    {
        $reader = $this->account();
        $this->authenticate($reader);
        $feed = $this->postJson('/api/v1/custom-feeds', ['name' => 'Công nghệ', 'filters' => ['tag' => 'cong-nghe']])->assertCreated()->json('data');

        $this->putJson('/api/v1/reader/preferences', ['defaultFeed' => 'custom-'.$feed['id'], 'pinnedFeedIds' => [$feed['id']]])
            ->assertOk()->assertJsonPath('data.defaultFeed', 'custom-'.$feed['id'])->assertJsonPath('data.pinnedFeedIds.0', $feed['id']);
        $this->getJson('/api/v1/reader/preferences')->assertOk()->assertJsonPath('data.pinnedFeedIds.0', $feed['id']);
    }

    public function test_public_custom_feed_can_be_discovered_and_opened_without_sign_in(): void
    {
        $author = $this->account();
        $category = Category::create(['name' => Str::random(10), 'slug' => Str::random(10)]);
        Post::create(['author_id' => $author->id, 'category_id' => $category->id, 'title' => 'Bài công khai', 'slug' => Str::random(12), 'content' => 'Nội dung', 'status' => 'Published', 'published_at' => now()]);
        $this->authenticate($author);
        $feed = $this->postJson('/api/v1/custom-feeds', ['name' => 'Bài mới', 'filters' => ['categoryId' => $category->id], 'isPublic' => true])->assertCreated()->json('data');

        $this->flushHeaders();
        $this->getJson('/api/v1/custom-feeds/public')->assertOk()->assertJsonPath('data.data.0.id', $feed['id']);
        $this->getJson('/api/v1/custom-feeds/'.$feed['id'].'/posts')->assertOk()->assertJsonPath('data.posts.0.title', 'Bài công khai');
    }

    public function test_following_feed_only_returns_posts_from_followed_authors(): void
    {
        $reader = $this->account();
        $followed = $this->account();
        $unfollowed = $this->account();
        $wanted = $this->article($followed);
        $this->article($unfollowed);
        $reader->following()->attach($followed->id);
        $this->authenticate($reader);

        $this->getJson('/api/v1/feed/following')
            ->assertOk()
            ->assertJsonCount(1, 'data.posts')
            ->assertJsonPath('data.posts.0.id', $wanted->id);
    }

    public function test_author_can_limit_replies_to_followers_and_enable_reply_approval(): void
    {
        $author = $this->account();
        $follower = $this->account();
        $reader = $this->account();
        $post = $this->article($author);
        $this->authenticate($author);
        $this->putJson('/api/v1/posts/'.$post->id.'/controls', [
            'replyPermission' => 'followers',
            'quotePermission' => 'followers',
            'replyApproval' => true,
        ])->assertOk();

        $this->authenticate($reader);
        $this->postJson('/api/v1/posts/'.$post->id.'/comments', ['content' => 'Bình luận không được phép'])->assertForbidden();
        $this->postJson('/api/v1/posts/'.$post->id.'/quote', ['commentary' => 'Trích dẫn không được phép'])->assertForbidden();

        $author->followers()->attach($follower->id);
        $this->authenticate($follower);
        $commentId = $this->postJson('/api/v1/posts/'.$post->id.'/comments', ['content' => 'Bình luận chờ duyệt'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->json('data.id');

        $this->authenticate($author);
        $this->getJson('/api/v1/posts/'.$post->id.'/comments/pending')->assertOk()->assertJsonPath('data.0.id', $commentId);
        $this->postJson('/api/v1/posts/'.$post->id.'/comments/'.$commentId.'/approve')->assertOk()->assertJsonPath('data.status', 'approved');
        $this->getJson('/api/v1/posts/'.$post->id.'/comments')->assertJsonPath('data.0.id', $commentId);
    }

    public function test_regular_post_replies_are_immediately_visible_without_approval(): void
    {
        $author = $this->account();
        $reader = $this->account();
        $post = $this->article($author);
        $this->authenticate($reader);

        $comment = $this->postJson('/api/v1/posts/'.$post->id.'/comments', ['content' => 'Bình luận bình thường'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'approved')
            ->json('data.id');

        $this->getJson('/api/v1/posts/'.$post->id.'/comments')->assertJsonPath('data.0.id', $comment);
    }

    public function test_comments_can_include_an_image_or_be_image_only(): void
    {
        $author = $this->account();
        $reader = $this->account();
        $post = $this->article($author);
        $this->authenticate($reader);

        $this->postJson('/api/v1/posts/'.$post->id.'/comments', [
            'content' => 'Xem tấm hình này',
            'imageUrl' => '/api/v1/media/2026/10/example.png',
        ])->assertCreated()->assertJsonPath('data.content', 'Xem tấm hình này')->assertJsonPath('data.imageUrl', '/api/v1/media/2026/10/example.png');

        $imageOnly = $this->postJson('/api/v1/posts/'.$post->id.'/comments', [
            'imageUrl' => '/api/v1/media/2026/10/another.png',
        ])->assertCreated()->assertJsonPath('data.content', '')->assertJsonPath('data.imageUrl', '/api/v1/media/2026/10/another.png')->json('data.id');

        $this->postJson('/api/v1/posts/'.$post->id.'/comments', [])->assertUnprocessable();
        $this->getJson('/api/v1/posts/'.$post->id.'/comments')->assertJsonPath('data.1.id', $imageOnly)->assertJsonPath('data.1.imageUrl', '/api/v1/media/2026/10/another.png');
    }

    public function test_reader_can_create_join_and_publish_to_a_community(): void
    {
        $author = $this->account();
        $category = Category::create(['name' => 'Community topic', 'slug' => 'community-topic']);
        $this->authenticate($author);
        $community = $this->postJson('/api/v1/communities', ['name' => 'Những người mê sách', 'topic' => 'Sách', 'description' => 'Trao đổi về sách.'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'nhung-nguoi-me-sach')
            ->json('data');

        $reader = $this->account();
        $this->authenticate($reader);
        $this->postJson('/api/v1/communities/'.$community['id'].'/join')->assertOk()->assertJsonPath('data.isMember', true);
        $post = $this->postJson('/api/v1/posts', ['title' => 'Sách hay', 'content' => 'Một trao đổi về sách.', 'categoryId' => $category->id, 'communityId' => $community['id'], 'status' => 'published'])
            ->assertCreated()
            ->assertJsonPath('data.community.slug', 'nhung-nguoi-me-sach')
            ->json('data');

        $this->getJson('/api/v1/communities/nhung-nguoi-me-sach/posts')->assertOk()->assertJsonPath('data.posts.0.id', $post['id']);
    }

    public function test_author_can_publish_a_thread_and_readers_can_vote_in_a_poll(): void
    {
        $author = $this->account();
        $reader = $this->account();
        $category = Category::create(['name' => 'Trao đổi', 'slug' => 'trao-doi']);
        $this->authenticate($author);
        $thread = $this->postJson('/api/v1/posts/thread', [
            'categoryId' => $category->id,
            'items' => [['content' => 'Bài đầu trong chuỗi.'], ['content' => 'Bài tiếp theo.']],
        ])->assertCreated()->assertJsonCount(2, 'data.posts')->json('data.posts');
        self::assertSame($thread[0]['threadId'], $thread[1]['threadId']);
        self::assertSame([0, 1], array_column($thread, 'threadPosition'));
        $this->getJson('/api/v1/posts')->assertOk()->assertJsonCount(1, 'data.posts');

        $poll = $this->postJson('/api/v1/posts', [
            'title' => 'Khảo sát', 'content' => 'Bạn chọn gì?', 'categoryId' => $category->id,
            'pollOptions' => ['PHP', 'TypeScript'], 'status' => 'published',
        ])->assertCreated()->json('data');
        $this->authenticate($reader);
        $this->postJson('/api/v1/posts/'.$poll['id'].'/poll-votes', ['optionIndex' => 1])
            ->assertOk()->assertJsonPath('data.myVote', 1)->assertJsonPath('data.voteCounts.1', 1);
        $this->postJson('/api/v1/posts/'.$poll['id'].'/poll-votes', ['optionIndex' => 0])->assertStatus(409);
    }

    public function test_posts_with_tags_can_be_filtered_by_hashtag(): void
    {
        $author = $this->account();
        $this->authenticate($author);

        $post = $this->postJson('/api/v1/posts', [
            'title' => 'Chia sẻ về Laravel',
            'content' => 'Một bài viết có hashtag #Laravel.',
            'tags' => ['Laravel'],
            'status' => 'published',
        ])->assertCreated()->assertJsonPath('data.category', null)->assertJsonPath('data.tags.0.slug', 'laravel')->json('data.id');

        $this->getJson('/api/v1/posts?tag=laravel')->assertOk()->assertJsonPath('data.posts.0.id', $post);
    }

    public function test_thread_can_be_published_without_an_admin_created_category(): void
    {
        $author = $this->account();
        $this->authenticate($author);

        $this->postJson('/api/v1/posts/thread', [
            'items' => [['content' => 'Bài mở đầu #TựHọc'], ['content' => 'Bài tiếp theo']],
            'tags' => ['Tự học'],
        ])->assertCreated()->assertJsonCount(2, 'data.posts')->assertJsonPath('data.posts.0.category', null)->assertJsonPath('data.posts.0.tags.0.slug', 'tu-hoc');
    }

    public function test_custom_feed_filters_posts_and_insights_return_daily_metrics(): void
    {
        $author = $this->account();
        $reader = $this->account();
        $selectedCategory = Category::create(['name' => 'Thiết kế', 'slug' => 'thiet-ke']);
        $otherCategory = Category::create(['name' => 'Du lịch', 'slug' => 'du-lich']);
        $selected = Post::create(['author_id' => $author->id, 'category_id' => $selectedCategory->id, 'title' => 'Thiết kế', 'slug' => 'thiet-ke-1', 'content' => 'Thiết kế sản phẩm.', 'status' => 'Published', 'published_at' => now()]);
        Post::create(['author_id' => $author->id, 'category_id' => $otherCategory->id, 'title' => 'Du lịch', 'slug' => 'du-lich-1', 'content' => 'Một chuyến đi.', 'status' => 'Published', 'published_at' => now()]);
        $this->authenticate($reader);
        $feedId = $this->postJson('/api/v1/custom-feeds', ['name' => 'Thiết kế', 'filters' => ['categoryId' => $selectedCategory->id]])
            ->assertCreated()->json('data.id');
        $this->getJson('/api/v1/custom-feeds/'.$feedId.'/posts')->assertOk()->assertJsonCount(1, 'data.posts')->assertJsonPath('data.posts.0.id', $selected->id);

        $this->authenticate($author);
        $this->getJson('/api/v1/insights?days=7')->assertOk()->assertJsonPath('data.days', 7)->assertJsonCount(7, 'data.daily');
    }
}
