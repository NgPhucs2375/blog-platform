'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Eye,
  Calendar,
  Clock,
  Tag,
  ArrowRight,
  TrendingUp,
  Globe2,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { postApi, PostItem, Category } from '@/services/postApi';

export default function PostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [cats, allPosts] = await Promise.all([
          postApi.getCategories(),
          postApi.getPosts(),
        ]);

        setCategories(cats || []);
        const publishedPosts = (allPosts || []).filter(
          (p) => (p.status || '').toLowerCase() === 'published'
        );
        setPosts(publishedPosts);
      } catch (err) {
        console.error('Lỗi khi tải bài viết:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const postCatId = Number((post as any).categoryId || (post as any).category_id);
      const matchCategory =
        selectedCategory === 'all' || postCatId === Number(selectedCategory);

      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query);

      return matchCategory && matchSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const featuredPost = useMemo(() => {
    return filteredPosts.length > 0 ? filteredPosts[0] : null;
  }, [filteredPosts]);

  const regularPosts = useMemo(() => {
    return filteredPosts.length > 1 ? filteredPosts.slice(1) : [];
  }, [filteredPosts]);

  const getCategoryName = (catId?: number) => {
    if (!catId) return 'Tổng hợp';
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : 'Tổng hợp';
  };

  const calculateReadTime = (content?: string) => {
    if (!content) return 2;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 220));
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#06080e] dark:text-zinc-100 transition-colors duration-200">
      
      {/* Vầng sáng Ambient nền */}
      <div className="absolute inset-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 pb-24 space-y-12">
        
        {/* Tiêu đề trang Khám phá */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
            <Globe2 className="h-3.5 w-3.5" />
            ẤN PHẨM & CÂU CHUYỆN ĐA LĨNH VỰC
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Khám phá bài viết
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
            Tổng hợp các bài viết, quan điểm và chia sẻ từ cộng đồng tác giả trên Blog Platform.
          </p>
        </div>

        {/* Thanh tìm kiếm & Bộ lọc chủ đề */}
        <div className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề, tác giả hoặc nội dung..."
              className="w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 py-3 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-white/[0.08] dark:bg-[#0c121e]/70 dark:text-white dark:placeholder-zinc-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]'
              }`}
            >
              Tất cả chủ đề
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === String(cat.id)
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách bài viết */}
        {loading ? (
          <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs font-medium tracking-wide">Đang nạp dữ liệu ấn phẩm...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-white/10 p-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Không có bài viết phù hợp</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Thử tìm kiếm với từ khóa khác hoặc chọn chuyên mục bài viết khác.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* TIÊU ĐIỂM MỚI NHẤT (Khắc phục triệt để lỗi màu nền tối) */}
            {featuredPost && (
              <div>
                <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="h-4 w-4" /> Tiêu điểm mới nhất
                </div>

                <Link
                  href={`/posts/${featuredPost.id}`}
                  className="group relative block overflow-hidden rounded-3xl border border-zinc-200/80 bg-white dark:bg-[#0c121e]/90 dark:border-white/[0.08] p-6 sm:p-10 shadow-sm hover:shadow-xl dark:hover:border-white/20 transition-all duration-200"
                >
                  <div className="flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className="rounded-md border border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px]">
                          {getCategoryName(Number((featuredPost as any).categoryId || (featuredPost as any).category_id))}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                          <Eye className="h-3.5 w-3.5" />
                          {(featuredPost as any).view_count ?? (featuredPost as any).viewCount ?? 0} lượt xem
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-600">•</span>
                        <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                          <Clock className="h-3.5 w-3.5" />
                          {calculateReadTime(featuredPost.content)} phút đọc
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-600">•</span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {(featuredPost as any).created_at ? new Date((featuredPost as any).created_at).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                        </span>
                      </div>

                      {/* Tiêu đề: Đảm bảo hiển thị sắc nét ở cả Dark & Light */}
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition leading-snug">
                        {featuredPost.title}
                      </h2>

                      <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-3 max-w-3xl">
                        {(featuredPost as any).excerpt || featuredPost.content}
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                      Bắt đầu đọc <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* DANH SÁCH BÀI VIẾT TIẾP THEO */}
            {regularPosts.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Khám phá thêm bài viết
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map((post) => {
                    const raw = post as any;
                    const catId = Number(raw.categoryId || raw.category_id);
                    const viewCount = raw.view_count ?? raw.viewCount ?? 0;
                    const author = raw.author_name || raw.authorName || 'Tác giả';

                    return (
                      <article
                        key={post.id}
                        className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white dark:bg-[#0c121e]/70 dark:border-white/[0.06] p-6 shadow-sm hover:-translate-y-1 hover:shadow-md dark:hover:border-white/20 transition-all duration-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="rounded-md border border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-600 dark:text-indigo-400 text-[11px]">
                              {getCategoryName(catId)}
                            </span>
                            <span className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-[11px]">
                              <Eye className="h-3 w-3" /> {viewCount}
                            </span>
                          </div>

                          <Link href={`/posts/${post.id}`} className="block">
                            <h4 className="text-base font-bold text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2 leading-snug">
                              {post.title}
                            </h4>
                          </Link>

                          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                            {raw.excerpt || post.content}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs">
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Bởi {author}
                          </span>
                          <Link
                            href={`/posts/${post.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            Đọc tiếp <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}