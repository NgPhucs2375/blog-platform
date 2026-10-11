<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_url', 1000)->nullable();
            $table->timestamp('email_verified_at')->nullable()->index();
            $table->string('github_id')->nullable()->unique();
        });
        Schema::table('posts', function (Blueprint $table) {
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->string('meta_title', 255)->nullable();
            $table->string('meta_description', 320)->nullable();
        });
        Schema::create('post_likes', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['user_id', 'post_id']);
        });
        Schema::create('bookmarks', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['user_id', 'post_id']);
        });
        Schema::create('user_follows', function (Blueprint $table) {
            $table->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('followed_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['follower_id', 'followed_id']);
        });
        Schema::create('post_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('visitor_hash', 64)->nullable()->index();
            $table->timestamp('viewed_at')->index();
            $table->index(['post_id', 'viewed_at']);
        });
        Schema::create('post_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 500);
            $table->longText('content');
            $table->text('excerpt')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['post_id', 'created_at']);
        });
        Schema::create('newsletter_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('email', 255)->unique();
            $table->string('confirmation_token', 64)->nullable()->unique();
            $table->string('unsubscribe_token', 64)->unique();
            $table->timestamp('confirmed_at')->nullable()->index();
            $table->timestamps();
        });
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamps();
            $table->index(['notifiable_type', 'notifiable_id', 'created_at'], 'notifications_owner_created_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('newsletter_subscriptions');
        Schema::dropIfExists('post_revisions');
        Schema::dropIfExists('post_views');
        Schema::dropIfExists('user_follows');
        Schema::dropIfExists('bookmarks');
        Schema::dropIfExists('post_likes');
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['scheduled_at', 'meta_title', 'meta_description']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar_url', 'email_verified_at', 'github_id']);
        });
    }
};
