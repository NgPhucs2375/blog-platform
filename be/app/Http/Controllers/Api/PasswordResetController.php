<?php

namespace App\Http\Controllers\Api;

use App\Models\ApiToken;
use App\Models\RefreshToken;
use App\Models\User;
use App\Notifications\PasswordResetCodeNotification;
use App\Services\PasswordResetCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PasswordResetController extends ApiController
{
    public function send(Request $request, PasswordResetCodeService $codes)
    {
        $data = $request->validate(['email' => 'required|email|max:255']);
        $email = mb_strtolower(trim($data['email']));
        $user = User::where('email', $email)->first();

        if ($user) {
            try {
                $code = $codes->send($email);
                $user->notify(new PasswordResetCodeNotification($code));
            } catch (\Throwable $exception) {
                $codes->forget($email);
                report($exception);

                return $this->fail('Chưa gửi được mã xác minh. Vui lòng thử lại sau.', 503);
            }
        }

        return $this->ok(null, 'Nếu email thuộc tài khoản đã đăng ký, mã xác minh sẽ được gửi đến hộp thư đó. Mã có hiệu lực trong 10 phút.');
    }

    public function reset(Request $request, PasswordResetCodeService $codes)
    {
        $data = $request->validate([
            'email' => 'required|email|max:255',
            'code' => 'required|digits:6',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'code.required' => 'Vui lòng nhập mã xác minh.',
            'code.digits' => 'Mã xác minh phải gồm 6 chữ số.',
            'password.min' => 'Mật khẩu mới phải có ít nhất 8 ký tự.',
            'password.confirmed' => 'Xác nhận mật khẩu mới không trùng khớp.',
        ]);
        $email = mb_strtolower(trim($data['email']));
        if (! $codes->verify($email, $data['code'])) {
            return $this->fail('Mã xác minh không đúng, đã hết hạn hoặc đã vượt quá số lần thử.', 422);
        }

        $user = DB::transaction(function () use ($email, $data): ?User {
            $user = User::where('email', $email)->lockForUpdate()->first();
            if (! $user) {
                return null;
            }
            $user->forceFill(['password' => $data['password']])->save();
            ApiToken::where('user_id', $user->id)->delete();
            RefreshToken::where('user_id', $user->id)->whereNull('revoked_at')->update(['revoked_at' => now()]);
            DB::table('password_reset_tokens')->where('email', $email)->delete();

            return $user;
        });

        if (! $user) {
            $codes->forget($email);

            return $this->fail('Không tìm thấy tài khoản cần đặt lại mật khẩu.', 422);
        }

        $codes->forget($email);

        return $this->ok(null, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.');
    }
}
