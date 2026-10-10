<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reader_controls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 24);
            $table->foreignId('target_user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('post_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->index(['user_id', 'type']);
        });

        Schema::create('reader_feed_settings', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('default_feed', 100)->default('discover');
            $table->json('pinned_feed_ids')->nullable();
            $table->timestamps();
        });

        Schema::table('communities', function (Blueprint $table) {
            $table->string('icon', 16)->nullable();
        });

        Schema::table('community_members', function (Blueprint $table) {
            $table->string('flair', 40)->nullable();
            $table->boolean('is_champion')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('community_members', function (Blueprint $table) {
            $table->dropColumn(['flair', 'is_champion']);
        });
        Schema::table('communities', fn (Blueprint $table) => $table->dropColumn('icon'));
        Schema::dropIfExists('reader_feed_settings');
        Schema::dropIfExists('reader_controls');
    }
};
