'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useSpring } from 'motion/react';
import {
  ArrowLeft,
  BookmarkSimple,
  Check,
  Clock,
  Eye,
  Heart,
  ChatCircleText,
  PaperPlaneTilt,
  ShareNetwork,
  Repeat,
  UserPlus,
  UserCheck,
} from '@phosphor-icons/react';
import { postApi, PostItem, Category } from '@/services/postApi';
import { chipStyle } from '@/lib/chipColors';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import AuthorHoverCard from '@/components/AuthorHoverCard';

// Trang đọc bài: thanh tiến độ đọc, typography Lora với drop cap,
// khối tác giả và thảo luận. Rose chỉ dùng cho semantic "thích".

const coverOf = (p: PostItem, w = 1400, h = 700) =>
  (p as any).cover_image ||
  p.coverImage ||
  `https://picsum.photos/seed/${p.slug || p.id}/${w}/${h}`;

function readTime(content?: string) {
  if (!content) return 2;
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}
function paragraphsOf(content: string): string[] {
  return content
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX, willChange: 'transform' }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#0d9488] via-[#134e4a] to-[#042f2e]"
    />
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;

  const [post, setPost] = useState<PostItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [repostsCount, setRepostsCount] = useState(0);
  const [followingAuthor, setFollowingAuthor] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<{ id: number; author: string; time: string; content: string }[]>([]);
  const [interactionMessage, setInteractionMessage] = useState('');
  const [interacting, setInteracting] = useState(false);
  useEffect(() => {
    if (!post?.id) return;
    let active = true;
    setLikeCount(Number((post as PostItem & { likesCount?: number }).likesCount || 0));
    setRepostsCount(Number(post.repostsCount || 0));
    setFollowersCount(Number(post.followersCount || 0));
    setLiked(false); setBookmarked(false); setComments([]);
    api.get(`/v1/posts/${post.id}/comments`).then(res => {
      if (active) setComments(res.data.data.map((c: { id: number; userName?: string; createdAt: string; content: string }) => ({ id: c.id, author: c.userName || 'Người dùng', time: new Date(c.createdAt).toLocaleString('vi-VN'), content: c.content })));
    }).catch(() => { if (active) setInteractionMessage('Không tải được bình luận.'); });
    if (user) api.get(`/v1/posts/${post.id}/interaction`).then(res => { if (active) { setLiked(res.data.data.liked); setBookmarked(res.data.data.bookmarked); setReposted(res.data.data.reposted); setFollowingAuthor(res.data.data.followingAuthor); setLikeCount(res.data.data.likesCount); setRepostsCount(res.data.data.repostsCount); setFollowersCount(res.data.data.followersCount); } }).catch(() => {});
    return () => { active = false; };
  }, [post?.id, user]);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    async function loadPostData() {
      if (!id || id === 'undefined') return;
      try {
        setLoading(true);
        const [postData, cats, allPosts] = await Promise.all([
          postApi.getPostById(id),
          postApi.getCategories().catch(() => []),
          postApi.getPosts().catch(() => []),
        ]);

        if (!postData) {
          setLoading(false);
          return;
        }

        setCategories(cats || []);
        setRelatedPosts(
          (allPosts || [])
            .filter((p: any) => String(p.id) !== String(id))
            .slice(0, 3),
        );

        // Đếm lượt đọc đúng 1 lần duy nhất trong phiên
        const sessionKey = `viewed_post_${id}`;
        const alreadyViewedInSession = sessionStorage.getItem(sessionKey);

        if (!hasTrackedRef.current && !alreadyViewedInSession) {
          hasTrackedRef.current = true;
          sessionStorage.setItem(sessionKey, 'true');
          try {
            const result = await postApi.trackView(postData.id);
            const updatedViews =
              result?.viewCount ??
              Number((postData as any).view_count ?? postData.viewCount ?? 0) + 1;
            setPost({
              ...postData,
              viewCount: updatedViews,
              view_count: updatedViews,
            } as any);
          } catch {
            setPost(postData);
          }
        } else {
          setPost(postData);
        }
      } catch (err) {
        console.error('Lỗi khi nạp chi tiết bài viết:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPostData();
  }, [id]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = async () => {
    if (!user) { router.push('/login'); return; }
    if (!post || interacting) return;
    setInteracting(true);
    try {
      const res = liked ? await api.delete(`/v1/posts/${post.id}/likes`) : await api.post(`/v1/posts/${post.id}/likes`);
      setLiked(res.data.data.liked); setLikeCount(res.data.data.likesCount);
    } catch { setInteractionMessage('Không lưu được lượt thích. Hãy thử lại.'); }
    finally { setInteracting(false); }
  };
  const handleBookmark = async () => {
    if (!user) { router.push('/login'); return; }
    if (!post || interacting) return;
    setInteracting(true);
    try {
      if (bookmarked) await api.delete(`/v1/posts/${post.id}/bookmark`); else await api.put(`/v1/posts/${post.id}/bookmark`);
      setBookmarked(!bookmarked);
    } catch { setInteractionMessage('Không lưu được bài viết. Hãy thử lại.'); }
    finally { setInteracting(false); }
  };
  const handleRepost = async () => {
    if (!user) { router.push('/login'); return; }
    if (!post || interacting) return;
    setInteracting(true);
    try {
      const res = reposted ? await api.delete(`/v1/posts/${post.id}/repost`) : await api.post(`/v1/posts/${post.id}/repost`);
      setReposted(res.data.data.reposted); setRepostsCount(res.data.data.repostsCount);
      setInteractionMessage(res.data.data.reposted ? 'Đã đăng lại bài viết.' : 'Đã gỡ bài viết đăng lại.');
    } catch { setInteractionMessage('Không đăng lại được. Hãy thử lại.'); }
    finally { setInteracting(false); }
  };
  const handleFollow = async () => {
    if (!user) { router.push('/login'); return; }
    const authorId = Number(post?.authorId ?? (post as any)?.author_id);
    if (!authorId || authorId === Number(user.id) || interacting) return;
    setInteracting(true);
    try {
      const res = followingAuthor ? await api.delete(`/v1/authors/${authorId}/follow`) : await api.post(`/v1/authors/${authorId}/follow`);
      setFollowingAuthor(res.data.data.following); setFollowersCount(res.data.data.followersCount);
    } catch { setInteractionMessage('Không cập nhật được theo dõi. Hãy thử lại.'); }
    finally { setInteracting(false); }
  };
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!commentText.trim() || !post || interacting) return;
    setInteracting(true); setInteractionMessage('');
    try {
      await api.post(`/v1/posts/${post.id}/comments`, { content: commentText.trim() });
      setCommentText(''); setInteractionMessage('Bình luận đã được gửi và đang chờ duyệt.');
    } catch { setInteractionMessage('Không gửi được bình luận. Hãy thử lại.'); }
    finally { setInteracting(false); }
  };
  const paragraphs = post?.content ? paragraphsOf(post.content) : [];

  if (loading) {
    return (
      <div className="bg-canvas">
        <ReadingProgress />
        <div className="mx-auto max-w-[760px] px-4 pt-16 sm:px-6">
          <div className="h-4 w-24 animate-pulse rounded bg-raised" />
          <div className="mt-6 h-12 w-full animate-pulse rounded bg-raised" />
          <div className="mt-3 h-12 w-2/3 animate-pulse rounded bg-raised" />
          <div className="mt-8 aspect-[16/8] animate-pulse rounded-3xl bg-raised" />
          <div className="mt-8 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-3.5 animate-pulse rounded bg-raised"
                style={{ width: `${94 - (i % 3) * 14}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-canvas">
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink">Không tìm thấy ấn phẩm</h2>
          <p className="max-w-sm text-sm text-muted">
            Bài viết có thể đã bị gỡ hoặc đường dẫn không còn đúng.
          </p>
          <Link
            href="/posts"
            className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-ink transition hover:bg-accent-hover"
          >
            Khám phá các bài viết khác
          </Link>
        </div>
      </div>
    );
  }

  const raw = post as any;
  const currentViews = post.viewCount ?? raw.view_count ?? 0;
  const categoryName =
    categories.find((c) => c.id === (post.categoryId ?? raw.category_id))?.name || 'Tổng hợp';
  const authorName = raw.author_name || post.authorName || 'Ban biên tập';
  const authorUsername = post.author?.username || raw.author?.username || raw.author_name || post.authorName;
  const publishDate = raw.created_at || post.createdAt
    ? new Date(raw.created_at || post.createdAt).toLocaleDateString('vi-VN')
    : 'Mới xuất bản';

  return (
    <div className="bg-canvas pb-24">
      <ReadingProgress />

      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
        {/* Thanh công cụ đọc */}
        <div className="flex items-center justify-between py-5">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted shadow-sm transition hover:text-ink"
            title="Chia sẻ bài viết"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <ShareNetwork className="h-3.5 w-3.5" />
            )}
            <span>{copied ? 'Đã sao chép link' : 'Chia sẻ'}</span>
          </button>
        </div>

        {/* Đề bài */}
        <header className="border-b border-line pb-8">
          <span
            className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${chipStyle(
              Number(post.categoryId ?? raw.category_id),
            )}`}
          >
            {categoryName}
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold leading-[1.15] tracking-tight text-ink sm:text-5xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <AuthorHoverCard username={authorUsername} name={authorName} className="inline-flex">
            <Link href={authorUsername ? `/authors/${encodeURIComponent(authorUsername)}` : '#'} className="flex items-center gap-2 font-semibold text-ink hover:underline">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-ink">
                {authorName.charAt(0).toUpperCase()}
              </span>
              {authorName}
            </Link>
            </AuthorHoverCard>
            <span>{publishDate}</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {readTime(post.content)} phút đọc
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> {currentViews.toLocaleString('vi-VN')} lượt đọc
            </span>
          </div>
        </header>

        {/* Ảnh bìa */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverOf(post)}
          alt={post.title}
          className="mt-8 aspect-[16/8] w-full rounded-3xl border border-line object-cover saturate-[.9]"
        />

        {/* Trích đoạn mở bài */}
        {post.excerpt && (
          <p className="mt-8 border-l-2 border-accent pl-5 font-serif text-lg italic leading-relaxed text-muted">
            {post.excerpt}
          </p>
        )}

        {/* Nội dung với drop cap ở đoạn đầu */}
        <div className="mt-8 space-y-6 font-serif text-[17px] leading-[1.85] text-ink/90 sm:text-lg">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-accent'
                  : undefined
              }
            >
              {para}
            </p>
          ))}
        </div>

        {/* Tương tác nằm dưới bài viết như giao diện cũ */}
        <div aria-label="Tương tác bài viết" className="mt-10 flex flex-wrap items-center gap-2 border-y border-line py-4">
          <button onClick={handleLike} disabled={interacting} aria-pressed={liked} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${liked ? 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400' : 'border-line bg-surface text-muted hover:text-ink'}`}>
            <Heart className={`h-4 w-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} weight={liked ? 'fill' : 'regular'} /> {likeCount} Thích
          </button>
          <a href="#comments" className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-muted transition hover:text-ink">
            <ChatCircleText className="h-4 w-4" /> {comments.length} Bình luận
          </a>
          <button onClick={handleRepost} disabled={interacting} aria-pressed={reposted} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${reposted ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-line bg-surface text-muted hover:text-ink'}`}>
            <Repeat className="h-4 w-4" /> {repostsCount} {reposted ? 'Đã đăng lại' : 'Đăng lại'}
          </button>
          <button onClick={handleBookmark} disabled={interacting} aria-pressed={bookmarked} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${bookmarked ? 'border-accent/30 bg-accent-soft text-accent' : 'border-line bg-surface text-muted hover:text-ink'}`}>
            <BookmarkSimple className={`h-4 w-4 ${bookmarked ? 'fill-accent text-accent' : ''}`} weight={bookmarked ? 'fill' : 'regular'} /> {bookmarked ? 'Đã lưu' : 'Lưu'}
          </button>
          <button onClick={handleShare} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-muted transition hover:text-ink">
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <ShareNetwork className="h-4 w-4" />} {copied ? 'Đã sao chép' : 'Chia sẻ'}
          </button>
          {Number(post.authorId ?? raw.author_id) !== Number(user?.id) && <button onClick={handleFollow} disabled={interacting} aria-pressed={followingAuthor} className={`ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${followingAuthor ? 'border border-line bg-surface text-muted' : 'bg-accent text-accent-ink hover:bg-accent-hover'}`}>
            {followingAuthor ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {followingAuthor ? 'Đang theo dõi' : 'Theo dõi'}{followersCount > 0 ? ` · ${followersCount}` : ''}
          </button>}
        </div>

        {/* Tác giả */}
        <section className="mt-10 flex flex-col items-center gap-5 rounded-3xl border border-line bg-raised p-6 sm:flex-row sm:p-7">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent text-2xl font-bold text-accent-ink">
            {authorName.charAt(0).toUpperCase()}
          </span>
          <div className="text-center sm:text-left">
            <p className="text-[11px] font-bold uppercase tracking-widest text-faint">
              Tác giả
            </p>
            <AuthorHoverCard username={authorUsername} name={authorName}><Link href={authorUsername ? `/authors/${encodeURIComponent(authorUsername)}` : '#'} className="mt-1 inline-block font-serif text-lg font-bold text-ink hover:underline">{authorName}</Link></AuthorHoverCard>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Tác giả chia sẻ các góc nhìn và trải nghiệm trên nền tảng Blog Platform.
            </p>
          </div>
        </section>

        {/* Thảo luận */}
        <section id="comments" className="mt-12 scroll-mt-24">
          <h2 className="font-serif text-xl font-bold text-ink">
            Thảo luận <span className="text-muted">({comments.length})</span>
          </h2>

          {interactionMessage && <p role="status" className="mt-4 text-sm text-accent">{interactionMessage}</p>}
          <form onSubmit={handleAddComment} className="mt-5 space-y-3">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Chia sẻ suy nghĩ hoặc đặt câu hỏi cho tác giả..."
              aria-label="Nội dung bình luận"
              className="w-full rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-ink placeholder:text-faint transition focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={interacting || !commentText.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-ink transition hover:bg-accent-hover disabled:opacity-40"
              >
                <PaperPlaneTilt className="h-3.5 w-3.5" />
                Gửi bình luận
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-5">
            {comments.map((cmt) => (
              <article key={cmt.id} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-raised text-[11px] font-bold text-muted">
                  {cmt.author.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-ink">{cmt.author}</span>
                    <span className="text-faint">{cmt.time}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{cmt.content}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
          </div>

          {/* Sidebar phải: tác giả + đọc tiếp + CTA */}
          <aside className="hidden min-w-0 self-start 2xl:sticky 2xl:top-24 2xl:block 2xl:space-y-6">
            {/* Thẻ tác giả gọn */}
            <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-lg font-bold text-accent-ink">
                  {authorName.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-faint">
                    Tác giả
                  </span>
                  <AuthorHoverCard username={authorUsername} name={authorName}><Link href={authorUsername ? `/authors/${encodeURIComponent(authorUsername)}` : '#'} className="block truncate font-serif text-base font-bold text-ink hover:underline">{authorName}</Link></AuthorHoverCard>
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Theo dõi để không bỏ lỡ các bài viết mới của tác giả.
              </p>
              <Link
                href="/posts"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2 text-[11px] font-bold text-accent transition hover:bg-accent-soft"
              >
                Xem bài viết khác
              </Link>
            </div>

            {/* Đọc tiếp */}
            {relatedPosts.length > 0 && (
              <div className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
                <p className="border-b border-line pb-3 text-xs font-bold uppercase tracking-wider text-ink">
                  Đọc tiếp
                </p>
                <div className="divide-y divide-line">
                  {relatedPosts.map((item) => (
                    <Link
                      key={item.id}
                      href={`/posts/${item.id}`}
                      className="group flex items-center gap-3 py-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverOf(item, 160, 100)}
                        alt=""
                        loading="lazy"
                        className="h-12 w-20 shrink-0 rounded-lg object-cover"
                      />
                      <span className="min-w-0">
                        <span className="line-clamp-2 block text-xs font-bold leading-snug text-ink transition group-hover:text-accent">
                          {item.title}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-[10px] text-faint">
                          <Eye className="h-3 w-3" />
                          {Number((item as any).view_count ?? item.viewCount ?? 0).toLocaleString('vi-VN')}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA nhận bản tin */}
            <div className="rounded-3xl border border-line bg-gradient-to-br from-[#115e59] via-[#134e4a] to-[#042f2e] p-5 text-white">
              <p className="font-serif text-base font-bold">Nhận bản tin tuần</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/75">
                Tổng hợp bài viết hay nhất, gửi đúng một lần mỗi tuần.
              </p>
              <Link
                href="/register"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-[11px] font-bold text-accent transition hover:opacity-90"
              >
                Đăng ký ngay
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
