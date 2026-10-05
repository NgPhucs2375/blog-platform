<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'Admin') {
            return response()->json(['success' => false, 'status_code' => 403, 'message' => 'Bạn không có quyền thực hiện thao tác này.', 'data' => null, 'timestamp' => now()->toISOString()], 403);
        }

        return $next($request);
    }
}
