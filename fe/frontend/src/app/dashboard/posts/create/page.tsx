'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { postApi, Category } from '@/services/postApi';
import { ArrowLeft, Save, Send, Eye, Edit3 } from 'lucide-react';

export default function CreatePostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    postApi.getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(String(cats[0].id));
    });
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setSlug(autoSlug);
  };

  const handleSave = async (status: 'published' | 'draft') => {
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Vui lòng điền tiêu đề và nội dung bài viết.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await postApi.createPost({
        title,
        slug: slug || `post-${Date.now()}`,
        category_id: categoryId,
        excerpt,
        content,
        featured_image: featuredImage,
        status,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bài viết.');
      setSubmitting(false);
    }
  };

  const selectedCategoryName =
    categories.find((c) => String(c.id) === String(categoryId))?.name || 'Chung';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Bar Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Soạn thảo bài viết</h1>
                <p className="text-xs text-slate-400">Xuất bản bài viết kỹ thuật lên Blog Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-slate-800 bg-slate-900/60 p-1 mr-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === 'write'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Soạn
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeTab === 'preview'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Xem trước
                </button>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave('draft')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                Lưu nháp
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSave('published')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Xuất bản
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 p-3.5 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Editor Form */}
          {activeTab === 'write' ? (
            <div className="space-y-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Tiêu đề bài viết
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: Thiết kế hệ thống chịu tải cao với Redis và RabbitMQ"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-lg font-bold text-white outline-none focus:border-indigo-500 transition placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Đường dẫn tĩnh (Slug)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="duong-dan-bai-viet"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Chuyên mục
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Trích đoạn ngắn (Excerpt)
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung bài viết trong 1-2 câu..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition resize-none placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  URL ảnh bìa
                </label>
                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={14}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Bắt đầu viết nội dung bài viết..."
                  className="w-full font-mono rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200 outline-none focus:border-indigo-500 transition leading-relaxed placeholder-slate-600"
                />
              </div>
            </div>
          ) : (
            /* Preview Mode */
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 space-y-6">
              {featuredImage && (
                <img
                  src={featuredImage}
                  alt="Cover preview"
                  className="w-full max-h-72 object-cover rounded-xl border border-slate-800"
                />
              )}
              <div className="space-y-3">
                <span className="rounded-md border border-indigo-800/50 bg-indigo-950/80 px-2.5 py-1 text-xs font-medium text-indigo-300">
                  {selectedCategoryName}
                </span>
                <h1 className="text-3xl font-extrabold text-white">
                  {title || 'Tiêu đề bài viết chưa nhập'}
                </h1>
                {excerpt && (
                  <p className="text-sm italic text-slate-400 border-l-2 border-indigo-500 pl-4 py-1">
                    {excerpt}
                  </p>
                )}
              </div>
              <div className="border-t border-slate-800/80 pt-6 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {content || 'Chưa có nội dung xem trước...'}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}