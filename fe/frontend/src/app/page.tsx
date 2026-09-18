'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Clock,
  Eye,
  Flame,
  Newspaper,
  PenLine,
  Search,
  Sparkles,
} from 'lucide-react';
import { postApi, PostItem, Category } from '@/services/postApi';
import { GRADIENT_BUTTON, GRADIENT_TEXT, chipStyle } from '@/lib/chipColors';
// Trang chủ tạp chí: masthead + marquee đọc nhiều, lead story sáng màu,
// hero reveal từng dòng, blob gradient trôi, manifesto CTA.

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

// Chip màu theo chuyên mục dùng chung từ lib/chipColors.

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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0 : 0.65, delay: reduce ? 0 : delay, ease: EASE_OUT }}
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
          layoutId="home-cat-pill"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className={`absolute inset-0 rounded-full ${GRADIENT_BUTTON}`}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function TrendingRow({ post, index }: { post: PostItem; index: number }) {
  return (
    <article className="group flex items-start gap-4 py-4 first:pt-0">
      <span
        className={`font-serif text-3xl font-extrabold leading-none transition group-hover:scale-110 ${
          index < 3
            ? 'bg-gradient-to-b from-[#b3131c] to-[#5c0a14] bg-clip-text text-transparent dark:from-[#ff6b7d] dark:to-[#a4161a]'
            : 'text-faint'
        }`}
      >
        0{index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/posts/${post.id}`} className="block">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink transition group-hover:text-accent">
            {post.title}
          </h3>
        </Link>
        <p className="mt-1.5 flex items-center gap-2 text-[11px] text-faint">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {viewCountOf(post).toLocaleString('vi-VN')}
          </span>
          <span aria-hidden>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {readTime(post.content)} phút
          </span>
        </p>
      </div>
    </article>
  );
}

function LatestCard({ post, category, catId }: { post: PostItem; category: string; catId?: number }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_6px_30px_-14px_rgba(217,4,41,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_-14px_rgba(166,13,32,0.28)]">
      <Link href={`/posts/${post.id}`} className="block overflow-hidden" tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverOf(post)}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full object-cover transition duration-700 group-hover:scale-[1.05]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between text-[11px]">
          <span className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wider ${chipStyle(catId)}`}>
            {category}
          </span>
          <span className="flex items-center gap-1 text-faint">
            <Clock className="h-3 w-3" /> {readTime(post.content)} phút
          </span>
        </div>
        <Link href={`/posts/${post.id}`} className="mt-3 block">
          <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug text-ink transition group-hover:text-accent">
            {post.title}
          </h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {(post as any).excerpt || post.content}
        </p>
        <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[11px] text-faint">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-[#a4161a] to-[#5c0a14] text-[9px] font-bold text-white">
            {((post as any).author_name || 'B').charAt(0).toUpperCase()}
          </span>
          {(post as any).author_name || 'Ban biên tập'}
          <span className="ml-auto">
            {(post as any).created_at
              ? new Date((post as any).created_at).toLocaleDateString('vi-VN')
              : ''}
          </span>
        </p>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const reduce = useReducedMotion();

  useEffect(() => {
    const now = new Date();
    setCurrentDate(
      new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(now),
    );

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
        console.error('Lỗi khi tải dữ liệu bài viết:', err);
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

  const trending = useMemo(
    () => [...posts].sort((a, b) => viewCountOf(b) - viewCountOf(a)).slice(0, 4),
    [posts],
  );

  const leadPost = filteredPosts[0] || null;
  const widePost = filteredPosts.length > 1 ? filteredPosts[1] : null;
  const gridPosts = filteredPosts.length > 2 ? filteredPosts.slice(2) : [];

  const heroLines = [
    <React.Fragment key="l1">Góc nhìn, tri thức và</React.Fragment>,
    <React.Fragment key="l2">
      <em className="italic text-accent">những câu chuyện</em>
    </React.Fragment>,
    <React.Fragment key="l3">
      <span className={GRADIENT_TEXT}>truyền cảm hứng.</span>
    </React.Fragment>,
  ];

  return (
    <div className="relative isolate bg-canvas">
      {/* Blob gradient trôi phía sau nội dung */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] overflow-hidden">
        <div className="animate-float absolute -top-32 left-[6%] h-96 w-96 rounded-full bg-red-600/20 blur-[110px]" />
        <div
          className="animate-float absolute top-16 right-[10%] h-80 w-80 rounded-full bg-rose-500/20 blur-[110px]"
          style={{ animationDelay: '1.4s' }}
        />
        <div
          className="animate-float absolute top-72 left-[40%] h-72 w-72 rounded-full bg-orange-400/20 blur-[110px]"
          style={{ animationDelay: '2.8s' }}
        />
      </div>

      {/* Masthead: ngày phát hành + marquee đọc nhiều */}
      <div className="border-b border-line bg-canvas/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2.5 text-xs sm:px-6 lg:px-8">
          <p className="flex shrink-0 items-center gap-2 capitalize text-muted">
            <Calendar className="h-3.5 w-3.5" />
            {currentDate || 'Hôm nay'}
          </p>

          {trending.length > 0 && (
            <div className="hidden min-w-0 flex-1 items-center gap-4 sm:flex">
              <span className="flex shrink-0 items-center gap-1.5 font-semibold text-accent">
                <Flame className="h-3 w-3" /> Đọc nhiều
              </span>
              <div className="group relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
                <div className="animate-marquee flex w-max items-center gap-10 group-hover:[animation-play-state:paused]">
                  {[...trending, ...trending].map((p, i) => (
                    <Link
                      key={`${p.id}-${i}`}
                      href={`/posts/${p.id}`}
                      className="flex items-center gap-1.5 text-muted transition hover:text-ink"
                    >
                      <span className="max-w-[260px] truncate">{p.title}</span>
                      <span className="flex items-center gap-1 text-[10px] text-faint">
                        <Eye className="h-3 w-3" />
                        {viewCountOf(p).toLocaleString('vi-VN')}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Khai đề tạp chí với hero reveal từng dòng */}
        <header className="flex flex-col justify-between gap-8 border-b border-line pb-10 pt-12 sm:pt-16 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              <Newspaper className="h-3.5 w-3.5" /> Tạp chí điện tử và Diễn đàn mở
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              {heroLines.map((line, i) => (
                <span key={i} className="block overflow-hidden pb-1">
                  <motion.span
                    className="block"
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: reduce ? 0 : 0.9,
                      delay: reduce ? 0 : 0.15 + i * 0.13,
                      ease: EASE_OUT,
                    }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.6, ease: EASE_OUT }}
            className="relative w-full md:w-96 md:shrink-0"
          >
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              aria-label="Tìm kiếm bài viết"
              className="w-full rounded-full border border-line bg-surface py-3 pl-11 pr-4 text-sm text-ink shadow-sm placeholder:text-faint transition focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </motion.div>
        </header>

        {/* Ticker chuyên mục */}
        <div className="scroll-slim relative flex items-center gap-1.5 overflow-x-auto border-b border-line py-3">
          <CategoryPill active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')}>
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

        {/* Số báo chính: lead story sáng màu + bảng đọc nhiều */}
        <section className="grid grid-cols-1 items-start gap-10 py-10 lg:grid-cols-12 lg:gap-12">
          {loading ? (
            <>
              <div className="aspect-[16/9] animate-pulse rounded-3xl bg-raised lg:col-span-8" />
              <div className="space-y-4 lg:col-span-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-8 animate-pulse rounded bg-raised" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-full animate-pulse rounded bg-raised" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-raised" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : !leadPost ? (
            <div className="rounded-3xl border border-dashed border-line p-16 text-center lg:col-span-12">
              <h3 className="text-base font-bold text-ink">Không tìm thấy bài viết nào</h3>
              <p className="mt-1 text-xs text-muted">
                Hãy thử chọn một chủ đề khác hoặc thay đổi từ khóa tìm kiếm.
              </p>
            </div>
          ) : (
            <>
              {/* Lead story: thẻ sáng lớn */}
              <Reveal className="lg:col-span-8">
                <article className="group overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_10px_45px_-16px_rgba(217,4,41,0.25)] transition duration-300 hover:shadow-[0_22px_60px_-16px_rgba(166,13,32,0.35)]">
                  <Link href={`/posts/${leadPost.id}`} className="block overflow-hidden" tabIndex={-1} aria-hidden>
                    <motion.img
                      src={coverOf(leadPost, 1200, 675)}
                      alt={leadPost.title}
                      initial={{ scale: 1.12 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: reduce ? 0 : 1.6, ease: EASE_OUT }}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </Link>
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      <span
                        className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wider ${chipStyle(
                          Number((leadPost as any).categoryId || (leadPost as any).category_id),
                        )}`}
                      >
                        {categoryName(Number((leadPost as any).categoryId || (leadPost as any).category_id))}
                      </span>
                      <span className="flex items-center gap-1 text-faint">
                        <Clock className="h-3 w-3" /> {readTime(leadPost.content)} phút đọc
                      </span>
                    </div>
                    <Link href={`/posts/${leadPost.id}`} className="mt-3 block">
                      <h2 className="font-serif text-2xl font-bold leading-tight text-ink transition group-hover:text-accent sm:text-4xl">
                        {leadPost.title}
                      </h2>
                    </Link>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted sm:text-base">
                      {(leadPost as any).excerpt || leadPost.content}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs">
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#a4161a] to-[#5c0a14] text-[11px] font-bold text-white">
                          {((leadPost as any).author_name || 'B').charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold text-ink">
                          {(leadPost as any).author_name || 'Ban biên tập'}
                        </span>
                        {(leadPost as any).created_at && (
                          <span className="text-faint">
                            {new Date((leadPost as any).created_at).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </span>
                      <Link
                        href={`/posts/${leadPost.id}`}
                        className="inline-flex items-center gap-1.5 font-bold text-accent transition hover:gap-2.5"
                      >
                        Đọc trọn vẹn <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>

              {/* Bảng xếp hạng đọc nhiều */}
              <Reveal delay={0.12} className="lg:col-span-4">
                <div className="rounded-3xl border border-line bg-surface p-6 shadow-[0_6px_30px_-14px_rgba(217,4,41,0.18)]">
                  <p className="flex items-center gap-2 border-b border-line pb-3 text-xs font-bold uppercase tracking-wider text-ink">
                    <Flame className="h-4 w-4 text-fuchsia-500" /> Đọc nhiều nhất tuần
                  </p>
                  <div className="divide-y divide-line">
                    {trending.map((p, i) => (
                      <TrendingRow key={p.id} post={p} index={i} />
                    ))}
                  </div>
                </div>
              </Reveal>
            </>
          )}
        </section>

        {/* Dòng bài viết mới */}
        {!loading && filteredPosts.length > 1 && (
          <section className="border-t border-line py-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
                Bản tin mới nhất
              </h2>
              <p className="text-xs text-muted">
                {filteredPosts.length - 1} bài viết
              </p>
            </div>

            {/* Ấn phẩm nổi bật thứ hai: card ngang lớn */}
            {widePost && (
              <Reveal className="mt-8">
                <article className="group grid overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_8px_36px_-16px_rgba(217,4,41,0.2)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-16px_rgba(166,13,32,0.3)] sm:grid-cols-2">
                  <Link href={`/posts/${widePost.id}`} className="block overflow-hidden" tabIndex={-1} aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverOf(widePost, 900, 620)}
                      alt=""
                      loading="lazy"
                      className="h-52 w-full object-cover transition duration-700 group-hover:scale-[1.05] sm:h-full sm:min-h-[300px]"
                    />
                  </Link>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span
                        className={`rounded-full px-2.5 py-1 font-bold uppercase tracking-wider ${chipStyle(
                          Number((widePost as any).categoryId || (widePost as any).category_id),
                        )}`}
                      >
                        {categoryName(Number((widePost as any).categoryId || (widePost as any).category_id))}
                      </span>
                      <span className="flex items-center gap-1 text-faint">
                        <Clock className="h-3 w-3" /> {readTime(widePost.content)} phút
                      </span>
                    </div>
                    <Link href={`/posts/${widePost.id}`} className="mt-3 block">
                      <h3 className="font-serif text-xl font-bold leading-snug text-ink transition group-hover:text-accent sm:text-2xl">
                        {widePost.title}
                      </h3>
                    </Link>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                      {(widePost as any).excerpt || widePost.content}
                    </p>
                    <p className="mt-5 flex items-center gap-2 text-[11px] text-faint">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#a4161a] to-[#5c0a14] text-[10px] font-bold text-white">
                        {((widePost as any).author_name || 'B').charAt(0).toUpperCase()}
                      </span>
                      {(widePost as any).author_name || 'Ban biên tập'}
                    </p>
                  </div>
                </article>
              </Reveal>
            )}

            {/* Lưới các bài còn lại */}
            {gridPosts.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post, i) => (
                  <Reveal key={post.id} delay={(i % 3) * 0.07}>
                    <LatestCard
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
          </section>
        )}

        {/* Manifesto */}
        <section className="border-t border-line py-20 text-center sm:py-24">
          <Reveal>
            <Sparkles className="mx-auto h-6 w-6 text-fuchsia-500" />
            <p className="mx-auto mt-5 max-w-3xl font-serif text-3xl font-bold leading-snug tracking-tight text-ink sm:text-5xl sm:leading-tight">
              Mỗi câu chuyện đều xứng đáng được{' '}
              <span className={GRADIENT_TEXT}>kể đúng cách</span>.
            </p>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Blog Platform chào đón mọi góc nhìn, từ trải nghiệm đời thường đến
              kiến thức chuyên sâu. Bàn viết của bạn luôn có một chỗ trống.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <motion.div whileHover={reduce ? undefined : { y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold ${GRADIENT_BUTTON}`}
                >
                  <PenLine className="h-4 w-4" /> Bắt đầu viết bài
                </Link>
              </motion.div>
              <motion.div whileHover={reduce ? undefined : { y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/posts"
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-7 py-3 text-sm font-semibold text-ink transition hover:border-accent/50 hover:text-accent"
                >
                  Khám phá tạp chí <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
