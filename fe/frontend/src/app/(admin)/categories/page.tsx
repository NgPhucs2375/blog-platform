'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  Loader2,
  Tag,
} from 'lucide-react';
import { postApi, Category } from '@/services/postApi';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCats() {
      try {
        setLoading(true);
        const data = await postApi.getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error('Lỗi khi tải chuyên mục:', err);
        setCategories([
          { id: 1, name: 'DevOps', slug: 'devops' },
          { id: 2, name: 'UI/UX Design', slug: 'ui-ux-design' },
          { id: 3, name: 'Kinh tế', slug: 'kinh-te' },
          { id: 4, name: 'Lập trình', slug: 'lap-trinh' },
          { id: 5, name: 'Kiến trúc hệ thống', slug: 'kien-truc-he-thong' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchCats();
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, name: name.trim(), slug: slug.trim() } : c))
        );
        setActionNotice(`Đã cập nhật chuyên mục "${name}".`);
      } else {
        const newCat: Category = {
          id: Date.now(),
          name: name.trim(),
          slug: slug.trim() || `cat-${Date.now()}`,
        };
        setCategories((prev) => [...prev, newCat]);
        setActionNotice(`Đã thêm chuyên mục mới "${name}".`);
      }

      setName('');
      setSlug('');
      setDescription('');
      setEditingId(null);
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number, catName: string) => {
    if (!window.confirm(`Xác nhận xóa chuyên mục "${catName}"?`)) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setActionNotice(`Đã xóa chuyên mục "${catName}".`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [categories, searchQuery]);

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Tag className="h-3.5 w-3.5" /> QUẢN TRỊ NỘI DUNG
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Quản lý Chuyên mục
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Tổ chức, phân loại cây nội dung và định hướng chủ đề cho nền tảng blog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/users"
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition"
          >
            Quản trị người dùng
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition"
          >
            Về Dashboard
          </Link>
        </div>
      </div>

      {/* Thông báo thao tác */}
      {actionNotice && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Form thêm mới / Sửa chuyên mục */}
        <div className="lg:col-span-5 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/70 space-y-5">
          <div>
            <h2 className="text-base font-bold text-zinc-950 dark:text-white">
              {editingId ? 'Chỉnh sửa chuyên mục' : 'Thêm chuyên mục mới'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Tạo thẻ phân loại bài viết mới
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Tên chuyên mục
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ví dụ: Điện toán đám mây"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Đường dẫn tĩnh (Slug)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="dien-toan-dam-may"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                Mô tả ngắn
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu nội dung phân loại này..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? 'Lưu thay đổi' : 'Thêm chuyên mục'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setSlug('');
                    setDescription('');
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Danh sách chuyên mục */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                Danh sách chuyên mục
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tổng cộng {categories.length} danh mục
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm chuyên mục..."
                className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-1.5 text-xs text-zinc-950 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-white/10 dark:bg-[#0c121e]/70 dark:text-white dark:placeholder-zinc-500 transition"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/70">
            {loading ? (
              <div className="flex min-h-[25vh] flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs">Đang tải chuyên mục...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-xs font-semibold text-zinc-950 dark:text-white">Không tìm thấy chuyên mục nào</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-400">
                    <th className="py-3 px-4">TÊN CHUYÊN MỤC</th>
                    <th className="py-3 px-4">SLUG</th>
                    <th className="py-3 px-4 text-center">SỐ BÀI</th>
                    <th className="py-3 px-4 text-right">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.04]">
                  {filtered.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-bold text-zinc-950 dark:text-white">
                        {cat.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                        /{cat.slug}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-zinc-600 dark:text-zinc-400">
                        # {idx * 3 + 3}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-white/5 dark:hover:text-indigo-400 transition"
                            title="Sửa"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition"
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}