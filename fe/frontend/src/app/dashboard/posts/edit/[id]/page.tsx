'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { postApi, Category } from '@/services/postApi';
import { ArrowLeft, Save, Send, Eye, Edit3 } from 'lucide-react';

interface EditPostProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostProps) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [cats, post] = await Promise.all([
        postApi.getCategories(),
        postApi.getPostById(postId),
      ]);
      setCategories(cats);
      if (post) {
        setTitle(post.title || '');
        setSlug(post.slug || '');
        setCategoryId(String(post.category_id || cats[0]?.id || ''));
        setExcerpt(post.excerpt || '');
        setContent(post.content || '');
        setFeaturedImage(post.featured_image || '');
      }
      setLoading(false);
    };
    fetchData();
  }, [postId]);

  const handleUpdate = async (status: 'published' | 'draft') => {
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Vui lòng điền tiêu đề và nội dung bài viết.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await postApi.updatePost(postId, {
        title,
        slug,
        category_id: categoryId,
        excerpt,
        content,
        featured_image: featuredImage,
        status,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể cập nhật bài viết.');
      setSubmitting(false);
    }
  };

  const selectedCategoryName =
    categories.find((c) => String(c.id) === String(categoryId))?.name || 'Chung';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sm text-slate-500">
        Đang tải dữ liệu bài viết...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-2 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Chỉnh sửa bài viết</h1>
                <p className="text-xs text-slate-400">ID bài viết: #{postId}</p>
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
                onClick={() => handleUpdate('draft')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                Lưu nháp
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleUpdate('published')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Lưu & Xuất bản
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 p-3.5 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {activeTab === 'write' ? (
            <div className="space-y-5 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Tiêu đề bài viết
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-lg font-bold text-white outline-none focus:border-indigo-500 transition"
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition resize-none"
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
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-300 outline-none focus:border-indigo-500 transition"
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
                  className="w-full font-mono rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200 outline-none focus:border-indigo-500 transition leading-relaxed"
                />
              </div>
            </div>
          ) : (
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
                <h1 className="text-3xl font-extrabold text-white">{title}</h1>
                {excerpt && (
                  <p className="text-sm italic text-slate-400 border-l-2 border-indigo-500 pl-4 py-1">
                    {excerpt}
                  </p>
                )}
              </div>
              <div className="border-t border-slate-800/80 pt-6 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}