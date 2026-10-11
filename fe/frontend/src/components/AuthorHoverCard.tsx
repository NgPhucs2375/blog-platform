'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { UserCircle, UserCheck, UserPlus } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

type AuthorPreview = {
  id: number;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  followersCount: number;
  viewsCount: number;
  isFollowing: boolean;
};

const previewCache = new Map<string, AuthorPreview>();
const previewRequests = new Map<string, Promise<AuthorPreview>>();

function getAuthorPreview(username: string) {
  const cached = previewCache.get(username);
  if (cached) return Promise.resolve(cached);
  const pending = previewRequests.get(username);
  if (pending) return pending;

  const request = api.get(`/v1/authors/${encodeURIComponent(username)}`, { params: { tab: 'threads', limit: 1 } })
    .then(({ data }) => {
      const author = data.data.author as AuthorPreview;
      previewCache.set(username, author);
      return author;
    })
    .finally(() => previewRequests.delete(username));
  previewRequests.set(username, request);
  return request;
}

export default function AuthorHoverCard({ username, name, children, className = '' }: {
  username?: string | null;
  name: string;
  children: ReactNode;
  className?: string;
}) {
  const { user } = useAuth();
  const [author, setAuthor] = useState<AuthorPreview | null>(null);
  const [open, setOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelf = !!user && (String(user.id) === String(author?.id) || user.userName?.toLowerCase() === username?.toLowerCase());

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function show() {
    if (!username || isSelf) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(true);
      void getAuthorPreview(username).then(profile => {
        setAuthor(profile);
        setFollowing(profile.isFollowing);
      }).catch(() => {});
    }, 280);
  }

  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  }

  async function toggleFollow() {
    if (!author || busy) return;
    if (!user) { window.location.href = '/login'; return; }
    setBusy(true);
    try {
      const { data } = following
        ? await api.delete(`/v1/authors/${author.id}/follow`)
        : await api.post(`/v1/authors/${author.id}/follow`);
      const updated = { ...author, isFollowing: data.data.following, followersCount: data.data.followersCount };
      setAuthor(updated);
      setFollowing(updated.isFollowing);
      previewCache.set(updated.username, updated);
    } catch { /* Hover preview stays usable if follow fails. */ }
    finally { setBusy(false); }
  }

  return <span className={`relative ${className}`} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hide();
  }}>
    {children}
    {open && username && !isSelf && <span onMouseEnter={() => { if (timer.current) clearTimeout(timer.current); }} className="absolute left-0 top-[calc(100%+8px)] z-[90] block w-[min(340px,calc(100vw-40px))] rounded-2xl border border-line bg-surface p-4 text-left text-ink shadow-2xl">
      {author ? <>
        <Link href={`/authors/${encodeURIComponent(author.username)}`} onClick={hide} className="flex items-start justify-between gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="min-w-0"><span className="block truncate text-base font-bold">{name}</span><span className="mt-0.5 block text-sm text-muted">@{author.username}</span></span>
          {author.avatarUrl ? <img src={author.avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" /> : <UserCircle size={64} weight="fill" className="shrink-0 text-muted" />}
        </Link>
        {author.bio && <span className="mt-3 block line-clamp-3 whitespace-pre-line text-sm leading-relaxed">{author.bio}</span>}
        <span className="mt-3 block text-sm text-muted">{author.followersCount.toLocaleString('vi-VN')} người theo dõi</span>
        <button type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); void toggleFollow(); }} disabled={busy} className={`mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition disabled:opacity-60 ${following ? 'border border-line hover:bg-raised' : 'bg-ink text-canvas hover:opacity-90'}`}>
          {following ? <UserCheck size={17} /> : <UserPlus size={17} />}{following ? 'Đang theo dõi' : 'Theo dõi'}
        </button>
      </> : <span className="flex animate-pulse items-center gap-3"><span className="h-14 w-14 rounded-full bg-raised" /><span className="flex-1 space-y-2"><span className="block h-3 w-2/3 rounded bg-raised" /><span className="block h-3 w-1/2 rounded bg-raised" /></span></span>}
    </span>}
  </span>;
}
