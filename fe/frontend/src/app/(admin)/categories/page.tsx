'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Hash,
  ArrowLeft,
} from 'lucide-react';
import { postApi, Category } from '@/services/postApi';

interface CategoryItem extends Category {
  postsCount?: number;
  description?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const data = await postApi.getCategories();
    // Bổ sung dữ liệu mô tả và đếm số lượng bài mẫu cho quản trị viên
    const mapped: CategoryItem[] = data.map((c, idx) => ({
      ...c,
      postsCount: (idx + 1) * 3,
      description: `Tổng hợp các bài viết chuyên sâu thuộc chủ đề ${c.name}.`,
    }));
    setCategories(mapped);
    setLoading(false);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  const handleResetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setSlug('');
    setDescription('');
  };

  const handleEditClick = (cat: CategoryItem) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập tên và slug chuyên mục.' });
      return;
    }

    if (isEditing && editingId !== null) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, name, slug, description }
            : c
        )
      );
      setStatusMsg({ type: 'success', text: 'Đã cập nhật thông tin chuyên mục.' });
    } else {
      const newCat: CategoryItem = {
        id: Date.now(),
        name,
        slug,
        description,
        postsCount: 0,
      };
      setCategories((prev) => [newCat, ...prev]);
      setStatusMsg({ type: 'success', text: 'Đã thêm chuyên mục mới thành công.' });
    }

    handleResetForm();
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleDelete = (id: number | string, catName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chuyên mục "${catName}"?`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setStatusMsg({ type: 'success', text: `Đã xóa chuyên mục "${catName}".` });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <FolderKanban className="h-4 w-4" /> Quản trị nội dung
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
            Quản lý Chuyên mục
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tổ chức, phân loại cây nội dung và định hướng chủ đề cho nền tảng blog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/users"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 transition"
          >
            Quản trị người dùng
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/10 transition"
          >
            Về Dashboard
          </Link>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {statusMsg.text}
        </div>
      )}

      {/* Grid: Form bên trái, Bảng dữ liệu bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form thêm/sửa */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5 h-fit">
          <div>
            <h2 className="text-base font-bold text-white">
              {isEditing ? 'Cập nhật chuyên mục' : 'Thêm chuyên mục mới'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isEditing ? 'Chỉnh sửa định danh và mô tả' : 'Tạo thẻ phân loại bài viết mới'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Tên chuyên mục
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Điện toán đám mây"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white outline-none focus:border-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Đường dẫn tĩnh (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="dien-toan-dam-may"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-zinc-300 outline-none focus:border-indigo-500 transition font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Mô tả ngắn
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu nội dung phân loại này..."
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-zinc-300 outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition"
              >
                {isEditing ? 'Lưu thay đổi' : 'Thêm chuyên mục'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 transition"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Bảng danh sách chuyên mục */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white">Danh sách chuyên mục</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Tổng cộng {categories.length} danh mục</p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm chuyên mục..."
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-8 pr-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th scope="col" className="pb-3 pr-4">Tên chuyên mục</th>
                  <th scope="col" className="pb-3 px-4">Slug</th>
                  <th scope="col" className="pb-3 px-4">Số bài viết</th>
                  <th scope="col" className="pb-3 pl-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-zinc-500">
                      Đang tải danh mục...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-zinc-500">
                      Không tìm thấy chuyên mục nào.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-white">{cat.name}</div>
                        {cat.description && (
                          <div className="text-[11px] text-zinc-500 truncate max-w-xs mt-0.5">
                            {cat.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">
                        /{cat.slug}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                          <Hash className="h-3 w-3 text-zinc-500" /> {cat.postsCount || 0}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(cat)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-white/5 transition"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition"
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}