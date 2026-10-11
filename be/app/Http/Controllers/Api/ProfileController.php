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
            'displayName' => 'sometimes|nullable|string|max:120',
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'bio' => 'sometimes|nullable|string|max:1000',
            'avatarUrl' => [
                'sometimes',
                'nullable',
                'string',
                'max:1000',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value !== null && filter_var($value, FILTER_VALIDATE_URL) === false && ! str_starts_with($value, '/api/v1/media/')) {
                        $fail('Ảnh đại diện phải là URL hợp lệ hoặc ảnh đã tải lên hệ thống.');
                    }
                },
            ],
            'interests' => 'sometimes|array|max:12',
            'interests.*' => 'required|string|max:40',
            'profileLink' => 'sometimes|nullable|url|max:2048',
            'podcastUrl' => 'sometimes|nullable|url|max:2048',
            'instagramUrl' => 'sometimes|nullable|url|max:2048',
            'showInstagram' => 'sometimes|boolean',
            'showViews' => 'sometimes|boolean',
        ]);
        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;
        $fieldMap = [
            'userName' => 'username',
            'displayName' => 'display_name',
            'email' => 'email',
            'bio' => 'bio',
            'avatarUrl' => 'avatar_url',
            'interests' => 'interests',
            'profileLink' => 'profile_link',
            'podcastUrl' => 'podcast_url',
            'instagramUrl' => 'instagram_url',
            'showInstagram' => 'show_instagram',
            'showViews' => 'show_views',
        ];
        $updates = [];
        foreach ($fieldMap as $requestField => $modelField) {
            if (array_key_exists($requestField, $data)) {
                $updates[$modelField] = $data[$requestField];
            }
        }
        $updates['updated_by'] = $user->id;
        $user->update($updates);
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
