<?php
namespace App\Http\Controllers\Api;
use App\Models\User;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\Request;
class EmailVerificationController extends ApiController
{
 public function send(Request $request,EmailVerificationCodeService $codes)
 {
  $user=$request->user(); if($user->hasVerifiedEmail())return $this->ok(null,'Email đã được xác minh.');
  try { $codes->send($user); } catch (\Throwable $exception) { report($exception); return $this->fail('Chưa gửi được email xác minh. Vui lòng kiểm tra cấu hình dịch vụ email rồi thử lại.',503); }
  return $this->ok(null,'Đã gửi mã xác minh email. Mã có hiệu lực trong 10 phút.');
 }
 public function resend(Request $request,EmailVerificationCodeService $codes)
 {
  $data=$request->validate(['email'=>'required|email|max:255']);
  $user=User::where('email',mb_strtolower(trim($data['email'])))->first();
  if($user&&!$user->hasVerifiedEmail()) {
   try { $codes->send($user); } catch (\Throwable $exception) { report($exception); return $this->fail('Chưa gửi được email xác minh. Vui lòng kiểm tra cấu hình dịch vụ email rồi thử lại.',503); }
  }
  return $this->ok(null,'Nếu email thuộc tài khoản chưa xác minh, mã mới sẽ được gửi đến hộp thư đó.');
 }
 public function verifyCode(Request $request,EmailVerificationCodeService $codes)
 {
  $data=$request->validate(['email'=>'required|email|max:255','code'=>['required','string','regex:/^\d{6}$/']]);
  if(!$codes->verify($data['email'],$data['code']))return $this->fail('Mã xác minh không đúng, đã hết hạn hoặc đã được sử dụng.',422);
  return $this->ok(['verified'=>true],'Email đã được xác minh. Bạn có thể đăng nhập.');
 }
 public function verify(Request $request,int $id,string $hash)
 {
  $user=User::findOrFail($id);
  if(!hash_equals(sha1($user->email),$hash))return $this->fail('Liên kết xác minh không hợp lệ.',403);
  if(!$user->hasVerifiedEmail())$user->markEmailAsVerified();
  return $this->ok(['verified'=>true],'Email đã được xác minh.');
 }
}
