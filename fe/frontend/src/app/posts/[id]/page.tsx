'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Tag,
  Clock,
  Share2,
  Bookmark,
  Sparkles,
  Loader2,
  Check,
  BookOpen,
  User,
  Heart,
} from 'lucide-react';
import { postApi, PostItem, Category } from '@/services/postApi';

export default function PostDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [post, setPost] = useState<PostItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    async function loadPostDetail() {
      if (!id) return;
      try {
        setLoading(true);
        const [cats, postData] = await Promise.all([
          postApi.getCategories(),
          postApi.getPostById(id),
        ]);

        setCategories(cats || []);

        if (postData) {
          setPost(postData);
          postApi.trackView(id).then((res) => {
            if (res?.viewCount) {
              setPost((prev: any) =>
                prev ? { ...prev, viewCount: res.viewCount, view_count: res.viewCount } : prev
              );
            }
          });
        }
      } catch (err) {
        console.error('Không thể tải chi tiết bài viết:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPostDetail();
  }, [id]);

  const categoryName = useMemo(() => {
    if (!post || !categories.length) return 'Đời sống & Xã hội';
    const catId = Number((post as any).categoryId || (post as any).category_id);
    const matched = categories.find((c) => c.id === catId);
    return matched ? matched.name : 'Đời sống & Xã hội';
  }, [post, categories]);

  const readingTime = useMemo(() => {
    if (!post?.content) return 2;
    const words = post.content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 220));
  }, [post?.content]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-[#06080e] text-zinc-600 dark:text-zinc-400 transition-colors">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-medium tracking-wide">Đang mở trang bản thảo...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#06080e] px-4 py-24 text-center transition-colors">
        <div className="mx-auto max-w-md space-y-4">
          <BookOpen className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600" />
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Ấn phẩm không tồn tại</h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            Bài viết có thể đã được gỡ bỏ hoặc thay đổi liên kết truy cập.
          </p>
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại danh mục bài viết
          </Link>
        </div>
      </div>
    );
  }

  const rawPost = post as any;
  const authorName = rawPost.author_name || rawPost.authorName || 'Tác giả ấn phẩm';
  const viewCount = rawPost.view_count ?? rawPost.viewCount ?? 0;
  const createdAt = rawPost.created_at || rawPost.createdAt;

  return (
    <article className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#06080e] dark:text-zinc-100 transition-colors duration-200 pb-24">
      
      {/* Vùng phát quang dịu mắt phía trên */}
      <div className="absolute inset-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-10">
        
        {/* Navigation bar nhỏ trên đầu bài */}
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/posts"
            className="group inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
            Tất cả bài viết
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                liked
                  ? 'border-rose-500/30 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{liked ? 'Đã lưu' : 'Thích'}</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:border-white/20 dark:hover:text-white transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? 'Đã sao chép link' : 'Chia sẻ'}</span>
            </button>
          </div>
        </div>

        {/* Khung tiêu đề bài viết chuẩn Editorial Headline */}
        <header className="space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              <Tag className="h-3 w-3" />
              {categoryName}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">•</span>
            <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} phút đọc
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-zinc-950 dark:text-white font-serif leading-[1.25]">
            {post.title}
          </h1>

          {/* Thanh tác giả & ngày xuất bản */}
          <div className="flex items-center justify-between border-y border-zinc-200/80 dark:border-white/[0.08] py-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">
                  {authorName}
                </p>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                  <Calendar className="h-3 w-3" />
                  <span>{createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : 'Vừa cập nhật'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <Eye className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <span>{viewCount} lượt đọc</span>
            </div>
          </div>
        </header>

        {/* Nội dung bài viết phong cách Tạp chí điện tử */}
        <main className="mt-10">
          <div className="text-[17px] sm:text-[19px] leading-[1.85] text-zinc-800 dark:text-zinc-200 font-normal whitespace-pre-wrap selection:bg-indigo-500/20 dark:selection:bg-indigo-500/30 tracking-[0.01em]">
            {post.content}
          </div>
        </main>

        {/* Chân bài viết: Khung tác giả uy tín (Author Card) */}
        <footer className="mt-16 border-t border-zinc-200/80 dark:border-white/[0.08] pt-10">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-base font-bold shadow-sm">
                {authorName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-950 dark:text-white">Ấn phẩm của {authorName}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                  Cộng tác viên nội dung đóng góp các bài phân tích, trải nghiệm và quan điểm đa chiều trên OpenBlog.
                </p>
              </div>
            </div>

            <Link
              href="/posts"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white transition whitespace-nowrap"
            >
              Khám phá thêm ấn phẩm
            </Link>
          </div>
        </footer>

      </div>
    </article>
  );
}