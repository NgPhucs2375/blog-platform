<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemLogController extends ApiController
{
    public function index(Request $request)
    {
        $query = DB::table('system_logs')->leftJoin('users', 'users.id', '=', 'system_logs.user_id')->select('system_logs.*', 'users.username');
        if ($request->filled('userId')) {
            $query->where('user_id', $request->query('userId'));
        }
        if ($request->filled('action')) {
            $query->where('action', $request->query('action'));
        }
        if ($request->filled('targetType')) {
            $query->where('target_type', $request->query('targetType'));
        }
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 20)));
        $total = (clone $query)->count();
        $rows = $query->latest('system_logs.created_at')->skip(($page - 1) * $limit)->take($limit)->get();

        return $this->ok(['logs' => $rows, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)]]);
    }
}
