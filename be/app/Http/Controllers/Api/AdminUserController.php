<?php

namespace App\Http\Controllers\Api;

use App\Models\ApiToken;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends ApiController
{
    public function index(Request $request)
    {
        $query = User::query();
        if ($request->boolean('includeDeleted')) {
            $query->withTrashed();
        }
        if ($request->filled('search')) {
            $query->where(fn ($q) => $q->where('username', 'like', '%'.$request->query('search').'%')->orWhere('email', 'like', '%'.$request->query('search').'%'));
        }
        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        $total = (clone $query)->count();
        $page = max(1, (int) $request->query('page', 1));
        $limit = min(100, max(1, (int) $request->query('limit', 10)));
        $users = $query->latest()->skip(($page - 1) * $limit)->take($limit)->get()->map->apiArray()->values();

        return $this->ok(['users' => $users, 'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total, 'totalPages' => (int) ceil($total / $limit)]]);
    }

    public function show(int $id)
    {
        return $this->ok(User::withTrashed()->findOrFail($id)->apiArray());
    }

    public function store(Request $request)
    {
        $data = $request->validate(['userName' => 'required|string|max:255|unique:users,username', 'email' => 'required|email|unique:users,email', 'password' => 'required|string|min:8', 'role' => ['nullable', Rule::in(['Admin', 'User'])], 'status' => ['nullable', Rule::in(['Active', 'Locked'])]]);
        $user = User::create(['username' => $data['userName'], 'email' => $data['email'], 'password' => $data['password'], 'role' => $data['role'] ?? 'User', 'status' => $data['status'] ?? 'Active', 'created_by' => $request->user()->id]);

        return $this->ok($user->apiArray(), 'Tạo tài khoản thành công.', 201);
    }

    public function role(Request $request, int $id)
    {
        $data = $request->validate(['role' => ['required', Rule::in(['Admin', 'User'])]]);
        $user = User::findOrFail($id);
        $user->update(['role' => $data['role'], 'updated_by' => $request->user()->id]);

        return $this->ok($user->fresh()->apiArray(), 'Cập nhật quyền thành công.');
    }

    public function lock(Request $request, int $id)
    {
        return $this->setStatus($request, $id, 'Locked');
    }

    public function unlock(Request $request, int $id)
    {
        return $this->setStatus($request, $id, 'Active');
    }

    private function setStatus(Request $request, int $id, string $status)
    {
        $user = User::findOrFail($id);
        if ($user->id === $request->user()->id) {
            return $this->fail('Không thể tự khóa tài khoản đang đăng nhập.', 409);
        }
        $user->update(['status' => $status, 'updated_by' => $request->user()->id]);
        if ($status === 'Locked') {
            ApiToken::where('user_id', $id)->delete();
            RefreshToken::where('user_id', $id)->update(['revoked_at' => now()]);
        }

        return $this->ok($user->fresh()->apiArray(), 'Đã cập nhật trạng thái tài khoản.');
    }

    public function restore(Request $request, int $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore();
        $user->update(['deleted_by' => null, 'updated_by' => $request->user()->id]);

        return $this->ok($user->fresh()->apiArray(), 'Khôi phục tài khoản thành công.');
    }

    public function destroy(Request $request, int $id)
    {
        $user = User::findOrFail($id);
        if ($user->id === $request->user()->id || $user->role === 'Admin') {
            return $this->fail('Không thể xóa tài khoản này.', 409);
        }
        if ($request->boolean('permanent')) {
            $user->forceDelete();
        } else {
            $user->update(['deleted_by' => $request->user()->id]) && $user->delete();
        }

        return $this->ok(null, 'Đã xóa tài khoản.');
    }

    public function bulk(Request $request, string $action)
    {
        $data = $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer']);
        $success = [];
        $failed = [];
        foreach (array_unique($data['ids']) as $id) {
            $user = User::find($id);
            if (! $user || $user->id === $request->user()->id || $user->role === 'Admin') {
                $failed[] = ['id' => $id, 'reason' => 'Không tìm thấy hoặc không thể thao tác tài khoản này.'];

                continue;
            }
            if ($action === 'lock') {
                $user->update(['status' => 'Locked']);
            } elseif ($action === 'unlock') {
                $user->update(['status' => 'Active']);
            } elseif ($action === 'delete') {
                $user->delete();
            }
            $success[] = $id;
        }

        return $this->ok(['success' => $success, 'failed' => $failed]);
    }
}
