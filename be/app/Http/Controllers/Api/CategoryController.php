<?php

namespace App\Http\Controllers\Api;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends ApiController
{
    public function index()
    {
        return $this->ok(Category::orderBy('display_order')->orderBy('sort_order')->orderBy('name')->get()->map->apiArray()->values());
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255|unique:categories,name', 'slug' => 'required|string|max:255|unique:categories,slug', 'description' => 'nullable|string', 'sortOrder' => 'sometimes|integer', 'displayOrder' => 'sometimes|integer']);
        $category = Category::create(['name' => $data['name'], 'slug' => $data['slug'], 'description' => $data['description'] ?? null, 'sort_order' => $data['sortOrder'] ?? 0, 'display_order' => $data['displayOrder'] ?? 0, 'created_by' => $request->user()->id]);

        return $this->ok($category->apiArray(), 'Tạo chuyên mục thành công.', 201);
    }

    public function update(Request $request, int $id)
    {
        $category = Category::findOrFail($id);
        $data = $request->validate(['name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->ignore($id)], 'slug' => ['required', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($id)], 'description' => 'nullable|string', 'sortOrder' => 'sometimes|integer', 'displayOrder' => 'sometimes|integer']);
        $category->update(['name' => $data['name'], 'slug' => $data['slug'], 'description' => $data['description'] ?? null, 'sort_order' => $data['sortOrder'] ?? $category->sort_order, 'display_order' => $data['displayOrder'] ?? $category->display_order, 'updated_by' => $request->user()->id]);

        return $this->ok($category->fresh()->apiArray(), 'Cập nhật chuyên mục thành công.');
    }

    public function destroy(int $id)
    {
        $category = Category::findOrFail($id);
        if ($category->posts()->exists()) {
            return $this->fail('Không thể xóa chuyên mục đang có bài viết.', 409);
        }
        $category->delete();

        return $this->ok(null, 'Xóa chuyên mục thành công.');
    }
}
