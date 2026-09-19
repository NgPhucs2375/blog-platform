'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Clock, Eye, MagnifyingGlass } from '@phosphor-icons/react';
import { postApi, PostItem, Category } from '@/services/postApi';
import { chipStyle } from '@/lib/chipColors';

// Trang khám phá: archive toàn bộ ấn phẩm với tìm kiếm + lọc chuyên mục.

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const coverOf = (p: PostItem, w = 800, h = 450) =>
  (p as any).cover_image ||
  p.coverImage ||
  `https://picsum.photos/seed/${p.slug || p.id}/${w}/${h}`;

const viewCountOf = (p: PostItem) =>
  Number((p as any).view_count ?? p.viewCount ?? 0);

function readTime(content?: string) {
  if (!content) return 2;
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220));
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition ${
        active ? 'text-white' : 'text-muted hover:text-ink'
      }`}
    >
      {active && (
        <motion.span
          layoutId="posts-cat-pill"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0f766e] via-[#134e4a] to-[#042f2e] shadow-md shadow-[#0f766e]/30"
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function ArchiveCard({ post, category, catId }: { post: PostItem; category: string; catId?: number }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/posts/${post.id}`} className="relative block overflow-hidden" tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverOf(post)}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute inset-0 flex items-end bg-gradient-to-t from-[#042f2e]/70 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex translate-y-3 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[11px] font-bold text-accent shadow-md transition-transform duration-300 group-hover:translate-y-0">
            Đọc ngay <ArrowRight className="h-3 w-3" />
          </span>
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between text-[11px]">
          <span className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wider ${chipStyle(catId)}`}>
            {category}
          </span>
          <span className="flex items-center gap-1 text-faint">
            <Eye className="h-3 w-3" /> {viewCountOf(post).toLocaleString('vi-VN')}
          </span>
        </div>
        <Link href={`/posts/${post.id}`} className="mt-2.5 block">
          <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug text-ink transition group-hover:text-accent">
            {post.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {(post as any).excerpt || post.content}
        </p>
        <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[11px] text-faint">
          {(post as any).author_name || 'Ban biên tập'}
          <span className="ml-auto flex items-center gap-1">
            <Clock className="h-3 w-3" /> {readTime(post.content)} phút
          </span>
        </p>
      </div>
    </article>
  );
}

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
        setPosts(
          (allPosts || []).filter((p) => (p.status || '').toLowerCase() === 'published'),
        );
      } catch (err) {
        console.error('Lỗi khi tải bài viết:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categoryName = (catId?: number) =>
    categories.find((c) => c.id === catId)?.name || 'Tổng hợp';

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const catId = Number((post as any).categoryId || (post as any).category_id);
      const matchCategory = selectedCategory === 'all' || catId === Number(selectedCategory);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        (post.content || '').toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const featuredPost = filteredPosts[0] || null;
  const restPosts = filteredPosts.slice(1);

  return (
    <div className="relative isolate bg-canvas">
      {/* Blob gradient trôi phía sau nội dung */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden">
        <div className="animate-float absolute -top-28 left-[12%] h-80 w-80 rounded-full bg-accent/20 blur-[110px]" />
        <div
          className="animate-float absolute top-10 right-[14%] h-72 w-72 rounded-full bg-orange-400/20 blur-[110px]"
          style={{ animationDelay: '2s' }}
        />
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Khai đề */}
        <header className="border-b border-line pb-10 pt-12 sm:pt-16">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Khám phá bài viết
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Toàn bộ ấn phẩm từ cộng đồng tác giả của Blog Platform, xếp theo
            thời gian xuất bản.
          </p>
        </header>

        {/* Thanh công cụ */}
        <div className="flex flex-col gap-4 border-b border-line py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <MagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
              aria-label="Tìm kiếm bài viết"
              className="w-full rounded-full border border-line bg-surface py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-faint transition focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div className="scroll-slim flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <CategoryPill
              active={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
            >
              Tất cả chủ đề
            </CategoryPill>
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                active={selectedCategory === String(cat.id)}
                onClick={() => setSelectedCategory(String(cat.id))}
              >
                {cat.name}
              </CategoryPill>
            ))}
          </div>
        </div>

        {/* Kết quả */}
        {loading ? (
          <div className="mt-10 space-y-8">
            <div className="grid animate-pulse gap-6 rounded-3xl border border-line sm:grid-cols-2">
              <div className="h-52 bg-raised sm:h-full" />
              <div className="space-y-3 p-6">
                <div className="h-3 w-24 bg-raised rounded" />
                <div className="h-6 w-full bg-raised rounded" />
                <div className="h-3 w-3/4 bg-raised rounded" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[16/9] rounded-2xl bg-raised" />
                  <div className="mt-3 h-4 w-3/4 rounded bg-raised" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-raised" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-line p-16 text-center">
            <h3 className="text-base font-bold text-ink">Không có bài viết nào</h3>
            <p className="mt-1 text-xs text-muted">
              Thử đổi từ khóa hoặc chọn chuyên mục khác để xem thêm.
            </p>
          </div>
        ) : (
          <>
            {/* Ấn phẩm nổi bật: card ngang */}
            {featuredPost && (
              <Reveal className="mt-10">
                <article className="group grid overflow-hidden rounded-3xl border border-line bg-surface transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:grid-cols-2">
                  <Link
                    href={`/posts/${featuredPost.id}`}
                    className="block overflow-hidden"
                    tabIndex={-1}
                    aria-hidden
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverOf(featuredPost, 900, 620)}
                      alt=""
                      className="h-52 w-full object-cover saturate-[.85] transition duration-700 group-hover:scale-[1.04] sm:h-full sm:min-h-[280px]"
                    />
                  </Link>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span
                        className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wider ${chipStyle(
                          Number(
                            (featuredPost as any).categoryId ||
                              (featuredPost as any).category_id,
                          ),
                        )}`}
                      >
                        {categoryName(
                          Number(
                            (featuredPost as any).categoryId ||
                              (featuredPost as any).category_id,
                          ),
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-faint">
                        <Clock className="h-3 w-3" /> {readTime(featuredPost.content)} phút
                      </span>
                    </div>
                    <Link href={`/posts/${featuredPost.id}`} className="mt-3 block">
                      <h2 className="font-serif text-xl font-bold leading-snug text-ink transition group-hover:text-accent sm:text-2xl">
                        {featuredPost.title}
                      </h2>
                    </Link>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                      {(featuredPost as any).excerpt || featuredPost.content}
                    </p>
                    <p className="mt-5 flex items-center gap-2 text-[11px] text-faint">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-raised text-[10px] font-bold text-muted">
                        {((featuredPost as any).author_name || 'B').charAt(0).toUpperCase()}
                      </span>
                      {(featuredPost as any).author_name || 'Ban biên tập'}
                    </p>
                  </div>
                </article>
              </Reveal>
            )}

            {/* Lưới archive */}
            {restPosts.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                {restPosts.map((post, i) => (
                  <Reveal key={post.id} delay={(i % 3) * 0.06}>
                    <ArchiveCard
                      post={post}
                      category={categoryName(
                        Number((post as any).categoryId || (post as any).category_id),
                      )}
                      catId={Number((post as any).categoryId || (post as any).category_id)}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
