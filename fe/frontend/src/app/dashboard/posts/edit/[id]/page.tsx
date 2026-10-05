'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, CircleNotch as CircleNotch, Eye, FloppyDisk as FloppyDisk, Image as ImageIcon, PaperPlaneTilt as PaperPlaneTilt, WarningCircle as WarningCircle } from '@phosphor-icons/react';
import { postApi, Category } from '@/services/postApi';

export default function EditPostPage() {
  const params = useParams();
  const id = params?.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const [cats, post] = await Promise.all([
          postApi.getCategories(),
          postApi.getManagePostById(id),
        ]);

        setCategories(cats || []);

        if (post) {
          const raw = post as any;
          setTitle(raw.title || '');
          setSlug(raw.slug || '');
          setCategoryId(Number(raw.categoryId || raw.category_id || (cats?.[0]?.id ?? 1)));
          setExcerpt(raw.excerpt || '');
          setCoverImage(raw.coverImage || raw.cover_image || raw.thumbnail || '');
          setContent(raw.content || '');
          setStatus((raw.status || '').toLowerCase() === 'draft' ? 'draft' : 'published');
        }
      } catch (err: any) {
        setError('Không thể nạp thông tin bài viết.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const handleUpdate = async (targetStatus?: 'published' | 'draft') => {
    if (!title.trim() || !content.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung.');
      return;
    }

    const nextStatus = targetStatus || status;

    try {
      setSubmitting(true);
      setError('');

      const updated = await postApi.updatePost(id, {
        title: title.trim(),
        slug: slug.trim(),
        categoryId: Number(categoryId),
        excerpt: excerpt.trim(),
        coverImage: coverImage.trim(),
        content: content.trim(),
        status: nextStatus.toUpperCase() as any,
      } as any);

      const moderationReason = (updated as any)?.moderationReason;
      const actualStatus = String((updated as any)?.status || nextStatus).toLowerCase();
      setStatus(actualStatus === 'draft' ? 'draft' : 'published');
      setSuccess(actualStatus === 'reject'
        ? (moderationReason || 'Bài viết có chứa ngôn từ không phù hợp và đã bị từ chối xuất bản.')
        : actualStatus === 'pending'
          ? 'Bộ lọc gặp lỗi; bài viết đang chờ Admin xử lý.'
          : `Đã ${nextStatus === 'published' ? 'xuất bản' : 'lưu bản nháp'} thành công!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-canvas text-muted transition-colors">
        <CircleNotch className="h-8 w-8 animate-spin text-accent dark:text-rose-600" />
        <p className="text-xs font-medium">Đang tải bản thảo bài viết...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink transition-colors duration-200 pb-24">
      
      {/* Glow effect */}
      <div className="absolute inset-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        {/* Header điều hướng & Nút thao tác */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted shadow-sm hover:bg-raised dark:bg-surface/[0.03] dark:text-faint transition"
              title="Quay lại Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                Chỉnh sửa bài viết
              </h1>
              <p className="text-xs sm:text-sm text-muted">
                Cập nhật nội dung bài viết và định dạng ấn phẩm trên Blog Platform.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                previewMode
                  ? 'border-rose-800 bg-red-50 text-accent dark:bg-accent/20 dark:text-red-300'
                  : 'border-line bg-surface text-ink shadow-sm hover:bg-raised dark:bg-surface/[0.03]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{previewMode ? 'Tiếp tục soạn' : 'Xem trước'}</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleUpdate('draft')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-raised dark:bg-surface/[0.03] transition"
            >
              <FloppyDisk className="h-3.5 w-3.5" />
              <span>Lưu nháp</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleUpdate('published')}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25 hover:bg-accent-hover active:scale-95 disabled:opacity-50 transition"
            >
              {submitting ? <CircleNotch className="h-3.5 w-3.5 animate-spin" /> : <PaperPlaneTilt className="h-3.5 w-3.5" />}
              <span>Xuất bản</span>
            </button>
          </div>
        </div>

        {/* Thông báo thành công / Thất bại */}
        {success && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 animate-in fade-in">
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-xs font-medium text-accent dark:bg-rose-500/10 dark:text-rose-300 animate-in fade-in">
            <WarningCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Chỉnh sửa hoặc Preview */}
        {previewMode ? (
          <div className="rounded-3xl border border-line bg-surface p-8 sm:p-12 shadow-sm/80 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-red-50 dark:bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent dark:text-rose-600 uppercase">
              {categories.find((c) => c.id === categoryId)?.name || 'Chuyên mục'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-ink">
              {title || 'Chưa đặt tiêu đề'}
            </h2>
            {excerpt && (
              <p className="text-base text-muted italic">
                {excerpt}
              </p>
            )}
            <div className="pt-4 border-t border-line text-base leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {content || 'Chưa có nội dung bài viết.'}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-10 shadow-sm/80 space-y-6">
            
            {/* Tiêu đề */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                TIÊU ĐỀ BÀI VIẾT
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                required
                className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm font-semibold text-ink placeholder:text-faint focus:border-accent focus:bg-white focus:outline-none dark:bg-surface/[0.03] transition"
              />
            </div>

            {/* Slug & Chuyên mục */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  ĐƯỜNG DẪN TĨNH (SLUG)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="tieu-de-bai-viet"
                  className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-xs text-ink placeholder:text-faint focus:border-accent focus:bg-white focus:outline-none dark:bg-surface/[0.03] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                  CHUYÊN MỤC
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-xs text-ink focus:border-accent focus:outline-none transition"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                TRÍCH ĐOẠN NGẮN (EXCERPT)
              </label>
              <input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Mô tả tóm tắt nội dung bài viết trong 1-2 câu..."
                className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-xs text-ink placeholder:text-faint focus:border-accent focus:bg-white focus:outline-none dark:bg-surface/[0.03] transition"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                URL ẢNH BÌA
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" />
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-line bg-canvas pl-10 pr-3.5 py-2.5 text-xs text-ink placeholder:text-faint focus:border-accent focus:bg-white focus:outline-none dark:bg-surface/[0.03] transition"
                />
              </div>
            </div>

            {/* Nội dung chi tiết */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                NỘI DUNG CHI TIẾT
              </label>
              <textarea
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung bài viết đầy đủ tại đây..."
                required
                className="w-full rounded-2xl border border-line bg-canvas p-4 text-xs sm:text-sm text-ink placeholder:text-faint focus:border-accent focus:bg-white focus:outline-none dark:bg-surface/[0.03] transition leading-relaxed font-mono"
              />
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
