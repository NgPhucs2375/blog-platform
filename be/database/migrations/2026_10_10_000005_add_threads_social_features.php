<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('slug', 140)->unique();
            $table->string('topic', 120)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(true);
            $table->timestamps();
            $table->index(['is_public', 'name']);
        });

        Schema::create('community_members', function (Blueprint $table) {
            $table->foreignId('community_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20)->default('Member');
            $table->timestamps();
            $table->primary(['community_id', 'user_id']);
        });

        Schema::create('custom_feeds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->json('filters');
            $table->boolean('is_public')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
        });

        Schema::table('posts', function (Blueprint $table) {
            $table->json('media')->nullable();
            $table->json('poll_options')->nullable();
            $table->timestamp('poll_ends_at')->nullable();
            $table->uuid('thread_id')->nullable()->index();
            $table->unsignedSmallInteger('thread_position')->default(0);
            $table->string('reply_permission', 20)->default('everyone');
            $table->string('quote_permission', 20)->default('everyone');
            $table->boolean('reply_approval')->default(false);
            $table->foreignId('community_id')->nullable()->constrained()->nullOnDelete();
        });

        Schema::create('poll_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('option_index');
            $table->timestamps();
            $table->unique(['post_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_votes');
        Schema::table('posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('community_id');
            $table->dropIndex(['thread_id']);
            $table->dropColumn(['media', 'poll_options', 'poll_ends_at', 'thread_id', 'thread_position', 'reply_permission', 'quote_permission', 'reply_approval']);
        });
        Schema::dropIfExists('custom_feeds');
        Schema::dropIfExists('community_members');
        Schema::dropIfExists('communities');
    }
};
