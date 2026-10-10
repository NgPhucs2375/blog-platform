'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookmarkSimple, ChatCircleText, Check, DotsThree, Heart, Image as ImageIcon, PaperPlaneTilt, Repeat, ShareNetwork, UserPlus, UserCheck, UserCircle, X } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import type { PostItem } from '@/services/postApi';
import AuthorHoverCard from '@/components/AuthorHoverCard';

type Comment = { id: number; userName?: string; content: string; imageUrl?: string | null; createdAt?: string; replies?: Comment[] };
type AuthorPreview = { id: number; username: string; bio?: string | null; avatarUrl?: string | null; followersCount: number; viewsCount: number; isFollowing: boolean };
const authorPreviewCache = new Map<string, AuthorPreview>();

async function loadAuthorPreview(username: string): Promise<AuthorPreview> {
  const cached = authorPreviewCache.get(username);
  if (cached) return cached;
  const { data } = await api.get(`/v1/authors/${encodeURIComponent(username)}`, { params: { tab: 'threads', limit: 1 } });
  const preview = data.data.author as AuthorPreview;
  authorPreviewCache.set(username, preview);
  return preview;
}

function timeAgo(value?: string): string {
  if (!value) return 'Mới đăng';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày`;
  return new Date(value).toLocaleDateString('vi-VN');
}

export default function SocialPostCard({ post, variant = 'card', onReaderControl }: { post: PostItem; variant?: 'card' | 'feed'; onReaderControl?: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const authorId = Number(post.authorId ?? post.author_id ?? post.author?.id);
  const authorName = post.author?.userName || post.author?.username || post.authorName || post.author_name || 'Người viết';
  const avatar = post.author?.avatarUrl;
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(Number(post.likesCount || 0));
  const [saved, setSaved] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [reposts, setReposts] = useState(Number(post.repostsCount || 0));
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(Number(post.followersCount || 0));
  const [shares, setShares] = useState(Number(post.sharesCount || 0));
  const [commentsCount, setCommentsCount] = useState(Number(post.commentsCount || 0));
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentImageUrl, setCommentImageUrl] = useState('');
  const [commentImageBusy, setCommentImageBusy] = useState(false);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showQuoteComposer, setShowQuoteComposer] = useState(false);
  const [quoteText, setQuoteText] = useState('');
  const [poll, setPoll] = useState(post.poll);
  const commentImageInput = useRef<HTMLInputElement>(null);
  const authorHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [authorPreview, setAuthorPreview] = useState<AuthorPreview | null>(null);
  const [showAuthorPreview, setShowAuthorPreview] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [hidden, setHidden] = useState(false);

  function openAuthorPreview() {
    if (!post.author?.username || Number(user?.id) === authorId) return;
    if (authorHoverTimer.current) clearTimeout(authorHoverTimer.current);
    authorHoverTimer.current = setTimeout(() => {
      setShowAuthorPreview(true);
      void loadAuthorPreview(post.author!.username!).then(setAuthorPreview).catch(() => {});
    }, 280);
  }

  function closeAuthorPreview() {
    if (authorHoverTimer.current) clearTimeout(authorHoverTimer.current);
    setShowAuthorPreview(false);
  }

  useEffect(() => () => { if (authorHoverTimer.current) clearTimeout(authorHoverTimer.current); }, []);

  useEffect(() => {
    if (authorPreview && authorPreview.username === post.author?.username) setFollowing(authorPreview.isFollowing);
  }, [authorPreview, post.author?.username]);

  useEffect(() => {
    let active = true;
    if (user) api.get(`/v1/posts/${post.id}/interaction`).then(({ data }) => {
      if (!active) return;
      setLiked(data.data.liked); setSaved(data.data.bookmarked); setReposted(data.data.reposted);
      setFollowing(data.data.followingAuthor); setLikes(data.data.likesCount); setReposts(data.data.repostsCount);
      setFollowers(data.data.followersCount);
    }).catch(() => {});
    return () => { active = false; };
  }, [post.id, user]);

  useEffect(() => {
    if (!showComments) return;
    let active = true;
    api.get(`/v1/posts/${post.id}/comments`).then(({ data }) => {
      if (active) {
        const rows = Array.isArray(data.data) ? data.data : [];
        setComments(rows);
        setCommentsCount(rows.reduce((count: number, comment: Comment) => count + 1 + (comment.replies?.length || 0), 0));
      }
    }).catch(() => { if (active) setMessage('Không tải được bình luận. Hãy thử lại.'); });
    return () => { active = false; };
  }, [post.id, showComments]);

  useEffect(() => {
    if (!user || Number(user.id) !== authorId || !post.replyApproval) return;
    api.get(`/v1/posts/${post.id}/comments/pending`).then(({ data }) => setPendingComments(data.data || [])).catch(() => {});
  }, [authorId, post.id, post.replyApproval, user]);

  const sortedComments = useMemo(() => [...comments].sort((a, b) => {
    const diff = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    return sort === 'newest' ? -diff : diff;
  }), [comments, sort]);

  const requireUser = () => {
    if (user) return true;
    router.push('/login');
    return false;
  };

  async function toggleLike() {
    if (!requireUser() || busy) return;
    setBusy(true);
    try {
      const { data } = liked ? await api.delete(`/v1/posts/${post.id}/likes`) : await api.post(`/v1/posts/${post.id}/likes`);
      setLiked(data.data.liked); setLikes(data.data.likesCount);
    } catch { setMessage('Không cập nhật được lượt thích.'); }
    finally { setBusy(false); }
  }

  async function toggleRepost() {
    if (!requireUser() || busy) return;
    setBusy(true);
    try {
      const { data } = reposted ? await api.delete(`/v1/posts/${post.id}/repost`) : await api.post(`/v1/posts/${post.id}/repost`);
      setReposted(data.data.reposted); setReposts(data.data.repostsCount);
      setMessage(data.data.reposted ? 'Đã đăng lại bài viết.' : 'Đã gỡ bài viết đăng lại.');
    } catch { setMessage('Không đăng lại được bài viết.'); }
    finally { setBusy(false); }
  }

  async function submitQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireUser() || busy) return;
    setBusy(true); setMessage('');
    try {
      const { data } = await api.post(`/v1/posts/${post.id}/quote`, { commentary: quoteText.trim() });
      setReposts(data.data.repostsCount);
      setShowQuoteComposer(false); setQuoteText('');
      setMessage(data.data.status === 'published' ? 'Đã đăng bài trích dẫn.' : 'Bài trích dẫn đang chờ kiểm duyệt.');
    } catch { setMessage('Không đăng được bài trích dẫn. Hãy thử lại.'); }
    finally { setBusy(false); }
  }

  async function toggleSave() {
    if (!requireUser() || busy) return;
    setBusy(true);
    try {
      if (saved) await api.delete(`/v1/posts/${post.id}/bookmark`); else await api.put(`/v1/posts/${post.id}/bookmark`);
      setSaved(!saved);
    } catch { setMessage('Không cập nhật được bài đã lưu.'); }
    finally { setBusy(false); }
  }

  async function toggleFollow() {
    if (!requireUser() || busy || !authorId || Number(user?.id) === authorId) return;
    setBusy(true);
    try {
      const { data } = following ? await api.delete(`/v1/authors/${authorId}/follow`) : await api.post(`/v1/authors/${authorId}/follow`);
      setFollowing(data.data.following); setFollowers(data.data.followersCount);
    } catch { setMessage('Không cập nhật được theo dõi.'); }
    finally { setBusy(false); }
  }

  async function saveReaderControl(type: 'hide_post' | 'less_category' | 'mute' | 'block', targetId: number) {
    if (!requireUser()) return;
    try {
      await api.post('/v1/reader/controls', { type, targetId });
      setShowPostMenu(false);
      setMessage(({ hide_post: 'Đã ẩn bài viết này.', less_category: 'Sẽ giảm bài viết thuộc chuyên mục này.', mute: 'Đã tắt bài viết từ tác giả này.', block: 'Đã chặn tác giả này.' })[type]);
      setHidden(true);
      onReaderControl?.();
    } catch { setMessage('Không lưu được tùy chọn. Hãy thử lại.'); }
  }

  async function share() {
    try {
      const url = `${window.location.origin}/posts/${post.slug || post.id}`;
      if (navigator.share) await navigator.share({ title: post.title, url });
      else await navigator.clipboard.writeText(url);
      const { data } = await api.post(`/v1/posts/${post.id}/share`);
      setShares(data.data.sharesCount);
      setCopied(true); window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage('Không chia sẻ được bài viết. Hãy thử lại.');
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireUser() || (!commentText.trim() && !commentImageUrl) || busy || commentImageBusy) return;
    setBusy(true); setMessage('');
    try {
      const { data } = await api.post(`/v1/posts/${post.id}/comments`, { content: commentText.trim(), imageUrl: commentImageUrl || undefined });
      if (data.data.status === 'approved') {
        setComments(rows => [...rows, { ...data.data, userName: user?.userName, replies: [] }]);
        setCommentsCount(count => count + 1);
      }
      setCommentText(''); setCommentImageUrl(''); setMessage(data.data.status === 'approved' ? 'Bình luận đã được đăng.' : 'Bình luận đang chờ tác giả duyệt.');
    } catch { setMessage('Không gửi được bình luận. Hãy thử lại.'); }
    finally { setBusy(false); }
  }

  async function uploadCommentImage(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage('Chọn ảnh JPG, PNG, WebP hoặc GIF tối đa 5 MB.');
      if (commentImageInput.current) commentImageInput.current.value = '';
      return;
    }
    setCommentImageBusy(true); setMessage('');
    try {
      const body = new FormData(); body.append('image', file);
      const { data } = await api.post('/v1/media', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCommentImageUrl(data.data.url);
    } catch { setMessage('Tải ảnh lên thất bại. Hãy thử lại.'); }
    finally { setCommentImageBusy(false); if (commentImageInput.current) commentImageInput.current.value = ''; }
  }

  async function submitReply(event: React.FormEvent<HTMLFormElement>, commentId: number) {
    event.preventDefault();
    if (!requireUser() || !replyText.trim() || busy) return;
    setBusy(true); setMessage('');
    try {
      const { data } = await api.post(`/v1/comments/${commentId}/reply`, { content: replyText.trim() });
      if (data.data.status === 'approved') {
        setComments(rows => rows.map(comment => comment.id === commentId ? { ...comment, replies: [...(comment.replies || []), { ...data.data, userName: user?.userName }] } : comment));
        setCommentsCount(count => count + 1);
      }
      setReplyText(''); setReplyingTo(null); setMessage(data.data.status === 'approved' ? 'Phản hồi đã được đăng.' : 'Phản hồi đang chờ tác giả duyệt.');
    } catch { setMessage('Không gửi được phản hồi. Hãy thử lại.'); }
    finally { setBusy(false); }
  }

  async function vote(optionIndex: number) {
    if (!requireUser() || busy || !poll || poll.myVote !== null && poll.myVote !== undefined || poll.hasEnded) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/v1/posts/${post.id}/poll-votes`, { optionIndex });
      setPoll({ ...poll, myVote: data.data.myVote, voteCounts: data.data.voteCounts, totalVotes: data.data.totalVotes });
    } catch (error: any) { setMessage(error?.response?.data?.message || 'Không ghi nhận được bình chọn.'); }
    finally { setBusy(false); }
  }

  async function reviewComment(commentId: number, action: 'approve' | 'reject') {
    try {
      await api.post(`/v1/posts/${post.id}/comments/${commentId}/${action}`);
      setPendingComments(rows => rows.filter(comment => comment.id !== commentId));
      if (action === 'approve') {
        const { data } = await api.get(`/v1/posts/${post.id}/comments`);
        setComments(data.data || []);
        setCommentsCount((data.data || []).reduce((count: number, comment: Comment) => count + 1 + (comment.replies?.length || 0), 0));
      }
    } catch { setMessage('Không xử lý được phản hồi. Hãy thử lại.'); }
  }

  const cover = post.coverImage || post.cover_image;
  const publishedAt = post.publishedAt || post.createdAt || post.created_at;

  const feedStyle = variant === 'feed';
  if (hidden) return null;

  function openPostFromCard(event: React.MouseEvent<HTMLElement>) {
    const target = event.target;
    if (target instanceof Element && target.closest('a,button,input,textarea,select,video,label,[role="menu"],[role="dialog"]')) return;
    router.push(`/posts/${post.slug || post.id}`);
  }

  function openPostFromKeyboard(event: React.KeyboardEvent<HTMLElement>) {
    if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) {
      event.preventDefault();
      router.push(`/posts/${post.slug || post.id}`);
    }
  }

  return <article onClick={openPostFromCard} onKeyDown={openPostFromKeyboard} tabIndex={0} aria-label={`Mở bài viết: ${post.title}`} className={`${feedStyle ? 'relative overflow-visible py-2' : 'relative overflow-visible rounded-3xl border border-line bg-surface shadow-sm'} cursor-pointer`}>
    <div className={`flex items-center gap-3 pb-2 ${feedStyle ? 'px-1 pt-3' : 'px-5 pt-5 sm:px-6'}`}>
      <div className="relative flex min-w-0 flex-1 items-center gap-3" onMouseEnter={openAuthorPreview} onMouseLeave={closeAuthorPreview}>
        {post.author?.username ? <Link href={`/authors/${encodeURIComponent(post.author.username)}`} aria-label={`Xem trang cá nhân của ${authorName}`} onFocus={openAuthorPreview} className="shrink-0">{avatar ? <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" /> : <UserCircle size={44} weight="fill" className="text-muted" />}</Link> : avatar ? <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" /> : <UserCircle size={44} weight="fill" className="shrink-0 text-muted" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.author?.username ? <Link href={`/authors/${encodeURIComponent(post.author.username)}`} onFocus={openAuthorPreview} aria-expanded={showAuthorPreview} className="truncate text-sm font-bold text-ink hover:underline">{authorName}</Link> : <span className="truncate text-sm font-bold text-ink">{authorName}</span>}
            <span className="text-xs text-muted">· {timeAgo(publishedAt)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><span>{post.category?.name || 'Bài viết'}</span>{post.community && <Link className="text-accent hover:underline" href={`/communities/${post.community.slug}`}>· {post.community.icon || ''} {post.community.name}</Link>}{post.community?.authorFlair && <span className="rounded-full bg-raised px-2 py-0.5">{post.community.authorFlair}</span>}{post.community?.authorIsChampion && <span className="font-semibold text-amber-500">Người đóng góp nổi bật</span>}</div>
        </div>
        {showAuthorPreview && post.author?.username && Number(user?.id) !== authorId && <section onMouseEnter={() => { if (authorHoverTimer.current) clearTimeout(authorHoverTimer.current); }} className="absolute left-0 top-[calc(100%+8px)] z-[80] w-[min(340px,calc(100vw-40px))] rounded-2xl border border-line bg-surface p-4 text-ink shadow-2xl">
          {authorPreview ? <>
            <Link href={`/authors/${encodeURIComponent(authorPreview.username)}`} onClick={closeAuthorPreview} className="flex items-start justify-between gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <div className="min-w-0"><h3 className="truncate text-base font-bold">{authorName}</h3><p className="mt-0.5 text-sm text-muted">@{authorPreview.username}</p></div>
              {authorPreview.avatarUrl ? <img src={authorPreview.avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" /> : <UserCircle size={64} weight="fill" className="shrink-0 text-muted" />}
            </Link>
            {authorPreview.bio && <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-relaxed">{authorPreview.bio}</p>}
            <p className="mt-3 text-sm text-muted">{authorPreview.followersCount.toLocaleString('vi-VN')} người theo dõi</p>
            <button type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); void toggleFollow(); }} disabled={busy} className={`mt-4 h-9 w-full rounded-xl text-sm font-bold transition disabled:opacity-60 ${following ? 'border border-line hover:bg-raised' : 'bg-ink text-canvas hover:opacity-90'}`}>{following ? 'Đang theo dõi' : 'Theo dõi'}</button>
          </> : <div className="flex animate-pulse items-center gap-3"><div className="h-14 w-14 rounded-full bg-raised" /><div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-raised" /><div className="h-3 w-1/2 rounded bg-raised" /></div></div>}
        </section>}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {Number(user?.id) !== authorId && <button onClick={() => void toggleFollow()} disabled={busy} aria-pressed={following} aria-label={following ? `Bỏ theo dõi ${authorName}` : `Theo dõi ${authorName}`} title={following ? 'Đang theo dõi' : 'Theo dõi'} className={`grid h-9 w-9 rounded-full border transition ${following ? 'border-line text-accent' : 'border-transparent text-muted hover:border-line hover:text-accent'}`}>
          {following ? <UserCheck size={20} /> : <UserPlus size={20} />}
        </button>}
        {user && <div className="relative"><button type="button" onClick={() => setShowPostMenu(value => !value)} aria-label="Tùy chọn bài viết" aria-expanded={showPostMenu} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-raised"><DotsThree size={21} /></button>{showPostMenu && <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-xl">
          <button role="menuitem" onClick={() => void saveReaderControl('hide_post', Number(post.id))} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-raised">Ẩn bài viết này</button>
          {post.category?.id && <button role="menuitem" onClick={() => void saveReaderControl('less_category', Number(post.category!.id))} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-raised">Ít bài “{post.category.name}” hơn</button>}
          {Number(user.id) !== authorId && <><button role="menuitem" onClick={() => void saveReaderControl('mute', authorId)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-raised">Ẩn tác giả @{post.author?.username || authorName}</button><button role="menuitem" onClick={() => void saveReaderControl('block', authorId)} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-rose-500 hover:bg-raised">Chặn tác giả</button></>}
        </div>}</div>}
      </div>
    </div>

    <div className={feedStyle ? 'px-1 pb-3' : 'px-5 pb-3 sm:px-6'}>
      <Link href={`/posts/${post.id}`} className="text-[15px] font-bold leading-snug text-ink hover:text-accent">{post.title}</Link>
      <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-relaxed text-ink">{post.content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => /^https?:\/\//.test(part) ? <a key={index} href={part} target="_blank" rel="noreferrer" className="text-sky-500 hover:underline">{part}</a> : part)}</p>
      {!!post.tags?.length && <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">{post.tags.map(tag => <Link key={tag.id} href={`/posts?tag=${encodeURIComponent(tag.slug)}`} className="text-sm font-medium text-accent hover:underline">#{tag.name.replace(/^#/, '')}</Link>)}</div>}
      {post.quotedPost && <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-raised transition hover:border-accent/50">
        <div className="flex items-center gap-2 px-3 pt-3 text-xs font-semibold text-ink">
          <AuthorHoverCard username={(post.quotedPost.author as any)?.username} name={post.quotedPost.author?.userName || post.quotedPost.authorName || 'Người viết'}>
            <Link href={(post.quotedPost.author as any)?.username ? `/authors/${encodeURIComponent((post.quotedPost.author as any).username)}` : `/posts/${post.quotedPost.slug || post.quotedPost.id}`} className="inline-flex items-center gap-2 hover:underline">
              {post.quotedPost.author?.avatarUrl ? <img src={post.quotedPost.author.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" /> : <UserCircle size={24} className="text-muted" />}
              {post.quotedPost.author?.userName || post.quotedPost.authorName || 'Người viết'}
            </Link>
          </AuthorHoverCard>
        </div>
        <Link href={`/posts/${post.quotedPost.slug || post.quotedPost.id}`} className="block px-3 pb-3 pt-2"><p className="text-sm font-semibold text-ink">{post.quotedPost.title}</p>{post.quotedPost.content && <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-muted">{post.quotedPost.content}</p>}</Link>
        {post.quotedPost.coverImage && <Link href={`/posts/${post.quotedPost.slug || post.quotedPost.id}`}><img src={post.quotedPost.coverImage} alt="" loading="lazy" className="max-h-72 w-full object-cover" /></Link>}
      </div>}
      {(post.media?.length ? post.media : cover ? [{ url: cover, type: 'image' as const }] : []).length > 0 && <div className={`mt-3 grid gap-2 ${(post.media?.length ? post.media : cover ? [cover] : []).length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-[680px]'}`}>{(post.media?.length ? post.media : cover ? [{ url: cover, type: 'image' as const }] : []).map((item, index) => <Link key={`${item.url}-${index}`} href={`/posts/${post.id}`} className="block overflow-hidden rounded-2xl border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.type === 'video' ? <video src={item.url} controls preload="metadata" className="max-h-[620px] w-full object-cover" /> : <img src={item.url} alt={post.title} loading="lazy" className="max-h-[620px] w-full object-cover" />}
      </Link>)}</div>}
      {poll && <section aria-label="Bình chọn" className="mt-3 space-y-2 rounded-2xl border border-line p-3">{poll.options.map((option, index) => { const percent = poll.totalVotes ? Math.round((poll.voteCounts[index] / poll.totalVotes) * 100) : 0; return <button key={option} type="button" onClick={() => void vote(index)} disabled={busy || poll.myVote !== null && poll.myVote !== undefined || poll.hasEnded} className="relative flex w-full items-center justify-between overflow-hidden rounded-xl border border-line px-3 py-2.5 text-left text-sm text-ink disabled:cursor-default"><span aria-hidden className="absolute inset-y-0 left-0 bg-accent/15" style={{ width: `${poll.myVote !== null && poll.myVote !== undefined || poll.hasEnded ? percent : 0}%` }} /><span className="relative">{option}</span><span className="relative text-muted">{poll.totalVotes ? `${percent}%` : '投票'}</span></button>; })}<p className="text-xs text-muted">{poll.totalVotes} lượt bình chọn{poll.hasEnded ? ' · Đã kết thúc' : poll.endsAt ? ` · Kết thúc ${new Date(poll.endsAt).toLocaleDateString('vi-VN')}` : ''}</p></section>}
      {post.threadItems && post.threadItems.length > 1 && post.threadPosition === 0 && <div className="mt-3 space-y-2 border-l-2 border-accent/40 pl-3">{post.threadItems.slice(1).map(item => <div key={item.id} className="rounded-xl bg-raised p-3 text-sm text-ink"><p className="whitespace-pre-line">{item.content}</p>{item.media?.map(media => media.type === 'video' ? <video key={media.url} src={media.url} controls className="mt-2 max-h-64 rounded-lg" /> : <img key={media.url} src={media.url} alt="" className="mt-2 max-h-64 rounded-lg object-cover" />)}</div>)}</div>}
    </div>

    <div className={`flex flex-wrap items-center gap-1 py-2 ${feedStyle ? 'border-t border-line px-0' : 'border-t border-line px-3 sm:px-4'}`}>
      <button onClick={() => void toggleLike()} disabled={busy} aria-pressed={liked} aria-label={liked ? 'Bỏ thích bài viết' : 'Thích bài viết'} title={liked ? 'Bỏ thích' : 'Thích'} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs transition hover:bg-raised ${liked ? 'text-rose-500' : 'text-muted'}`}>
        <Heart size={20} weight={liked ? 'fill' : 'regular'} />{likes > 0 && <span>{likes.toLocaleString('vi-VN')}</span>}
      </button>
      <button onClick={() => setShowComments(!showComments)} aria-expanded={showComments} aria-label={showComments ? 'Ẩn bình luận' : 'Xem bình luận'} title="Bình luận" className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs text-muted transition hover:bg-raised">
        <ChatCircleText size={20} />{commentsCount > 0 && <span>{commentsCount.toLocaleString('vi-VN')}</span>}
      </button>
      <div className="relative">
        <button onClick={() => setShowRepostMenu(value => !value)} disabled={busy} aria-expanded={showRepostMenu} aria-haspopup="menu" aria-label="Tùy chọn đăng lại" title="Đăng lại" className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs transition hover:bg-raised ${reposted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>
          <Repeat size={20} />{reposts > 0 && <span>{reposts.toLocaleString('vi-VN')}</span>}
        </button>
        {showRepostMenu && <div role="menu" className="absolute bottom-full left-0 z-30 mb-2 w-48 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-xl">
          <button role="menuitem" onClick={() => { setShowRepostMenu(false); void toggleRepost(); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-raised">
            <span>{reposted ? 'Gỡ đăng lại' : 'Đăng lại'}</span><Repeat size={19} />
          </button>
          {post.quotePermission !== 'none' && <button role="menuitem" onClick={() => { setShowRepostMenu(false); if (requireUser()) setShowQuoteComposer(true); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-raised"><span>Trích dẫn</span><ChatCircleText size={19} /></button>}
        </div>}
      </div>
      <button onClick={() => void share()} className="grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-raised" aria-label="Chia sẻ bài viết" title={copied ? 'Đã chia sẻ' : 'Chia sẻ'}>
        {copied ? <Check size={20} className="text-emerald-600" /> : <ShareNetwork size={20} />}
      </button>
      <button onClick={() => void toggleSave()} disabled={busy} aria-pressed={saved} className={`ml-auto grid h-9 w-9 place-items-center rounded-full transition hover:bg-raised ${saved ? 'text-accent' : 'text-muted'}`} aria-label={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}>
        <BookmarkSimple size={19} weight={saved ? 'fill' : 'regular'} />
      </button>
    </div>

    {showComments && <section className="border-t border-line px-4 py-4 sm:px-6">
      {Number(user?.id) === authorId && post.replyApproval && pendingComments.length > 0 && <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3"><h3 className="text-sm font-bold text-ink">Phản hồi cần duyệt ({pendingComments.length})</h3><div className="mt-2 space-y-2">{pendingComments.map(comment => <div key={comment.id} className="rounded-xl bg-surface p-3"><p className="text-xs font-semibold text-muted">{comment.userName ? <AuthorHoverCard username={comment.userName} name={comment.userName}><Link href={`/authors/${encodeURIComponent(comment.userName)}`} className="hover:underline">{comment.userName}</Link></AuthorHoverCard> : 'Người dùng'}</p><p className="mt-1 whitespace-pre-line text-sm text-ink">{comment.content}</p><div className="mt-2 flex gap-2"><button onClick={() => void reviewComment(comment.id, 'approve')} className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white">Duyệt</button><button onClick={() => void reviewComment(comment.id, 'reject')} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted">Từ chối</button></div></div>)}</div></div>}
      {post.replyPermission === 'none' ? <p className="rounded-xl bg-raised px-4 py-3 text-sm text-muted">Tác giả đã tắt trả lời bài viết này.</p> : <form onSubmit={submitComment} className="rounded-2xl border border-line bg-raised px-3 py-2.5">
        {commentImageUrl && <div className="relative mb-2 inline-block"><img src={commentImageUrl} alt="Ảnh đính kèm bình luận" className="max-h-40 max-w-52 rounded-xl object-cover" /><button type="button" aria-label="Bỏ ảnh đính kèm" onClick={() => setCommentImageUrl('')} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-black/80 text-white"><X size={15} /></button></div>}
        <div className="flex items-center gap-2.5">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" /> : <UserCircle size={32} className="shrink-0 text-muted" />}
          <input value={commentText} onChange={event => setCommentText(event.target.value)} onFocus={() => { if (!user) router.push('/login'); }} placeholder={`Trả lời ${authorName}...`} aria-label="Viết bình luận" className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
          <input ref={commentImageInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" aria-label="Chọn ảnh cho bình luận" onChange={event => void uploadCommentImage(event.target.files?.[0])} />
          <button type="button" onClick={() => { if (!requireUser()) return; commentImageInput.current?.click(); }} disabled={commentImageBusy || busy} aria-label="Đính kèm ảnh vào bình luận" title="Đính kèm ảnh" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-accent disabled:opacity-40">{commentImageBusy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <ImageIcon size={19} />}</button>
          <button type="submit" disabled={(!commentText.trim() && !commentImageUrl) || busy || commentImageBusy} aria-label="Gửi bình luận" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-accent disabled:opacity-40"><PaperPlaneTilt size={19} /></button>
        </div>
      </form>}
      <div className="mt-4 flex items-center justify-between">
        <label className="text-xs text-muted">Sắp xếp bình luận
          <select aria-label="Sắp xếp bình luận" value={sort} onChange={event => setSort(event.target.value as 'newest' | 'oldest')} className="ml-2 rounded-lg bg-transparent font-semibold text-ink outline-none"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option></select>
        </label>
        <span className="text-xs text-muted">{commentsCount} bình luận</span>
      </div>
      {message && <p role="status" className="mt-3 text-xs text-accent">{message}</p>}
      <div className="mt-3 space-y-4">
        {sortedComments.map(comment => <div key={comment.id} className="flex gap-2.5">
          <UserCircle size={34} weight="fill" className="shrink-0 text-muted" />
          <div className="min-w-0 flex-1 rounded-2xl bg-raised px-3.5 py-2.5">
            <p className="text-xs font-bold text-ink">{comment.userName ? <AuthorHoverCard username={comment.userName} name={comment.userName}><Link href={`/authors/${encodeURIComponent(comment.userName)}`} className="hover:underline">{comment.userName}</Link></AuthorHoverCard> : 'Người dùng'} <span className="font-normal text-muted">· {timeAgo(comment.createdAt)}</span></p>
            {comment.content && <p className="mt-1 whitespace-pre-line break-words text-sm text-ink">{comment.content}</p>}
            {comment.imageUrl && <img src={comment.imageUrl} alt="Ảnh trong bình luận" loading="lazy" className="mt-2 max-h-72 max-w-full rounded-xl object-contain" />}
            <button onClick={() => { if (!user) { router.push('/login'); return; } setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText(''); }} className="mt-2 text-xs font-semibold text-muted hover:text-accent">Trả lời</button>
            {replyingTo === comment.id && <form onSubmit={event => void submitReply(event, comment.id)} className="mt-2 flex gap-2"><input value={replyText} onChange={event => setReplyText(event.target.value)} placeholder={`Trả lời ${comment.userName || 'bình luận này'}...`} aria-label="Viết phản hồi" className="min-w-0 flex-1 rounded-full border border-line bg-surface px-3 py-2 text-xs text-ink outline-none" /><button type="submit" disabled={busy || !replyText.trim()} className="text-xs font-bold text-accent disabled:opacity-40">Gửi</button></form>}
            {comment.replies?.map(reply => <div key={reply.id} className="mt-3 border-l-2 border-line pl-3"><p className="text-xs font-bold text-ink">{reply.userName ? <AuthorHoverCard username={reply.userName} name={reply.userName}><Link href={`/authors/${encodeURIComponent(reply.userName)}`} className="hover:underline">{reply.userName}</Link></AuthorHoverCard> : 'Người dùng'}</p>{reply.content && <p className="mt-1 whitespace-pre-line text-sm text-muted">{reply.content}</p>}{reply.imageUrl && <img src={reply.imageUrl} alt="Ảnh trong phản hồi" loading="lazy" className="mt-2 max-h-60 max-w-full rounded-xl object-contain" />}</div>)}
          </div>
        </div>)}
        {comments.length === 0 && <p className="py-3 text-center text-sm text-muted">Chưa có bình luận. Hãy bắt đầu cuộc trò chuyện.</p>}
      </div>
    </section>}
    {message && !showComments && <p role="status" className="border-t border-line px-5 py-2 text-xs text-accent">{message}</p>}
    {showQuoteComposer && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/65 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setShowQuoteComposer(false); }}>
      <form role="dialog" aria-modal="true" aria-labelledby={`quote-title-${post.id}`} onSubmit={submitQuote} className="w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 id={`quote-title-${post.id}`} className="text-lg font-bold text-ink">Trích dẫn bài viết</h2><button type="button" onClick={() => setShowQuoteComposer(false)} aria-label="Đóng" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-raised"><X size={20} /></button></div>
        <div className="p-5"><textarea autoFocus value={quoteText} onChange={event => setQuoteText(event.target.value)} maxLength={10000} placeholder="Bạn nghĩ gì về bài viết này?" aria-label="Nội dung trích dẫn" className="min-h-28 w-full resize-y bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-raised"><div className="px-3 pt-3 text-xs font-semibold text-muted">{authorName}</div><p className="px-3 pb-3 pt-1 text-sm font-semibold text-ink">{post.title}</p>{cover && <img src={cover} alt="" className="max-h-64 w-full object-cover" />}</div>
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3"><span className="text-xs text-muted">{quoteText.length}/10000</span><button type="submit" disabled={busy} className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang đăng…' : 'Đăng'}</button></div>
      </form>
    </div>}
  </article>;
}
