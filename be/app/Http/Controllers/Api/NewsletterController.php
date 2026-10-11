<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class NewsletterController extends ApiController
{
    public function subscribe(Request $request)
    {
        $data = $request->validate(['email' => 'required|email:rfc|max:255']);
        $email = mb_strtolower(trim($data['email']));
        if (DB::table('newsletter_subscriptions')->where('email', $email)->whereNotNull('confirmed_at')->exists()) {
            return $this->ok(null, 'Email đã đăng ký nhận bài viết.');
        }
        $token = Str::random(48);
        $unsubscribeToken = Str::random(48);
        DB::table('newsletter_subscriptions')->updateOrInsert(
            ['email' => $email],
            ['confirmation_token' => hash('sha256', $token), 'unsubscribe_token' => hash('sha256', $unsubscribeToken), 'confirmed_at' => null, 'updated_at' => now(), 'created_at' => now()],
        );
        $url = rtrim((string) config('app.url'), '/').'/api/v1/newsletter/confirm/'.urlencode($token);
        try {
            Mail::raw("Xác nhận đăng ký nhận bài viết bằng liên kết sau:

$url", fn ($message) => $message->to($data['email'])->subject('Xác nhận đăng ký nhận bài viết'));
        } catch (\Throwable $exception) {
            report($exception);

            return $this->fail('Chưa gửi được email xác nhận. Vui lòng thử lại sau.', 503);
        }

        return $this->ok(null, 'Hãy kiểm tra email để xác nhận đăng ký.');
    }

    public function confirm(string $token)
    {
        $updated = DB::table('newsletter_subscriptions')
            ->where('confirmation_token', hash('sha256', $token))
            ->update(['confirmed_at' => now(), 'confirmation_token' => null, 'updated_at' => now()]);

        return $updated ? $this->ok(null, 'Đăng ký nhận bài thành công.') : $this->fail('Liên kết xác nhận không hợp lệ hoặc đã dùng.', 410);
    }

    public function unsubscribe(string $token)
    {
        $deleted = DB::table('newsletter_subscriptions')->where('unsubscribe_token', $token)->delete();

        return $deleted ? $this->ok(null, 'Đã hủy đăng ký.') : $this->fail('Liên kết hủy đăng ký không hợp lệ.', 404);
    }
}
