<?php

namespace App\Http\Controllers\Api;

use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TagController extends ApiController
{
    public function index(Request $request)
    {
        $tags = Tag::withCount(['posts' => fn ($query) => $query->where('status', 'Published')])
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->query('search').'%'))
            ->when($request->boolean('popular'), fn ($query) => $query->orderByDesc('posts_count')->orderBy('name'), fn ($query) => $query->orderBy('name'))
            ->paginate(min(100, max(1, (int) $request->query('limit', 50))));

        return $this->ok($tags);
    }

    public function store(Request $request)
    {
        $request->merge(['slug' => Str::slug($request->input('slug') ?: $request->input('name', ''))]);
        $data = $request->validate(['name' => 'required|string|max:100|unique:tags,name', 'slug' => 'required|string|max:120|unique:tags,slug'], ['slug.unique' => 'Đường dẫn thẻ đã được sử dụng.', 'slug.required' => 'Vui lòng nhập đường dẫn hợp lệ.', 'name.unique' => 'Tên thẻ đã tồn tại.']);
        $tag = Tag::create(['name' => $data['name'], 'slug' => $data['slug'] ?? Str::slug($data['name'])]);

        return $this->ok($tag->apiArray(), 'Tạo tag thành công.', 201);
    }

    public function update(Request $request, int $id)
    {
        $tag = Tag::findOrFail($id);
        $request->merge(['slug' => Str::slug($request->input('slug') ?: $request->input('name', ''))]);
        $data = $request->validate(['name' => ['required', 'string', 'max:100', Rule::unique('tags', 'name')->ignore($id)], 'slug' => ['required', 'string', 'max:120', Rule::unique('tags', 'slug')->ignore($id)]], ['slug.unique' => 'Đường dẫn thẻ đã được sử dụng.', 'slug.required' => 'Vui lòng nhập đường dẫn hợp lệ.', 'name.unique' => 'Tên thẻ đã tồn tại.']);
        $tag->update(['name' => $data['name'], 'slug' => $data['slug'] ?? Str::slug($data['name'])]);

        return $this->ok($tag->fresh()->apiArray());
    }

    public function destroy(int $id)
    {
        Tag::findOrFail($id)->delete();

        return $this->ok(null, 'Đã xóa tag.');
    }
}
