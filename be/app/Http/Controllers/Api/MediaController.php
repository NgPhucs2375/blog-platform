<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends ApiController
{
    public function upload(Request $request)
    {
        $data = $request->validate([
            'image' => 'required_without:media|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
            'media' => 'required_without:image|file|mimes:jpg,jpeg,png,webp,gif,mp4,webm|max:20480',
        ]);
        $disk = (string) config('filesystems.default');
        if (($disk === 'local' || $disk === 'public') && config('filesystems.disks.r2.bucket')) {
            $disk = 'r2';
        }
        if (! in_array($disk, ['s3', 'r2'], true)) {
            $disk = 'public';
        }
        $file = $data['media'] ?? $data['image'];
        $extension = Str::lower($file->guessExtension() ?: $file->getClientOriginalExtension());
        $path = 'blog/'.now()->format('Y/m').'/'.Str::uuid().'.'.$extension;
        $options = $disk === 'r2' ? [] : ['visibility' => 'public'];
        $stored = Storage::disk($disk)->putFileAs('', $file, $path, $options);
        if (! $stored) {
            return $this->fail('Không tải được ảnh lên kho lưu trữ.', 502);
        }

        $url = '/api/v1/media/'.substr($path, 5);

        $type = str_starts_with((string) $file->getMimeType(), 'video/') ? 'video' : 'image';

        return $this->ok(['path' => $path, 'url' => $url, 'type' => $type], $type === 'video' ? 'Tải video thành công.' : 'Tải ảnh thành công.', 201);
    }

    public function show(string $year, string $month, string $file)
    {
        $path = 'blog/'.$year.'/'.$month.'/'.$file;
        if (config('filesystems.disks.r2.bucket')) {
            $r2 = Storage::disk('r2');
            if ($r2->exists($path)) {
                return $r2->response($path, null, [
                    'Cache-Control' => 'public, max-age=31536000, immutable',
                    'X-Content-Type-Options' => 'nosniff',
                ]);
            }
        }

        $public = Storage::disk('public');
        abort_unless($public->exists($path), 404);

        return $public->response($path, null, ['Cache-Control' => 'public, max-age=31536000, immutable', 'X-Content-Type-Options' => 'nosniff']);
    }
}
