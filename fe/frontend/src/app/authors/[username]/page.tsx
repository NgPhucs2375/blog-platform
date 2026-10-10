'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChatCircleText, ImageSquare, Repeat, UserCircle, UserPlus, UserCheck } from '@phosphor-icons/react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import SocialPostCard from '@/components/SocialPostCard';
import type { PostItem } from '@/services/postApi';
import AuthorHoverCard from '@/components/AuthorHoverCard';

type Tab = 'threads' | 'replies' | 'media' | 'reposts';
type Author = { id: number; username: string; bio?: string | null; avatarUrl?: string | null; followersCount: number; followingCount: number; postsCount: number; viewsCount: number; isFollowing: boolean };
type Reply = { id: number; content: string; createdAt?: string; post?: { id: number; slug: string; title: string; authorName?: string } | null };
const tabs: { id: Tab; label: string; icon: typeof ChatCircleText }[] = [
  { id: 'threads', label: 'Bài viết', icon: ChatCircleText },
  { id: 'replies', label: 'Phản hồi', icon: ChatCircleText },
  { id: 'media', label: 'Media', icon: ImageSquare },
  { id: 'reposts', label: 'Đăng lại', icon: Repeat },
];

export default function PublicAuthorPage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('threads');
  const [author, setAuthor] = useState<Author | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async (selected: Tab) => {
    setLoading(true); setNotice('');
    try {
      const { data } = await api.get(`/v1/authors/${encodeURIComponent(username)}`, { params: { tab: selected, limit: 24 } });
      const payload = data.data;
      setAuthor(payload.author);
      setPosts(payload.posts?.data || []);
      setReplies(payload.comments?.data || []);
    } catch {
      setAuthor(null); setPosts([]); setReplies([]);
      setNotice('Không tìm thấy trang cá nhân này.');
    } finally { setLoading(false); }
  }, [username]);

  useEffect(() => { void load(tab); }, [load, tab]);

  async function toggleFollow() {
    if (!user) { router.push('/login'); return; }
    if (!author || busy || Number(user.id) === author.id) return;
    setBusy(true);
    try {
      const { data } = author.isFollowing
        ? await api.delete(`/v1/authors/${author.id}/follow`)
        : await api.post(`/v1/authors/${author.id}/follow`);
      setAuthor({ ...author, isFollowing: data.data.following, followersCount: data.data.followersCount });
    } catch { setNotice('Không cập nhật được trạng thái theo dõi.'); }
    finally { setBusy(false); }
  }

  if (loading && !author) return <div className="mx-auto min-h-[70vh] max-w-[680px] animate-pulse px-4 py-12"><div className="h-40 rounded-3xl bg-raised" /><div className="mt-6 h-16 rounded-2xl bg-raised" /></div>;
  if (!author) return <main className="mx-auto min-h-[65vh] max-w-2xl px-5 py-24 text-center"><h1 className="text-2xl font-bold text-ink">Không tìm thấy người dùng</h1><p className="mt-2 text-sm text-muted">{notice}</p><Link href="/posts" className="mt-6 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white">Về bảng tin</Link></main>;

  const ownProfile = Number(user?.id) === author.id;
  return <main className="min-h-screen bg-canvas text-ink">
    <div className="mx-auto max-w-[680px] px-0 pb-20 pt-0 sm:px-4 sm:pt-5">
      <div className="overflow-hidden border-y border-line bg-surface sm:rounded-[26px] sm:border">
      <section className="px-5 pb-5 pt-6 sm:px-6 sm:pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-bold leading-tight tracking-tight sm:text-2xl">{author.username}</h1>
            <p className="mt-1 text-sm text-muted">@{author.username}</p>
          </div>
          {author.avatarUrl ? <img src={author.avatarUrl} alt={`${author.username} avatar`} className="h-[76px] w-[76px] shrink-0 rounded-full border border-line object-cover sm:h-[84px] sm:w-[84px]" /> : <UserCircle size={84} weight="fill" className="shrink-0 text-muted" />}
        </div>
        {author.bio && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{author.bio}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <span><strong className="font-semibold text-ink">{author.followersCount.toLocaleString('vi-VN')}</strong> người theo dõi</span>
          <span aria-hidden="true">·</span>
          <span>{author.viewsCount.toLocaleString('vi-VN')} lượt xem gần đây</span>
        </div>
        <div className="mt-5">
          {!ownProfile ? <button onClick={() => void toggleFollow()} disabled={busy} aria-pressed={author.isFollowing} className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition disabled:opacity-60 ${author.isFollowing ? 'border border-line bg-transparent text-ink hover:bg-raised' : 'bg-ink text-canvas hover:opacity-90'}`}>
            {author.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}{author.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button> : <Link href="/profile" className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-line text-sm font-bold hover:bg-raised">Chỉnh sửa hồ sơ</Link>}
        </div>
        {notice && <p role="status" className="mt-3 text-xs text-accent">{notice}</p>}
      </section>

      <nav aria-label="Nội dung trang cá nhân" className="sticky top-0 z-20 grid grid-cols-4 border-y border-line bg-surface/95 backdrop-blur">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={`relative flex min-h-12 items-center justify-center gap-2 px-2 text-xs font-semibold transition sm:text-sm ${tab === id ? 'text-ink' : 'text-muted hover:text-ink'}`}><Icon size={18} className="sm:hidden" /><span>{label}</span>{tab === id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />}</button>)}
      </nav>

      {loading ? <div className="space-y-3 p-4">{[0, 1, 2].map(index => <div key={index} className="h-48 animate-pulse rounded-3xl bg-raised" />)}</div> : tab === 'replies' ? (
        <div className="divide-y divide-line">{replies.map(reply => <article key={reply.id} className="px-5 py-4 sm:px-6"><div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-raised"><ChatCircleText size={18} className="text-muted" /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold"><AuthorHoverCard username={author.username} name={author.username}><Link href={`/authors/${encodeURIComponent(author.username)}`} className="hover:underline">{author.username}</Link></AuthorHoverCard><span className="ml-2 font-normal text-muted">đã phản hồi</span></p><p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{reply.content}</p>{reply.post && <div className="mt-3 rounded-2xl border border-line p-3 text-sm hover:bg-raised">{reply.post.authorName && <p className="text-xs text-muted"><AuthorHoverCard username={reply.post.authorName} name={reply.post.authorName}><Link href={`/authors/${encodeURIComponent(reply.post.authorName)}`} className="hover:underline">{reply.post.authorName}</Link></AuthorHoverCard></p>}<Link href={`/posts/${reply.post.slug || reply.post.id}`} className="mt-1 block font-semibold">{reply.post.title}</Link></div>}</div></div></article>)}{!replies.length && <EmptyState text="Chưa có phản hồi nào." />}</div>
      ) : <div className="divide-y divide-line">{posts.map(post => <SocialPostCard key={post.id} post={post} variant="feed" />)}{!posts.length && <EmptyState text={tab === 'media' ? 'Chưa có bài viết kèm hình ảnh.' : tab === 'reposts' ? 'Chưa có bài viết được đăng lại.' : 'Chưa có bài viết nào.'} />}</div>}
      </div>
    </div>
  </main>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-5 py-16 text-center"><p className="text-sm text-muted">{text}</p></div>;
}
