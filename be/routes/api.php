<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\ModerationRuleController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SystemLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::post('auth/logout', [AuthController::class, 'logout'])->middleware('api.auth');
    Route::post('auth/social/{provider}', [AuthController::class, 'social'])->whereIn('provider', ['google', 'github']);
    Route::get('auth/sessions', [AuthController::class, 'sessions'])->middleware('api.auth');
    Route::delete('auth/sessions/{id}', [AuthController::class, 'revokeSession'])->middleware('api.auth');

    Route::get('categories', [CategoryController::class, 'index']);
    Route::middleware(['api.auth', 'api.admin'])->group(function () {
        Route::post('categories', [CategoryController::class, 'store']);
        Route::put('categories/{id}', [CategoryController::class, 'update']);
        Route::delete('categories/{id}', [CategoryController::class, 'destroy']);
    });

    Route::get('posts', [PostController::class, 'index']);
    Route::get('posts/me', [PostController::class, 'mine'])->middleware('api.auth');
    Route::get('posts/{id}/manage', [PostController::class, 'manage'])->middleware('api.auth');
    Route::post('posts', [PostController::class, 'store'])->middleware('api.auth');
    Route::post('posts/{id}/view', [PostController::class, 'view']);
    Route::post('posts/{id}/approve', [PostController::class, 'approve'])->middleware(['api.auth', 'api.admin']);
    Route::get('posts/{id}', [PostController::class, 'show']);
    Route::put('posts/{id}', [PostController::class, 'update'])->middleware('api.auth');
    Route::delete('posts/{id}', [PostController::class, 'destroy'])->middleware('api.auth');

    Route::get('posts/{postId}/comments', [CommentController::class, 'index']);
    Route::get('posts/{postId}/comments/count', [CommentController::class, 'count']);
    Route::post('posts/{postId}/comments', [CommentController::class, 'store'])->middleware('api.auth');
    Route::post('comments/{id}/reply', [CommentController::class, 'reply'])->middleware('api.auth');
    Route::post('comments/{id}/approve', [CommentController::class, 'moderate'])->defaults('status', 'Approved')->middleware(['api.auth', 'api.admin']);
    Route::post('comments/{id}/hide', [CommentController::class, 'moderate'])->defaults('status', 'Hidden')->middleware(['api.auth', 'api.admin']);
    Route::delete('comments/{id}', [CommentController::class, 'destroy'])->middleware('api.auth');

    Route::middleware('api.auth')->group(function () {
        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::put('profile/password', [ProfileController::class, 'password']);
    });

    Route::middleware(['api.auth', 'api.admin'])->prefix('admin')->group(function () {
        Route::get('users', [AdminUserController::class, 'index']);
        Route::get('users/{id}', [AdminUserController::class, 'show']);
        Route::post('users', [AdminUserController::class, 'store']);
        Route::put('users/{id}/role', [AdminUserController::class, 'role']);
        Route::post('users/{id}/lock', [AdminUserController::class, 'lock']);
        Route::post('users/{id}/unlock', [AdminUserController::class, 'unlock']);
        Route::post('users/{id}/restore', [AdminUserController::class, 'restore']);
        Route::delete('users/{id}', [AdminUserController::class, 'destroy']);
        Route::post('users/bulk-lock', [AdminUserController::class, 'bulk'])->defaults('action', 'lock');
        Route::post('users/bulk-unlock', [AdminUserController::class, 'bulk'])->defaults('action', 'unlock');
        Route::post('users/bulk-delete', [AdminUserController::class, 'bulk'])->defaults('action', 'delete');
        Route::get('reports', [ReportController::class, 'index']);
        Route::get('logs', [SystemLogController::class, 'index']);
        Route::get('comments', [CommentController::class, 'admin']);
        Route::get('comments/stats', [CommentController::class, 'stats']);
        Route::get('moderation-rules', [ModerationRuleController::class, 'index']);
        Route::post('moderation-rules', [ModerationRuleController::class, 'store']);
        Route::post('moderation-rules/test', [ModerationRuleController::class, 'test']);
        Route::put('moderation-rules/{id}', [ModerationRuleController::class, 'update']);
        Route::patch('moderation-rules/{id}/toggle', [ModerationRuleController::class, 'toggle']);
        Route::delete('moderation-rules/{id}', [ModerationRuleController::class, 'destroy']);
    });
});

Route::get('health', fn () => response()->json(['success' => true, 'status_code' => 200, 'message' => 'Laravel API is healthy.', 'data' => ['database' => config('database.default')], 'timestamp' => now()->toISOString()]));
