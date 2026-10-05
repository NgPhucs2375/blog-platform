'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  CaretLeft,
  CaretRight,
  Clock,
  Eye,
  Flame,
  Newspaper,
  Pen,
  MagnifyingGlass,
  Sparkle,
} from '@phosphor-icons/react';
import { postApi, PostItem, Category } from '@/services/postApi';
import { GRADIENT_BUTTON, GRADIENT_TEXT, chipStyle } from '@/lib/chipColors';
import { EVENT_TICKETS, PROMO_BANNER } from '@/config/promotions';
import { EventTicketList, PromoBanner } from '@/components/Promo';
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
            ? 'bg-gradient-to-b from-[#0d9488] to-[#042f2e] bg-clip-text text-transparent dark:from-[#ff6b7d] dark:to-[#0f766e]'
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
      <Link href={`/posts/${post.id}`} className="relative block overflow-hidden" tabIndex={-1} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverOf(post)}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full object-cover transition duration-700 group-hover:scale-[1.05]"
        />
        {/* Preview nhẹ khi hover: scrim + nhãn đọc ngay trượt lên */}
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
          <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#042f2e] text-[9px] font-bold text-white">
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
  const reduce = useReducedMotion();

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

  // Carousel hero: 5 ảnh từ các bài nổi bật, tự chuyển mỗi 5 giây (dừng khi hover)
  const heroSlides = useMemo(() => {
    const pool = trending.length >= 3 ? trending : posts.slice(0, 5);
    return pool.slice(0, 5);
  }, [trending, posts]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [slidePaused, setSlidePaused] = useState(false);
  useEffect(() => {
    // Tự chuyển chạy cả khi prefers-reduced-motion (chỉ hiệu ứng chuyển mới bị lược bỏ)
    if (slidePaused || heroSlides.length < 2) return;
    const timer = setInterval(
      () => setSlideIndex((i) => (i + 1) % heroSlides.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [slidePaused, heroSlides.length]);
  const goSlide = (dir: 1 | -1) =>
    setSlideIndex((i) => (i + dir + heroSlides.length) % heroSlides.length);

  const leadPost = filteredPosts[0] || null;
  const widePost = filteredPosts.length > 1 ? filteredPosts[1] : null;
  const gridPosts = filteredPosts.length > 2 ? filteredPosts.slice(2) : [];

  return (
    <div className="relative isolate bg-canvas">
      {/* Blob gradient trôi phía sau nội dung — độ phủ nhẹ, tông vang */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] overflow-hidden">
        <div className="animate-float absolute -top-28 left-[8%] h-96 w-96 rounded-full bg-[#0d9488]/10 blur-[120px]" />
        <div
          className="animate-float absolute top-16 right-[12%] h-80 w-80 rounded-full bg-[#115e59]/10 blur-[120px]"
          style={{ animationDelay: '1.6s' }}
        />
        <div
          className="animate-float absolute top-64 left-[42%] h-72 w-72 rounded-full bg-amber-200/50 blur-[120px]"
          style={{ animationDelay: '3.2s' }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero: khối chữ clean + một nút nhấn, cạnh composition ảnh phong cách */}
        <header className="grid items-center gap-10 border-b border-line py-14 sm:py-16 lg:grid-cols-[0.88fr_1.12fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.7, ease: EASE_OUT }}
          >
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              <Newspaper className="h-3.5 w-3.5" /> Tạp chí điện tử và Diễn đàn mở
            </p>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.15] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
              Góc nhìn, tri thức và{' '}
              <em className="italic text-accent">những câu chuyện</em> truyền cảm
              hứng.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              Không gian xuất bản mở cho người viết Việt: đọc những bài chọn lọc,
              theo chân chuyên mục bạn thích và bắt đầu bản thảo đầu tiên của
              riêng mình.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <motion.div
                whileHover={reduce ? undefined : { y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/posts"
                  className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold ${GRADIENT_BUTTON}`}
                >
                  Bắt đầu đọc <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-ink underline decoration-line decoration-2 underline-offset-4 transition hover:text-accent hover:decoration-accent"
              >
                Hoặc viết bài ngay
              </Link>
            </div>

            <p className="mt-9 flex items-center text-xs text-faint">
              <span>
                <b className="font-bold text-ink">{posts.length}</b> bài viết
              </span>
              <span aria-hidden className="mx-4 h-3.5 w-px bg-line" />
              <span>
                <b className="font-bold text-ink">{categories.length}</b> chuyên
                mục
              </span>
              <span aria-hidden className="mx-4 h-3.5 w-px bg-line" />
              <span>Cập nhật liên tục</span>
            </p>
          </motion.div>

          {/* Composition ảnh: carousel tự chuyển + mũi tên + lưới chấm */}
          <div
            className="group relative hidden h-[520px] lg:block"
            onMouseEnter={() => setSlidePaused(true)}
            onMouseLeave={() => setSlidePaused(false)}
          >
            <div
              aria-hidden
              className="absolute inset-4 rounded-[2.5rem] bg-[radial-gradient(circle_at_65%_35%,rgba(13,148,136,0.14),transparent_65%)]"
            />
            <div
              aria-hidden
              className="absolute inset-x-4 bottom-2 top-20 rounded-[2rem] bg-[radial-gradient(circle,rgba(33,27,25,0.14)_1px,transparent_1px)] [background-size:20px_20px]"
            />

            {loading ? (
              <div className="absolute inset-0 animate-pulse rounded-[2rem] bg-raised" />
            ) : heroSlides.length > 0 ? (
              <>
                {/* Khung carousel chiếm toàn cột phải */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, rotate: 4 }}
                  animate={{ opacity: 1, scale: 1, rotate: 1.5 }}
                  transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.25, ease: EASE_OUT }}
                  whileHover={reduce ? undefined : { rotate: 0 }}
                  className="absolute inset-0 overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[0_36px_80px_-28px_rgba(19,78,74,0.45)]"
                >
                  {heroSlides.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={false}
                      animate={{
                        opacity: i === slideIndex ? 1 : 0,
                        scale: i === slideIndex ? 1 : 1.08,
                      }}
                      transition={{
                        opacity: { duration: reduce ? 0 : 0.8, ease: EASE_OUT },
                        scale: { duration: reduce ? 0 : 7, ease: 'linear' },
                      }}
                      style={{ willChange: 'opacity, transform' }}
                      className="absolute inset-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverOf(post, 1000, 750)}
                        alt={post.title}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        className="h-full w-full object-cover"
                      />
                    </motion.div>
                  ))}

                  {/* Scrim nhẹ cho chữ đọc được, không dùng đen tuyền */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#042f2e]/75 via-transparent to-transparent" />

                  {/* Tên bài đang hiển thị */}
                  <Link
                    href={`/posts/${heroSlides[slideIndex].id}`}
                    className="absolute inset-x-0 bottom-0 block p-6 sm:p-7"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                      {categoryName(
                        Number(
                          (heroSlides[slideIndex] as any).categoryId ||
                            (heroSlides[slideIndex] as any).category_id,
                        ),
                      )}
                    </p>
                    <h2 className="mt-1.5 line-clamp-2 font-serif text-xl font-bold leading-snug text-white sm:text-2xl">
                      {heroSlides[slideIndex].title}
                    </h2>
                  </Link>

                  {/* Chỉ số slide + chấm chuyển */}
                  <div className="absolute right-5 top-5 rounded-full border border-white/25 bg-white/10 px-3 py-1 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
                    {String(slideIndex + 1).padStart(2, '0')} /{' '}
                    {String(heroSlides.length).padStart(2, '0')}
                  </div>
                  <div className="absolute bottom-5 right-5 flex items-center gap-1.5">
                    {heroSlides.map((post, i) => (
                      <button
                        key={post.id}
                        onClick={() => setSlideIndex(i)}
                        aria-label={`Chuyển đến ảnh ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === slideIndex
                            ? 'w-6 bg-white'
                            : 'w-1.5 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Mũi tên trước / sau — hiện khi hover khung ảnh */}
                  <button
                    onClick={() => goSlide(-1)}
                    aria-label="Ảnh trước"
                    className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/15 text-white opacity-0 backdrop-blur-md transition hover:bg-white/30 group-hover:opacity-100"
                  >
                    <CaretLeft className="h-5 w-5" weight="bold" />
                  </button>
                  <button
                    onClick={() => goSlide(1)}
                    aria-label="Ảnh kế tiếp"
                    className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/15 text-white opacity-0 backdrop-blur-md transition hover:bg-white/30 group-hover:opacity-100"
                  >
                    <CaretRight className="h-5 w-5" weight="bold" />
                  </button>
                </motion.div>
              </>
            ) : null}
          </div>
        </header>

        {/* Ticker chuyên mục + ô tìm kiếm gọn */}
        <div className="relative flex items-center justify-between gap-6 border-b border-line py-3">
          <div className="scroll-slim flex min-w-0 items-center gap-1.5 overflow-x-auto">
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

          <div className="relative hidden w-64 shrink-0 md:block">
            <MagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài viết..."
              aria-label="Tìm kiếm bài viết"
              className="w-full rounded-full border border-line bg-surface py-2 pl-10 pr-4 text-xs text-ink shadow-sm placeholder:text-faint transition focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
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
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#042f2e] text-[11px] font-bold text-white">
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
          <section id="home-feed" className="scroll-mt-24 border-t border-line py-12">
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
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#0f766e] to-[#042f2e] text-[10px] font-bold text-white">
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

        {/* Banner quảng cáo + vé sự kiện: đổi nội dung trong src/config/promotions.ts */}
        {!loading && (
          <section id="home-events" className="scroll-mt-24 border-t border-line py-12">
            <PromoBanner data={PROMO_BANNER} />

            <div className="mt-10 flex items-end justify-between gap-4">
              <h2 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
                Sự kiện & Workshop
              </h2>
              <p className="text-xs text-muted">Vé miễn phí cho thành viên</p>
            </div>
            <div className="mt-6">
              <EventTicketList tickets={EVENT_TICKETS} />
            </div>
          </section>
        )}

        {/* Manifesto */}
        <section className="border-t border-line py-20 text-center sm:py-24">
          <Reveal>
            <Sparkle className="mx-auto h-6 w-6 text-fuchsia-500" />
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
                  <Pen className="h-4 w-4" /> Bắt đầu viết bài
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
