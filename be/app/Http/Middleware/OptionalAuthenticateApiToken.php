<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OptionalAuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $plain = $request->bearerToken();
        if ($plain) {
            $token = ApiToken::where('token_hash', hash('sha256', $plain))->first();
            if ($token && ! $token->expires_at->isPast() && $token->user && $token->user->status === 'Active') {
                $request->setUserResolver(fn () => $token->user);
            }
        }

        return $next($request);
    }
}
