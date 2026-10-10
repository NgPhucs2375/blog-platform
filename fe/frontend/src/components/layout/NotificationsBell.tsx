'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Checks } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
interface Notice { id: string; read_at: string | null; created_at: string; data: { title?: string; slug?: string; postId?: number; message?: string }; }
export default function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const panel = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    if (!user) return;
    const version = generation.current;
    try {
      const res = await api.get('/v1/notifications?limit=100');
      if (version !== generation.current) return;
      setItems(res.data.data.notifications.data); setUnread(res.data.data.unreadCount); setError('');
    } catch { if (version === generation.current) setError('Chưa tải được thông báo.'); }
  }, [user]);
  useEffect(() => {
    generation.current++; setItems([]); setUnread(0); setError(''); setOpen(false); void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => { generation.current++; window.clearInterval(timer); };
  }, [load]);
  useEffect(() => {
    if (!open) return;
    void load();
    const close = (e: MouseEvent) => { if (!panel.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', close); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', escape); };
  }, [open, load]);
  async function markRead(id?: string) {
    setBusy(true);
    try { await api.patch(id ? `/v1/notifications/${id}/read` : '/v1/notifications/read-all'); await load(); }
    catch { setError('Không thể đánh dấu đã đọc. Hãy thử lại.'); }
    finally { setBusy(false); }
  }
  return <div className="relative" ref={panel}>
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Thông báo, ${unread} chưa đọc`} className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-muted"><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}</button>
    {open && <div className="absolute right-0 z-50 mt-3 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl" aria-label="Danh sách thông báo">
      <div className="flex items-center justify-between border-b border-line p-4"><strong className="text-sm text-ink">Thông báo</strong>{user && <button disabled={busy || !unread} onClick={() => void markRead()} className="flex items-center gap-1 text-xs text-accent disabled:opacity-40"><Checks />Đọc hết</button>}</div>
      {error && <div role="alert" className="p-3 text-xs text-rose-500">{error} <button onClick={() => void load()} className="underline">Thử lại</button></div>}
      <div className="max-h-96 overflow-y-auto">{!user ? <p className="p-6 text-sm text-muted"><Link href="/login" className="underline">Đăng nhập</Link> để xem thông báo.</p> : items.length === 0 && !error ? <p className="p-6 text-sm text-muted">Chưa có thông báo nào.</p> : items.map(item => <div key={item.id} className={`border-b border-line p-4 ${item.read_at ? 'opacity-60' : 'bg-accent/5'}`}>
        <Link href={item.data.slug || item.data.postId ? `/posts/${encodeURIComponent(item.data.slug || String(item.data.postId))}` : '/dashboard'} onClick={() => { if (!item.read_at) void markRead(item.id); setOpen(false); }} className="block text-sm font-semibold text-ink">{item.data.message || 'Bài viết mới'}<span className="mt-1 block font-normal">{item.data.title || 'Thông báo từ Blog Platform'}</span></Link>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted"><time>{new Date(item.created_at).toLocaleString('vi-VN')}</time>{!item.read_at && <button disabled={busy} onClick={() => void markRead(item.id)} className="text-accent">Đã đọc</button>}</div>
      </div>)}</div>
    </div>}
  </div>;
}
