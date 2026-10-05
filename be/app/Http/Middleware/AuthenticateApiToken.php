<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $plain = $request->bearerToken();
        $token = $plain ? ApiToken::where('token_hash', hash('sha256', $plain))->first() : null;
        if (! $token || $token->expires_at->isPast() || ! $token->user || $token->user->status !== 'Active') {
            return response()->json(['success' => false, 'status_code' => 401, 'message' => 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 'data' => null, 'timestamp' => now()->toISOString()], 401);
        }
        $request->setUserResolver(fn () => $token->user);
        $request->attributes->set('api_token', $token);

        return $next($request);
    }
}
