'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Eye,
  User,
  Tag,
  Loader2,
  Share2,
  Bookmark,
  Heart,
  MessageSquare,
  Check,
  Clock,
  Sparkles,
  ChevronRight,
  Send,
} from 'lucide-react';
import { postApi, PostItem, Category } from '@/services/postApi';
import { useAuth } from '@/contexts/AuthContext';

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

  // Trạng thái tương tác
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(12);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'HoangDev',
      time: '2 giờ trước',
      content: 'Bài viết súc tích và đúng trọng tâm, cảm ơn tác giả đã chia sẻ!',
    },
  ]);

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
            .slice(0, 3)
        );

        // Đếm lượt đọc đúng 1 lần duy nhất trong phiên
        const sessionKey = `viewed_post_${id}`;
        const alreadyViewedInSession = sessionStorage.getItem(sessionKey);

        if (!hasTrackedRef.current && !alreadyViewedInSession) {
          hasTrackedRef.current = true;
          sessionStorage.setItem(sessionKey, 'true');

          try {
            const result = await postApi.trackView(id);
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

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: user?.userName || (user as any)?.username || 'Bạn',
        time: 'Vừa xong',
        content: commentText.trim(),
      },
    ]);
    setCommentText('');
  };

  if (loading) {
    return (
      <div className="flex min-h-[75vh] flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-[#06080e] text-zinc-500 dark:text-zinc-400 transition-colors">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-medium tracking-wide">Đang nạp ấn phẩm...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-[#06080e] p-6 text-center">
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Không tìm thấy ấn phẩm</h2>
        <p className="text-xs text-zinc-500 max-w-sm">Bài viết có thể đã bị gỡ hoặc chuyển hướng.</p>
        <Link
          href="/posts"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition"
        >
          Khám phá các bài viết khác
        </Link>
      </div>
    );
  }

  const raw = post as any;
  const currentViews = post.viewCount ?? raw.view_count ?? 0;
  const categoryName = categories.find((c) => c.id === (post.categoryId ?? raw.category_id))?.name || 'Tổng hợp';
  const authorName = raw.author_name || post.authorName || 'Tác giả Blog Platform';
  const publishDate = raw.created_at || post.createdAt ? new Date(raw.created_at || post.createdAt).toLocaleDateString('vi-VN') : 'Mới xuất bản';
  const readingTime = Math.max(1, Math.ceil((post.content || '').split(/\s+/).length / 200));

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#06080e] dark:text-zinc-100 transition-colors duration-200 pb-28">
      
      {/* Glow Effect */}
      <div className="absolute inset-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.22),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-8 space-y-10">
        
        {/* Navigation Breadcrumb & Share */}
        <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-white/[0.08] pb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06] transition"
              title="Chia sẻ bài viết"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? 'Đã sao chép link' : 'Chia sẻ'}</span>
            </button>
          </div>
        </div>

        {/* Khung bài viết chính */}
        <article className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-12 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/80 space-y-8">
          
          {/* Header Metadata */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400 uppercase tracking-wider">
              <Tag className="h-3.5 w-3.5" />
              {categoryName}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-b border-zinc-100 dark:border-white/[0.06] pb-6">
              <div className="flex items-center gap-2 font-medium text-zinc-800 dark:text-zinc-200">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {authorName.charAt(0).toUpperCase()}
                </div>
                <span>{authorName}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{publishDate}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{readingTime} phút đọc</span>
              </div>

              <div className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                <Eye className="h-3.5 w-3.5" />
                <span>{currentViews.toLocaleString()} lượt xem</span>
              </div>
            </div>
          </div>

          {/* Ảnh bìa (nếu có) */}
          {(raw.cover_image || raw.coverImage) && (
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 shadow-md dark:border-white/[0.08]">
              <img
                src={raw.cover_image || raw.coverImage}
                alt={post.title}
                className="h-72 sm:h-96 w-full object-cover"
              />
            </div>
          )}

          {/* Trích đoạn Excerpt */}
          {post.excerpt && (
            <p className="text-base sm:text-lg font-medium text-zinc-700 dark:text-zinc-300 italic border-l-4 border-indigo-600 pl-4 py-1 leading-relaxed bg-zinc-50 dark:bg-white/[0.02] rounded-r-xl">
              {post.excerpt}
            </p>
          )}

          {/* Nội dung bài viết */}
          <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-base sm:text-lg leading-relaxed whitespace-pre-wrap font-sans py-4">
            {post.content}
          </div>

          {/* Thanh tương tác bài viết (Like, Bookmark, Comments) */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-200/80 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  liked
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                    : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400'
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{likeCount} Thích</span>
              </button>

              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  bookmarked
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                    : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-indigo-500 text-indigo-500' : ''}`} />
                <span>Lưu bài</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <MessageSquare className="h-4 w-4" />
              <span>{comments.length} thảo luận</span>
            </div>
          </div>

          {/* Khung giới thiệu tác giả (Author Box) */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-6 dark:border-white/[0.08] dark:bg-white/[0.02] flex flex-col sm:flex-row items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-2xl font-black text-white shadow-md">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Tác giả bài viết
              </span>
              <h3 className="text-base font-extrabold text-zinc-950 dark:text-white">
                {authorName}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Tác giả chia sẻ các góc nhìn công nghệ và trải nghiệm phát triển phần mềm trên nền tảng Blog Platform.
              </p>
            </div>
          </div>
        </article>

        {/* Khung thảo luận & Bình luận */}
        <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-10 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/80 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Thảo luận ({comments.length})
            </h2>
          </div>

          <form onSubmit={handleAddComment} className="space-y-3">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Chia sẻ suy nghĩ hoặc đặt câu hỏi cho tác giả..."
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs sm:text-sm text-zinc-950 placeholder-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition"
              >
                <Send className="h-3.5 w-3.5" />
                Gửi bình luận
              </button>
            </div>
          </form>

          {/* Danh sách bình luận */}
          <div className="divide-y divide-zinc-100 dark:divide-white/[0.04] pt-2">
            {comments.map((cmt) => (
              <div key={cmt.id} className="py-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-950 dark:text-white">{cmt.author}</span>
                  <span className="text-zinc-400 text-[11px]">{cmt.time}</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {cmt.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Khung bài viết đề xuất cùng chuyên mục */}
        {relatedPosts.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Ấn phẩm đề xuất khác
              </h2>
              <Link
                href="/posts"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                Xem tất cả <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  href={`/posts/${item.id}`}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:border-indigo-500/40 dark:border-white/[0.08] dark:bg-[#0c121e]/80 transition group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 uppercase">
                      Bài viết
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2 transition">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-white/[0.04]">
                    <span>{(item as any).created_at ? new Date((item as any).created_at).toLocaleDateString('vi-VN') : 'Gần đây'}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {(item as any).view_count ?? item.viewCount ?? 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}