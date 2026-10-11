<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->foreignId('category_id')->nullable()->change();
            $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
        });
    }

    public function down(): void
    {
        $fallbackId = DB::table('categories')->value('id');
        if (! $fallbackId) {
            $fallbackId = DB::table('categories')->insertGetId([
                'name' => 'Tổng hợp',
                'slug' => 'tong-hop',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        DB::table('posts')->whereNull('category_id')->update(['category_id' => $fallbackId]);

        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->foreignId('category_id')->nullable(false)->change();
            $table->foreign('category_id')->references('id')->on('categories')->restrictOnDelete();
        });
    }
};
