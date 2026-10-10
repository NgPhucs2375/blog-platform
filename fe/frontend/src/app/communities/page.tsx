'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, UsersThree } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { postApi } from '@/services/postApi';

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<any[]>([]);
  const [form, setForm] = useState(false);
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  async function load() { setCommunities(await postApi.getCommunities(search)); }
  useEffect(() => { void load(); }, [search]);
  async function create(event: React.FormEvent) {
    event.preventDefault(); setError('');
    try { await api.post('/v1/communities', { name, topic, description, icon }); setForm(false); setName(''); setTopic(''); setDescription(''); setIcon(''); await load(); }
    catch (e: any) { setError(e.response?.data?.message || 'Không tạo được cộng đồng.'); }
  }
  return <main className="mx-auto min-h-[calc(100dvh-4rem)] max-w-5xl px-4 py-10 sm:px-6"><header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6"><div><p className="text-xs font-bold uppercase tracking-widest text-accent">Cộng đồng</p><h1 className="mt-2 font-serif text-4xl font-bold text-ink">Tìm người cùng mối quan tâm</h1><p className="mt-2 text-sm text-muted">Tham gia cộng đồng công khai để xem và đăng bài theo chủ đề.</p></div>{user && <button onClick={() => setForm(!form)} className="rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white"><Plus className="mr-1 inline" />Tạo cộng đồng</button>}</header>
    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm cộng đồng hoặc chủ đề" className="mt-5 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent" />
    {form && <form onSubmit={create} className="mt-5 grid gap-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[90px_1fr_1fr]"><label className="text-xs text-muted">Biểu tượng<input maxLength={8} value={icon} onChange={e => setIcon(e.target.value)} placeholder="📚" className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-center text-lg text-ink" /></label><input required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="Tên cộng đồng" className="rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink" /><input maxLength={120} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Chủ đề" className="rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink" /><textarea maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả" className="min-h-20 rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink sm:col-span-3" />{error && <p role="alert" className="text-sm text-red-400 sm:col-span-3">{error}</p>}<button className="rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white sm:col-span-3">Tạo cộng đồng</button></form>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2">{communities.map(community => <Link key={community.id} href={`/communities/${community.slug}`} className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-accent/50"><div className="flex items-start justify-between"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-raised text-lg">{community.icon || <UsersThree className="text-muted" size={22} />}</span><div><p className="text-xs font-bold uppercase tracking-wider text-accent">{community.topic || 'Chủ đề mở'}</p><h2 className="mt-2 text-lg font-bold text-ink group-hover:text-accent">{community.name}</h2></div></div></div><p className="mt-2 line-clamp-2 text-sm text-muted">{community.description || 'Cùng trò chuyện và chia sẻ trong cộng đồng này.'}</p><p className="mt-4 text-xs text-muted">{community.membersCount} thành viên · {community.postsCount} bài viết</p></Link>)}</div>
    {!communities.length && <p className="py-16 text-center text-sm text-muted">Chưa tìm thấy cộng đồng. Bạn có thể tạo cộng đồng đầu tiên.</p>}
  </main>;
}
