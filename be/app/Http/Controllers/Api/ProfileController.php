<?php

namespace App\Http\Controllers\Api;

use App\Models\ApiToken;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends ApiController
{
    public function show(Request $request)
    {
        return $this->ok($request->user()->apiArray());
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'userName' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'bio' => 'sometimes|nullable|string|max:1000',
            'avatarUrl' => 'sometimes|nullable|url|max:1000',
        ]);
        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;
        $user->update(array_filter([
            'username' => $data['userName'] ?? null,
            'email' => $data['email'] ?? null,
            'bio' => $data['bio'] ?? null,
            'avatar_url' => $data['avatarUrl'] ?? null,
            'updated_by' => $user->id,
        ], fn ($value) => $value !== null));
        if ($emailChanged) {
            $user->forceFill(['email_verified_at' => null])->save();
            $user->sendEmailVerificationNotification();
        }

        return $this->ok($user->fresh()->apiArray(), 'Cập nhật hồ sơ thành công.');
    }

    public function password(Request $request): JsonResponse
    {
        $data = $request->validate([
            'currentPassword' => 'required|string',
            'newPassword' => 'required|string|min:8|confirmed|different:currentPassword',
        ], [
            'currentPassword.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'currentPassword.string' => 'Mật khẩu hiện tại không hợp lệ.',
            'newPassword.required' => 'Vui lòng nhập mật khẩu mới.',
            'newPassword.string' => 'Mật khẩu mới không hợp lệ.',
            'newPassword.min' => 'Mật khẩu mới phải chứa ít nhất 8 ký tự.',
            'newPassword.confirmed' => 'Xác nhận mật khẩu mới không trùng khớp.',
            'newPassword.different' => 'Mật khẩu mới phải khác mật khẩu hiện tại.',
        ]);

        return DB::transaction(function () use ($request, $data): JsonResponse {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if (! Hash::check($data['currentPassword'], $user->password)) {
                return $this->fail('Mật khẩu hiện tại không đúng.', 422);
            }

            $user->update(['password' => $data['newPassword']]);
            ApiToken::where('user_id', $user->id)->delete();
            RefreshToken::where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => now()]);
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();

            return $this->ok(null, 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.');
        });
    }
}
