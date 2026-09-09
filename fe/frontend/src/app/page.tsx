'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  Eye,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Loader2,
  Flame,
  Newspaper,
  PenSquare,
  ChevronRight,
} from 'lucide-react';
import { postApi, PostItem, Category } from '@/services/postApi';

export default function HomePage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Hiển thị ngày tháng theo định dạng báo chí điện tử
    const now = new Date();
    const formatted = new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now);
    setCurrentDate(formatted);

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
        console.error('Lỗi khi tải dữ liệu bài viết:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Lọc bài viết theo danh mục & từ khóa
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

  // Bài viết tiêu điểm (Lead Story)
  const leadPost = useMemo(() => {
    return filteredPosts.length > 0 ? filteredPosts[0] : null;
  }, [filteredPosts]);

  // Danh sách đọc nhiều / Xu hướng (Top 4 bài có lượt xem cao nhất)
  const trendingPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const viewA = Number((a as any).view_count ?? (a as any).viewCount ?? 0);
        const viewB = Number((b as any).view_count ?? (b as any).viewCount ?? 0);
        return viewB - viewA;
      })
      .slice(0, 4);
  }, [posts]);

  // Danh sách bài viết tiếp theo cho lưới chính
  const mainGridPosts = useMemo(() => {
    return filteredPosts.length > 1 ? filteredPosts.slice(1) : [];
  }, [filteredPosts]);

  const getCategoryName = (catId?: number) => {
    if (!catId) return 'Đời sống & Xã hội';
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : 'Đời sống & Xã hội';
  };

  const calculateReadTime = (content?: string) => {
    if (!content) return 2;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 220));
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#06080e] dark:text-zinc-100 transition-colors duration-200">
      
      {/* 1. Masthead Sub-bar: Thanh thông tin nhật báo */}
      <div className="border-b border-zinc-200/80 bg-white/50 dark:border-white/[0.06] dark:bg-white/[0.01] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8 text-xs">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 capitalize">
            <Calendar className="h-3.5 w-3.5" />
            <span>{currentDate || 'Hôm nay'}</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3 w-3" /> Xu hướng:
            </span>
            <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition">Lối sống tối giản</span>
            <span>•</span>
            <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition">Kinh tế số</span>
            <span>•</span>
            <span className="hover:text-zinc-900 dark:hover:text-white cursor-pointer transition">Văn hóa & Nghệ thuật</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-12">
        
        {/* 2. Headline & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200/80 dark:border-white/[0.08] pb-8">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              <Newspaper className="h-4 w-4" /> Tạp chí điện tử & Diễn đàn mở
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white font-serif leading-tight">
              Góc nhìn, Tri thức & Những câu chuyện truyền cảm hứng.
            </h1>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
            />
          </div>
        </div>

        {/* 3. Category Navigation Ticker */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-200/60 dark:border-white/[0.05]">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Tất cả chủ đề
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(String(cat.id))}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === String(cat.id)
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 4. Editorial Spotlight: Lead Story (2/3) + Trending Sidebar (1/3) */}
        {loading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs font-medium tracking-wide">Đang đồng bộ bản tin xuất bản...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-white/10 p-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Không tìm thấy bài viết nào</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Hãy thử chọn một chủ đề khác hoặc thay đổi từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Cột chính: Bài viết tiêu điểm (Lead Feature) */}
            {leadPost && (
              <div className="lg:col-span-8">
                <article className="group flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02] transition hover:shadow-lg dark:hover:border-white/20">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <span className="rounded-md bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                        {getCategoryName(Number((leadPost as any).categoryId || (leadPost as any).category_id))}
                      </span>
                      <span className="text-zinc-400">•</span>
                      <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        {calculateReadTime(leadPost.content)} phút đọc
                      </span>
                    </div>

                    <Link href={`/posts/${leadPost.id}`} className="block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white leading-tight font-serif tracking-tight">
                        {leadPost.title}
                      </h2>
                    </Link>

                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-4">
                      {(leadPost as any).excerpt || leadPost.content}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold text-xs shadow-sm">
                        {((leadPost as any).author_name || (leadPost as any).authorName || 'TG').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">
                          {(leadPost as any).author_name || (leadPost as any).authorName || 'Tác giả bài viết'}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {(leadPost as any).created_at ? new Date((leadPost as any).created_at).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/posts/${leadPost.id}`}
                      className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all"
                    >
                      Đọc trọn vẹn <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              </div>
            )}

            {/* Cột phụ: Bảng xếp hạng đọc nhiều (Trending Column) */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 border-b border-zinc-200 dark:border-white/[0.08] pb-3">
                <Flame className="h-4 w-4" /> Đọc nhiều nhất tuần
              </div>

              <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.06]">
                {trendingPosts.map((post, idx) => (
                  <article key={post.id} className="py-4 first:pt-0 group flex items-start gap-4">
                    <span className="font-serif text-3xl font-extrabold text-zinc-300 dark:text-zinc-700 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition leading-none">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {getCategoryName(Number((post as any).categoryId || (post as any).category_id))}
                      </span>
                      <Link href={`/posts/${post.id}`} className="block">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {(post as any).view_count ?? (post as any).viewCount ?? 0}
                        </span>
                        <span>•</span>
                        <span>{calculateReadTime(post.content)} phút</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </aside>

          </div>
        )}

        {/* 5. Main Stories Feed: Lưới các bài viết đa chủ đề */}
        {mainGridPosts.length > 0 && (
          <section className="space-y-8 pt-6 border-t border-zinc-200/80 dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-serif text-zinc-950 dark:text-white">
                  Dòng chảy bài viết mới
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Khám phá các góc nhìn đa dạng từ văn hóa, phong cách sống đến kinh tế và xã hội.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {mainGridPosts.map((post) => {
                const raw = post as any;
                const catId = Number(raw.categoryId || raw.category_id);
                const viewCount = raw.view_count ?? raw.viewCount ?? 0;
                const author = raw.author_name || raw.authorName || 'Tác giả';

                return (
                  <article
                    key={post.id}
                    className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] hover:-translate-y-1 hover:shadow-md dark:hover:border-white/20 transition duration-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="rounded-md bg-zinc-100 dark:bg-white/5 px-2.5 py-0.5 font-semibold text-zinc-700 dark:text-zinc-300 text-[11px]">
                          {getCategoryName(catId)}
                        </span>
                        <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
                          <Clock className="h-3 w-3" /> {calculateReadTime(post.content)} phút
                        </span>
                      </div>

                      <Link href={`/posts/${post.id}`} className="block">
                        <h3 className="text-lg font-bold text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2 leading-snug font-serif">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                        {raw.excerpt || post.content}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-500 dark:text-zinc-400">
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
          </section>
        )}

        {/* 6. Call to Action: Mời đóng góp bài viết phong cách Tạp chí số */}
        <section className="rounded-3xl border border-zinc-200/80 bg-gradient-to-br from-zinc-100 to-white dark:from-white/[0.04] dark:to-white/[0.01] p-8 sm:p-12 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <PenSquare className="h-6 w-6" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-zinc-950 dark:text-white">
            Bạn có câu chuyện hay muốn chia sẻ cùng cộng đồng?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            OpenBlog chào đón tất cả các góc nhìn đa dạng về phong cách sống, kiến thức chuyên ngành, trải nghiệm du lịch và những suy ngẫm đời thường.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition"
            >
              Bắt đầu viết bài ngay <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}