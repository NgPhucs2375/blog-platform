<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;

class NotificationController extends ApiController
{
    public function index(Request $request)
    {
        $notifications = $request->user()->notifications()->latest()->paginate(min(100, max(1, (int) $request->query('limit', 20))));

        return $this->ok(['notifications' => $notifications, 'unreadCount' => $request->user()->unreadNotifications()->count()]);
    }

    public function read(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->whereKey($id)->firstOrFail();
        $notification->markAsRead();

        return $this->ok(['id' => $id, 'readAt' => $notification->read_at?->toISOString()]);
    }

    public function readAll(Request $request)
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return $this->ok(null, 'Đã đánh dấu thông báo đã đọc.');
    }
}
