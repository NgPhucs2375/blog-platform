<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
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
        $data = $request->validate(['userName' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)], 'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)], 'bio' => 'sometimes|nullable|string|max:1000']);
        $user->update(array_filter(['username' => $data['userName'] ?? null, 'email' => $data['email'] ?? null, 'bio' => $data['bio'] ?? null, 'updated_by' => $user->id], fn ($v) => $v !== null));

        return $this->ok($user->fresh()->apiArray(), 'Cập nhật hồ sơ thành công.');
    }

    public function password(Request $request)
    {
        $data = $request->validate(['currentPassword' => 'required|string', 'newPassword' => 'required|string|min:8']);
        if (! Hash::check($data['currentPassword'], $request->user()->password)) {
            return $this->fail('Mật khẩu hiện tại không đúng.', 422);
        }
        $request->user()->update(['password' => $data['newPassword']]);

        return $this->ok(null, 'Đổi mật khẩu thành công.');
    }
}
