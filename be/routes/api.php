<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuthorController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\EmailVerificationController;
use App\Http\Controllers\Api\FeedController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\ModerationRuleController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReaderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SystemLogController;
use App\Http\Controllers\Api\TagController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('auth/email/verify-code', [EmailVerificationController::class, 'verifyCode'])->middleware('throttle:10,1');
    Route::post('auth/email/resend-code', [EmailVerificationController::class, 'resend'])->middleware('throttle:3,10');
    Route::post('auth/password/forgot', [PasswordResetController::class, 'send'])->middleware('throttle:5,1');
    Route::post('auth/password/reset', [PasswordResetController::class, 'reset'])->middleware('throttle:5,1');
    Route::get('auth/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])->middleware(['signed', 'throttle:6,1'])->name('api.auth.email.verify');
    Route::post('newsletter/subscribe', [NewsletterController::class, 'subscribe'])->middleware('throttle:5,1');
    Route::get('newsletter/confirm/{token}', [NewsletterController::class, 'confirm'])->middleware('throttle:10,1');
    Route::get('newsletter/unsubscribe/{token}', [NewsletterController::class, 'unsubscribe'])->middleware(['signed', 'throttle:10,1'])->name('newsletter.unsubscribe');
    Route::get('tags', [TagController::class, 'index']);
    Route::get('authors/{username}', [AuthorController::class, 'show'])->middleware('api.optional-auth');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::post('auth/logout', [AuthController::class, 'logout'])->middleware('api.auth');
    Route::post('auth/social/{provider}', [AuthController::class, 'social'])->whereIn('provider', ['google', 'github']);
    Route::get('auth/sessions', [AuthController::class, 'sessions'])->middleware('api.auth');
    Route::delete('auth/sessions/{id}', [AuthController::class, 'revokeSession'])->middleware('api.auth');

    Route::get('categories', [CategoryController::class, 'index']);
    Route::get('communities', [CommunityController::class, 'index'])->middleware('api.optional-auth');
    Route::get('communities/{slug}/posts', [CommunityController::class, 'posts'])->middleware('api.optional-auth');
    Route::get('communities/{slug}/moderation', [CommunityController::class, 'moderationQueue'])->middleware('api.auth');
    Route::get('communities/{slug}', [CommunityController::class, 'show'])->middleware('api.optional-auth');
    Route::middleware('api.auth')->group(function () {
        Route::post('communities', [CommunityController::class, 'store']);
        Route::post('communities/{id}/join', [CommunityController::class, 'join']);
        Route::delete('communities/{id}/join', [CommunityController::class, 'leave']);
        Route::put('communities/{id}/membership', [CommunityController::class, 'updateMembership']);
        Route::get('communities/{id}/members', [CommunityController::class, 'membersForModeration']);
        Route::put('communities/{id}', [CommunityController::class, 'update']);
        Route::post('communities/{id}/posts/{postId}/moderate', [CommunityController::class, 'moderatePost']);
        Route::put('communities/{id}/members/{userId}/champion', [CommunityController::class, 'setChampion']);
        Route::put('communities/{id}/members/{userId}/moderator', [CommunityController::class, 'setModerator']);
    });
    Route::middleware(['api.auth', 'api.admin'])->group(function () {
        Route::post('tags', [TagController::class, 'store']);
        Route::put('tags/{id}', [TagController::class, 'update']);
        Route::delete('tags/{id}', [TagController::class, 'destroy']);
        Route::post('categories', [CategoryController::class, 'store']);
        Route::put('categories/{id}', [CategoryController::class, 'update']);
        Route::delete('categories/{id}', [CategoryController::class, 'destroy']);
    });

    Route::get('posts', [PostController::class, 'index'])->middleware('api.optional-auth');
    Route::get('feed/following', [FeedController::class, 'following'])->middleware('api.auth');
    Route::get('custom-feeds/public', [FeedController::class, 'publicCustomFeeds'])->middleware('api.optional-auth');
    Route::get('custom-feeds/{id}/posts', [FeedController::class, 'customFeedPosts'])->middleware('api.optional-auth');
    Route::get('posts/liked', [FeedController::class, 'liked'])->middleware('api.auth');
    Route::get('insights', [FeedController::class, 'insights'])->middleware('api.auth');
    Route::middleware('api.auth')->group(function () {
        Route::get('reader/preferences', [ReaderController::class, 'preferences']);
        Route::put('reader/preferences', [ReaderController::class, 'updatePreferences']);
        Route::get('reader/controls', [ReaderController::class, 'controls']);
        Route::post('reader/controls', [ReaderController::class, 'storeControl']);
        Route::delete('reader/controls/{id}', [ReaderController::class, 'destroyControl']);
        Route::get('custom-feeds', [FeedController::class, 'customFeeds']);
        Route::post('custom-feeds', [FeedController::class, 'storeCustomFeed']);
        Route::delete('custom-feeds/{id}', [FeedController::class, 'destroyCustomFeed']);
    });
    Route::get('posts/{id}/interaction', [ReaderController::class, 'state'])->middleware('api.auth');
    Route::post('posts/{id}/share', [ReaderController::class, 'share'])->middleware('throttle:30,1');
    Route::post('posts/{id}/likes', [ReaderController::class, 'like'])->middleware('api.auth');
    Route::delete('posts/{id}/likes', [ReaderController::class, 'unlike'])->middleware('api.auth');
    Route::post('posts/{id}/repost', [ReaderController::class, 'repost'])->middleware('api.auth');
    Route::delete('posts/{id}/repost', [ReaderController::class, 'unrepost'])->middleware('api.auth');
    Route::post('posts/{id}/quote', [ReaderController::class, 'quote'])->middleware('api.auth');
    Route::post('posts/{id}/poll-votes', [ReaderController::class, 'vote'])->middleware('api.auth');
    Route::put('posts/{id}/bookmark', [ReaderController::class, 'bookmark'])->middleware('api.auth');
    Route::delete('posts/{id}/bookmark', [ReaderController::class, 'unbookmark'])->middleware('api.auth');
    Route::get('posts/me', [PostController::class, 'mine'])->middleware('api.auth');
    Route::post('authors/{id}/follow', [ReaderController::class, 'follow'])->middleware('api.auth');
    Route::delete('authors/{id}/follow', [ReaderController::class, 'unfollow'])->middleware('api.auth');
    Route::post('media', [MediaController::class, 'upload'])->middleware(['api.auth', 'throttle:20,1']);
    Route::get('media/{year}/{month}/{file}', [MediaController::class, 'show'])->where(['year' => '[0-9]{4}', 'month' => '[0-9]{2}', 'file' => '[a-f0-9-]+\.(jpg|jpeg|png|webp|gif|mp4|webm)']);
    Route::get('posts/{id}/manage', [PostController::class, 'manage'])->middleware('api.auth');
    Route::post('posts', [PostController::class, 'store'])->middleware('api.auth');
    Route::post('posts/thread', [PostController::class, 'storeThread'])->middleware('api.auth');
    Route::post('posts/{id}/view', [PostController::class, 'view']);
    Route::post('posts/{id}/approve', [PostController::class, 'approve'])->middleware(['api.auth', 'api.admin']);
    Route::get('posts/{id}', [PostController::class, 'show'])->middleware('api.optional-auth');
    Route::put('posts/{id}', [PostController::class, 'update'])->middleware('api.auth');
    Route::put('posts/{id}/controls', [PostController::class, 'controls'])->middleware('api.auth');
    Route::delete('posts/{id}', [PostController::class, 'destroy'])->middleware('api.auth');

    Route::get('posts/{postId}/comments', [CommentController::class, 'index']);
    Route::get('posts/{postId}/comments/count', [CommentController::class, 'count']);
    Route::post('posts/{postId}/comments', [CommentController::class, 'store'])->middleware('api.auth');
    Route::get('posts/{postId}/comments/pending', [CommentController::class, 'pendingForPost'])->middleware('api.auth');
    Route::post('posts/{postId}/comments/{commentId}/approve', [CommentController::class, 'reviewForPost'])->defaults('status', 'Approved')->middleware('api.auth');
    Route::post('posts/{postId}/comments/{commentId}/reject', [CommentController::class, 'reviewForPost'])->defaults('status', 'Hidden')->middleware('api.auth');
    Route::post('comments/{id}/reply', [CommentController::class, 'reply'])->middleware('api.auth');
    Route::post('comments/{id}/approve', [CommentController::class, 'moderate'])->defaults('status', 'Approved')->middleware(['api.auth', 'api.admin']);
    Route::post('comments/{id}/hide', [CommentController::class, 'moderate'])->defaults('status', 'Hidden')->middleware(['api.auth', 'api.admin']);
    Route::delete('comments/{id}', [CommentController::class, 'destroy'])->middleware('api.auth');

    Route::middleware('api.auth')->group(function () {
        Route::get('profile', [ProfileController::class, 'show']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::put('profile/password', [ProfileController::class, 'password'])->middleware('throttle:5,1,change-password');
        Route::post('auth/email/verification-notification', [EmailVerificationController::class, 'send'])->middleware('throttle:6,1');
        Route::get('bookmarks', [ReaderController::class, 'bookmarks']);
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/read-all', [NotificationController::class, 'readAll']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'read']);
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
        Route::get('posts', [PostController::class, 'adminQueue']);
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
