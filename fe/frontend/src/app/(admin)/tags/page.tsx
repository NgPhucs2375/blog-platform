'use client';
import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import api from '@/lib/axios';
interface Tag { id: number; name: string; slug: string; posts_count: number; }
function TagsManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [page, setPage] = useState(1);
  const [last, setLast] = useState(1);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/v1/tags', { params: { page, limit: 20, search } }); setTags(res.data.data.data); setLast(res.data.data.last_page); }
    catch { setError('Không tải được danh sách thẻ.'); }
    finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => clearTimeout(timer); }, [load]);
  function reset() { setName(''); setSlug(''); setEditing(null); }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError(''); setMessage('');
    try {
      const data = { name: name.trim(), slug: slug.trim() || undefined };
      if (editing) await api.put(`/v1/tags/${editing}`, data); else await api.post('/v1/tags', data);
      reset(); setMessage('Đã lưu thẻ bài viết.'); await load();
    } catch (err) { setError(isAxiosError(err) ? err.response?.data?.message || 'Không lưu được thẻ.' : 'Không lưu được thẻ.'); }
    finally { setBusy(false); }
  }
  async function remove(tag: Tag) {
    if (!window.confirm(`Xóa thẻ “${tag.name}”? Bài viết vẫn được giữ lại.`)) return;
    setBusy(true); setError('');
    try { await api.delete(`/v1/tags/${tag.id}`); if (editing === tag.id) reset(); setMessage('Đã xóa thẻ.'); if (tags.length === 1 && page > 1) setPage(page - 1); else await load(); }
    catch { setError('Không xóa được thẻ.'); } finally { setBusy(false); }
  }
  const field = 'w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink';
  return <div className="mx-auto max-w-5xl space-y-6"><header><h1 className="text-2xl font-bold text-ink">Thẻ bài viết</h1><p className="mt-2 text-sm text-muted">Nhóm bài viết theo các chủ đề để người đọc dễ tìm kiếm.</p></header>
    {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{error}<button onClick={() => void load()} className="ml-3 underline">Thử lại</button></p>}
    {message && <p role="status" className="text-sm text-accent">{message}</p>}
    <form onSubmit={save} className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2"><label className="space-y-2 text-sm text-ink"><span>Tên thẻ</span><input className={field} value={name} maxLength={100} required onChange={e => setName(e.target.value)} placeholder="Ví dụ: Công nghệ" /></label><label className="space-y-2 text-sm text-ink"><span>Đường dẫn (tự tạo nếu để trống)</span><input className={field} value={slug} maxLength={120} onChange={e => setSlug(e.target.value)} placeholder="cong-nghe" /></label><div className="flex gap-3"><button disabled={busy} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">{editing ? 'Lưu thay đổi' : 'Thêm thẻ'}</button>{editing && <button type="button" onClick={reset} className="text-sm text-muted">Hủy sửa</button>}</div></form>
    <input aria-label="Tìm kiếm thẻ" className={field} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tên thẻ…" />
    <div className="overflow-x-auto rounded-2xl border border-line"><table className="w-full text-left text-sm"><thead className="bg-raised text-muted"><tr><th className="p-4">Tên thẻ</th><th>Đường dẫn</th><th>Bài đã đăng</th><th className="p-4">Thao tác</th></tr></thead><tbody>{tags.map(tag => <tr key={tag.id} className="border-t border-line text-ink"><td className="p-4 font-medium">{tag.name}</td><td>{tag.slug}</td><td>{tag.posts_count}</td><td className="p-4"><button disabled={busy} onClick={() => { setEditing(tag.id); setName(tag.name); setSlug(tag.slug); }} className="mr-4 text-accent">Sửa</button><button disabled={busy} onClick={() => void remove(tag)} className="text-rose-500">Xóa</button></td></tr>)}</tbody></table>{!tags.length && <p className="p-6 text-center text-sm text-muted">{loading ? 'Đang tải…' : 'Chưa có thẻ phù hợp.'}</p>}</div>
    <div className="flex justify-between text-sm text-muted"><button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} className="disabled:opacity-30">Trang trước</button><span>Trang {page} / {last}</span><button disabled={page >= last || loading} onClick={() => setPage(page + 1)} className="disabled:opacity-30">Trang sau</button></div>
  </div>;
}
export default function TagsPage() { return <ProtectedRoute requiredRole="Admin"><TagsManager /></ProtectedRoute>; }
