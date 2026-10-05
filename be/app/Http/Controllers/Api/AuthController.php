<?php

namespace App\Http\Controllers\Api;

use App\Models\ApiToken;
use App\Models\RefreshToken;
use App\Models\User;
use Google\Client as GoogleClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends ApiController
{
    public function register(Request $request)
    {
        $data = $request->validate(['userName' => 'required|string|max:255|unique:users,username', 'email' => 'required|email|max:255|unique:users,email', 'password' => 'required|string|min:8']);
        $user = User::create(['username' => $data['userName'], 'email' => $data['email'], 'password' => $data['password'], 'role' => 'User', 'status' => 'Active']);

        return $this->ok(['userId' => $user->id], 'Đăng ký thành công.', 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);
        $user = User::where('email', $data['email'])->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return $this->fail('Email hoặc mật khẩu không chính xác.', 401);
        }
        if ($user->status !== 'Active') {
            return $this->fail('Tài khoản đang bị khóa.', 403);
        }

        return $this->ok($this->issuePair($user, $request), 'Đăng nhập thành công.');
    }

    public function refresh(Request $request)
    {
        $data = $request->validate(['refresh_token' => 'required|string']);
        $old = RefreshToken::where('token_hash', hash('sha256', $data['refresh_token']))->first();
        if (! $old || $old->revoked_at || $old->expires_at->isPast() || ! $old->user || $old->user->status !== 'Active') {
            return $this->fail('Refresh token không hợp lệ hoặc đã hết hạn.', 401);
        }

        return DB::transaction(function () use ($old, $request) {
            $old->update(['revoked_at' => now()]);
            ApiToken::where('user_id', $old->user_id)->where('expires_at', '<=', now())->delete();

            return $this->ok($this->issuePair($old->user, $request), 'Làm mới phiên thành công.');
        });
    }

    public function logout(Request $request)
    {
        $data = $request->validate(['refresh_token' => 'nullable|string']);
        if (! empty($data['refresh_token'])) {
            RefreshToken::where('token_hash', hash('sha256', $data['refresh_token']))->where('user_id', $request->user()->id)->update(['revoked_at' => now()]);
        }
        $request->attributes->get('api_token')?->delete();

        return $this->ok(null, 'Đăng xuất thành công.');
    }

    public function sessions(Request $request)
    {
        $rows = RefreshToken::where('user_id', $request->user()->id)->whereNull('revoked_at')->where('expires_at', '>', now())->latest()->get();

        return $this->ok($rows->map(fn ($row) => ['id' => $row->id, 'createdAt' => $row->created_at?->toISOString(), 'expiresAt' => $row->expires_at?->toISOString(), 'userAgent' => $row->user_agent, 'ip' => $row->ip])->values());
    }

    public function revokeSession(Request $request, int $id)
    {
        RefreshToken::where('id', $id)->where('user_id', $request->user()->id)->whereNull('revoked_at')->update(['revoked_at' => now()]);

        return $this->ok(null, 'Đã thu hồi phiên đăng nhập.');
    }

    public function social(Request $request, string $provider)
    {
        if ($provider !== 'google') {
            return $this->fail('Đăng nhập GitHub chưa được cấu hình.', 501);
        }

        $clientId = (string) config('services.google.client_id');
        if ($clientId === '') {
            return $this->fail('Google login chưa được cấu hình Client ID trên máy chủ.', 503);
        }

        $data = $request->validate(['credential' => 'required|string|max:8192']);
        try {
            $payload = (new GoogleClient(['client_id' => $clientId]))->verifyIdToken($data['credential']);
        } catch (\Throwable) {
            return $this->fail('Không thể xác minh tài khoản Google lúc này. Vui lòng thử lại.', 502);
        }

        if (! $payload || empty($payload['sub']) || empty($payload['email']) || ! filter_var($payload['email'], FILTER_VALIDATE_EMAIL) || ! filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            return $this->fail('Thông tin xác thực Google không hợp lệ hoặc email chưa được xác minh.', 401);
        }

        $user = User::withTrashed()->where('google_id', $payload['sub'])->first();
        if (! $user) {
            $user = User::withTrashed()->where('email', $payload['email'])->first();
            if ($user && ! $user->trashed()) {
                $user->forceFill(['google_id' => $payload['sub']])->save();
            }
        }

        if (! $user) {
            $baseUsername = Str::slug($payload['name'] ?? Str::before($payload['email'], '@')) ?: 'google-user';
            $username = $baseUsername;
            $suffix = 1;
            while (User::withTrashed()->where('username', $username)->exists()) {
                $username = $baseUsername.'-'.$suffix++;
            }
            $user = User::create([
                'username' => $username,
                'email' => $payload['email'],
                'password' => Str::random(64),
                'google_id' => $payload['sub'],
                'role' => 'User',
                'status' => 'Active',
            ]);
        }

        if ($user->trashed() || $user->status !== 'Active') {
            return $this->fail('Tài khoản đang bị khóa hoặc đã bị xóa.', 403);
        }

        return $this->ok($this->issuePair($user, $request), 'Đăng nhập Google thành công.');
    }

    private function issuePair(User $user, Request $request): array
    {
        $access = Str::random(64);
        $refresh = Str::random(96);
        ApiToken::create(['user_id' => $user->id, 'token_hash' => hash('sha256', $access), 'expires_at' => now()->addMinutes(15)]);
        RefreshToken::create(['user_id' => $user->id, 'token_hash' => hash('sha256', $refresh), 'expires_at' => now()->addDays(30), 'user_agent' => substr((string) $request->userAgent(), 0, 500), 'ip' => $request->ip()]);

        return ['access_token' => $access, 'refresh_token' => $refresh, 'token_type' => 'Bearer', 'expires_in' => 900, 'user' => $user->apiArray()];
    }
}
