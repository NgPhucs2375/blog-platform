<?php
namespace App\Services;
use App\Models\User;
use App\Notifications\EmailVerificationCodeNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
class EmailVerificationCodeService
{
 private const TTL_MINUTES=10;
 private const MAX_ATTEMPTS=5;
 public function send(User $user): void
 {
  if($user->hasVerifiedEmail()) return;
  $code=(string)random_int(100000,999999);
  $key=$this->key($user->email);
  Cache::put($key,['hash'=>Hash::make($code),'attempts'=>0,'expires_at'=>now()->addMinutes(self::TTL_MINUTES)->timestamp],now()->addMinutes(self::TTL_MINUTES));
  try {
   $user->notify(new EmailVerificationCodeNotification($code));
  } catch (\Throwable $exception) {
   Cache::forget($key);
   throw $exception;
  }
 }
 public function verify(string $email,string $code): bool
 {
  $email=mb_strtolower(trim($email)); $key=$this->key($email); $record=Cache::get($key);
  if(!is_array($record)||($record['attempts']??self::MAX_ATTEMPTS)>=self::MAX_ATTEMPTS){Cache::forget($key);return false;}
  if(!Hash::check($code,$record['hash']??'')){
   $record['attempts']=($record['attempts']??0)+1;
   Cache::put($key,$record,max(1,($record['expires_at']??now()->timestamp)-now()->timestamp)); return false;
  }
  $user=User::where('email',$email)->first();
  if(!$user||$user->hasVerifiedEmail()){Cache::forget($key);return false;}
  $user->markEmailAsVerified(); Cache::forget($key); return true;
 }
 private function key(string $email): string { return 'email-verification-code:'.hash('sha256',mb_strtolower(trim($email))); }
}
