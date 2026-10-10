'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import AuthorHoverCard from '@/components/AuthorHoverCard';
interface Item { id: number; title?: string; content: string; authorName?: string; user?: { username: string }; }
function ReviewQueue() {
  const [kind, setKind] = useState<'posts' | 'comments'>('posts');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const res = await api.get(`/v1/admin/${kind}?status=Pending&limit=100`); setItems(kind === 'posts' ? res.data.data.posts : res.data.data.data); }
    catch { setError('Không tải được hàng chờ duyệt.'); }
    finally { setLoading(false); }
  }, [kind]);
  useEffect(() => { void load(); }, [load]);
  async function approve(id: number, hide = false) {
    setBusy(id); setError('');
    try { await api.post(`/v1/${kind}/${id}/${hide ? 'hide' : 'approve'}`); await load(); }
    catch { setError('Không xử lý được nội dung. Hãy thử lại.'); }
    finally { setBusy(null); }
  }
  return <section className="mx-auto max-w-4xl space-y-5"><h1 className="text-2xl font-bold text-ink">Nội dung chờ duyệt</h1><p className="text-sm text-muted">Duyệt tối đa 100 nội dung mỗi lượt. Danh sách tự cập nhật sau khi xử lý.</p><div className="flex gap-3">{(['posts','comments'] as const).map(tab => <button key={tab} onClick={() => setKind(tab)} className={`rounded-xl border border-line px-4 py-2 text-sm ${kind === tab ? 'bg-accent text-white' : 'text-muted'}`}>{tab === 'posts' ? 'Bài viết' : 'Bình luận'}</button>)}</div>{error && <p role="alert" className="text-rose-500">{error}<button onClick={() => void load()} className="ml-3 underline">Thử lại</button></p>}{loading && <p className="text-muted">Đang tải…</p>}{!loading && !items.length && <p className="rounded-2xl border border-line p-8 text-center text-muted">Không có nội dung chờ duyệt.</p>}{items.map(item => <article key={item.id} className="space-y-4 rounded-2xl border border-line bg-surface p-5"><header><h2 className="font-bold text-ink">{item.title || `Bình luận của ${item.user?.username || 'người dùng'}`}</h2>{item.authorName && <p className="text-xs text-muted">{item.user?.username ? <AuthorHoverCard username={item.user.username} name={item.authorName}><Link href={`/authors/${encodeURIComponent(item.user.username)}`} className="hover:underline">{item.authorName}</Link></AuthorHoverCard> : item.authorName}</p>}</header><details><summary className="cursor-pointer text-sm text-accent">Đọc toàn bộ nội dung</summary><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-ink">{item.content}</p></details><div className="flex gap-4 text-sm"><button disabled={busy !== null} onClick={() => void approve(item.id)} className="rounded-lg bg-accent px-4 py-2 text-white disabled:opacity-40">Duyệt</button>{kind === 'comments' ? <button disabled={busy !== null} onClick={() => void approve(item.id, true)} className="text-rose-500">Ẩn bình luận</button> : <Link href={`/dashboard/posts/edit/${item.id}`} className="py-2 text-muted underline">Chỉnh sửa bài</Link>}</div></article>)}</section>;
}
export default function ReviewPage() { return <ProtectedRoute requiredRole="Admin"><ReviewQueue /></ProtectedRoute>; }
