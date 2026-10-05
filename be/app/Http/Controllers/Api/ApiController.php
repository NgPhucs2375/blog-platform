<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

abstract class ApiController extends Controller
{
    protected function ok(mixed $data = null, string $message = 'Thành công.', int $status = 200): JsonResponse
    {
        return response()->json(['success' => true, 'status_code' => $status, 'message' => $message, 'data' => $data, 'timestamp' => now()->toISOString()], $status);
    }

    protected function fail(string $message, int $status = 422, mixed $data = null): JsonResponse
    {
        return response()->json(['success' => false, 'status_code' => $status, 'message' => $message, 'data' => $data, 'timestamp' => now()->toISOString()], $status);
    }
}
