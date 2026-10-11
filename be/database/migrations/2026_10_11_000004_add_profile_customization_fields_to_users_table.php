<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('display_name', 120)->nullable();
            $table->json('interests')->nullable();
            $table->string('profile_link', 2048)->nullable();
            $table->string('podcast_url', 2048)->nullable();
            $table->string('instagram_url', 2048)->nullable();
            $table->boolean('show_instagram')->default(false);
            $table->boolean('show_views')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'display_name',
                'interests',
                'profile_link',
                'podcast_url',
                'instagram_url',
                'show_instagram',
                'show_views',
            ]);
        });
    }
};
