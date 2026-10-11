'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Crown, PencilSimple, UsersThree } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import SocialPostCard from '@/components/SocialPostCard';
import type { PostItem } from '@/services/postApi';

export default function CommunityPage() {
  const params = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [flair, setFlair] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get(`/v1/communities/${encodeURIComponent(params.slug)}/posts`);
    const details = data.data.community;
    setCommunity(details); setPosts(data.data.posts || []); setFlair(details.myFlair || '');
    setName(details.name); setIcon(details.icon || ''); setDescription(details.description || '');
    if (details.canModerate) {
      const [pending, roster] = await Promise.all([
        api.get(`/v1/communities/${encodeURIComponent(params.slug)}/moderation`).catch(() => ({ data: { data: [] } })),
        api.get(`/v1/communities/${details.id}/members`).catch(() => ({ data: { data: [] } })),
      ]);
      setQueue(pending.data.data || []); setMembers(roster.data.data || []);
    }
  }, [params.slug]);

  useEffect(() => { void load().catch(() => setCommunity(null)); }, [load]);

  async function toggleMembership() {
    if (!community || busy) return;
    setBusy(true);
    try { if (community.isMember) await api.delete(`/v1/communities/${community.id}/join`); else await api.post(`/v1/communities/${community.id}/join`); await load(); }
    catch { setNotice('Không cập nhật được thành viên. Hãy thử lại.'); }
    finally { setBusy(false); }
  }

  async function saveFlair(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try { await api.put(`/v1/communities/${community.id}/membership`, { flair }); await load(); setNotice('Đã cập nhật nhãn thành viên.'); }
    catch { setNotice('Không lưu được nhãn. Hãy dùng tối đa 40 ký tự.'); }
    finally { setBusy(false); }
  }

  async function saveCommunity(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try { await api.put(`/v1/communities/${community.id}`, { name, icon, description }); setEditing(false); await load(); setNotice('Đã cập nhật cộng đồng.'); }
    catch { setNotice('Không lưu được thông tin cộng đồng.'); }
    finally { setBusy(false); }
  }

  async function moderate(postId: number, action: 'approve' | 'hide') {
    try { await api.post(`/v1/communities/${community.id}/posts/${postId}/moderate`, { action }); await load(); }
    catch { setNotice('Không xử lý được bài viết.'); }
  }

  async function setChampion(member: any) {
    try { await api.put(`/v1/communities/${community.id}/members/${member.id}/champion`, { isChampion: !member.isChampion }); await load(); }
    catch { setNotice('Không cập nhật được huy hiệu.'); }
  }

  async function setModerator(member: any) {
    try { await api.put(`/v1/communities/${community.id}/members/${member.id}/moderator`, { isModerator: member.role !== 'Moderator' }); await load(); }
    catch { setNotice('Chỉ người tạo cộng đồng mới đổi được vai trò quản lý.'); }
  }

  if (!community) return <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-16 text-center text-muted">Đang tải cộng đồng…</main>;
  return <main className="mx-auto min-h-[calc(100dvh-4rem)] max-w-3xl px-4 py-8 sm:px-6">
    <Link href="/communities" className="text-sm font-semibold text-accent">← Cộng đồng</Link>
    <header className="mt-5 rounded-3xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-raised text-2xl">{community.icon || <UsersThree size={24} />}</span><div><p className="text-xs font-bold uppercase tracking-widest text-accent">{community.topic || 'Chủ đề mở'}</p><h1 className="mt-1 text-2xl font-bold text-ink">{community.name}</h1></div></div>{community.canModerate && <button onClick={() => setEditing(value => !value)} aria-label="Chỉnh sửa cộng đồng" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-raised"><PencilSimple size={18} /></button>}</div>
      <p className="mt-3 text-sm leading-6 text-muted">{community.description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted"><UsersThree className="mr-1 inline" />{community.membersCount} thành viên · {community.postsCount} bài viết</span>{user && <button onClick={() => void toggleMembership()} disabled={busy} className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{community.isMember ? 'Rời cộng đồng' : 'Tham gia'}</button>}</div>
      {editing && <form onSubmit={saveCommunity} className="mt-5 grid gap-2 border-t border-line pt-4 sm:grid-cols-[90px_1fr]"><label className="text-xs text-muted">Biểu tượng<input maxLength={8} value={icon} onChange={event => setIcon(event.target.value)} className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-center text-lg text-ink" /></label><input value={name} maxLength={120} required onChange={event => setName(event.target.value)} className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink" aria-label="Tên cộng đồng" /><textarea value={description} maxLength={2000} onChange={event => setDescription(event.target.value)} className="min-h-20 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink sm:col-span-2" aria-label="Mô tả cộng đồng" /><button disabled={busy} className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white sm:col-span-2">Lưu thông tin</button></form>}
      {user && community.isMember && <form onSubmit={saveFlair} className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4"><label htmlFor="member-flair" className="text-sm text-muted">Nhãn của bạn</label><input id="member-flair" value={flair} maxLength={40} onChange={event => setFlair(event.target.value)} placeholder="Ví dụ: Người yêu sách" className="min-w-0 flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink" /><button disabled={busy} className="rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink">Lưu nhãn</button></form>}
    </header>
    {notice && <p role="status" className="mt-3 text-sm text-accent">{notice}</p>}
    {community.canModerate && <section className="mt-5 space-y-4 rounded-2xl border border-line bg-surface p-5"><h2 className="font-bold text-ink">Công cụ quản lý</h2><div><h3 className="mb-2 text-sm font-semibold text-muted">Bài viết cần xử lý ({queue.length})</h3>{queue.length ? <div className="divide-y divide-line">{queue.map(post => <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold text-ink">{post.title}</p><p className="text-xs text-muted">@{post.author?.username || post.authorName} · {post.status}</p></div><div className="flex gap-2"><button onClick={() => void moderate(post.id, 'approve')} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white">Duyệt</button><button onClick={() => void moderate(post.id, 'hide')} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted">Ẩn</button></div></div>)}</div> : <p className="text-sm text-muted">Không có bài chờ xử lý.</p>}</div><div><h3 className="mb-2 text-sm font-semibold text-muted">Thành viên và huy hiệu</h3><div className="divide-y divide-line">{members.map(member => <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm"><span className="text-ink">@{member.username}{member.role === 'Moderator' && <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">Quản lý</span>}{member.flair && <span className="ml-2 rounded-full bg-raised px-2 py-0.5 text-xs text-muted">{member.flair}</span>}</span><div className="flex flex-wrap gap-2"><button onClick={() => void setChampion(member)} aria-pressed={member.isChampion} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${member.isChampion ? 'bg-amber-500/10 text-amber-600' : 'border border-line text-muted'}`}><Crown size={15} />{member.isChampion ? 'Gỡ huy hiệu' : 'Đóng góp nổi bật'}</button>{community.creatorId === user?.id && member.id !== community.creatorId && <button onClick={() => void setModerator(member)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted">{member.role === 'Moderator' ? 'Gỡ quản lý' : 'Thêm quản lý'}</button>}</div></div>)}</div></div></section>}
    <div className="mt-5 space-y-4">{posts.map(post => <SocialPostCard key={post.id} post={post} onReaderControl={() => void load()} />)}{!posts.length && <p className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted">Chưa có bài viết trong cộng đồng này.</p>}</div>
  </main>;
}
