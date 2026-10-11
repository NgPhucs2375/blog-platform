'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, BookmarkSimple, ChartLineUp, Compass, Heart, House, MagnifyingGlass, Plus, UsersThree, UserCircle } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { postApi, type PostItem } from '@/services/postApi';
import SocialPostCard from '@/components/SocialPostCard';
import api from '@/lib/axios';

type FeedKind = 'discover' | 'following' | 'saved' | 'liked' | 'profile' | 'activity' | `custom-${number}` | `public-${number}`;
type ColumnKind = FeedKind | 'search' | 'insights';
type FeedFilterKind = 'category' | 'tag' | 'community' | 'author';
const readerControlLabels: Record<string, string> = { block: 'Đã chặn', mute: 'Đã ẩn tác giả', hide_post: 'Đã ẩn bài viết', less_category: 'Ít bài chuyên mục' };

function toTagSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const labels: Record<string, string> = {
  discover: 'Dành cho bạn', following: 'Đang theo dõi', saved: 'Đã lưu', liked: 'Đã thích', profile: 'Bài viết của tôi', activity: 'Hoạt động',
};
const icons = { discover: Compass, following: UsersThree, saved: BookmarkSimple, liked: Heart, profile: UserCircle, activity: Bell };

export default function PostsPage() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<FeedKind>('discover');
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [communities, setCommunities] = useState<any[]>([]);
  const [customFeeds, setCustomFeeds] = useState<any[]>([]);
  const [publicFeeds, setPublicFeeds] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [defaultFeed, setDefaultFeed] = useState<FeedKind>('discover');
  const [pinnedFeedIds, setPinnedFeedIds] = useState<number[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [feedName, setFeedName] = useState('');
  const [feedFilterKind, setFeedFilterKind] = useState<FeedFilterKind>('category');
  const [feedFilterValue, setFeedFilterValue] = useState('');
  const [feedPublic, setFeedPublic] = useState(false);
  const [addingFeed, setAddingFeed] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [readerControls, setReaderControls] = useState<any[]>([]);
  const [showReaderControls, setShowReaderControls] = useState(false);
  const [multiColumn, setMultiColumn] = useState(false);
  const [columnFeeds, setColumnFeeds] = useState<ColumnKind[]>(['discover']);
  const [columnData, setColumnData] = useState<Record<string, { posts: PostItem[]; activities: any[] }>>({});
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [columnSearch, setColumnSearch] = useState<Record<number, string>>({});
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [otherFeedsOpen, setOtherFeedsOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedFeed = params.get('feed');
    const stored = localStorage.getItem('blog-active-feed');
    if (requestedFeed && (requestedFeed in labels || /^(custom|public)-\d+$/.test(requestedFeed))) setFeed(requestedFeed as FeedKind);
    else if (stored && (stored in labels || /^(custom|public)-\d+$/.test(stored))) setFeed(stored as FeedKind);
    setTagFilter(params.get('tag') || '');
    if (user) void api.get('/v1/reader/preferences').then(({ data }) => {
      setDefaultFeed(data.data.defaultFeed);
      setPinnedFeedIds(data.data.pinnedFeedIds || []);
      // The saved account preference should win over this browser's last active
      // feed. An explicit ?feed= URL still takes precedence for shared links.
      if (!requestedFeed) setFeed(data.data.defaultFeed as FeedKind);
    }).catch(() => {});
  }, [user]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setFeedError('');
    try {
      if (feed === 'discover') setPosts(await postApi.getPosts(tagFilter ? { tag: tagFilter } : undefined));
      else if (feed.startsWith('public-')) setPosts(await postApi.getFeed('public', Number(feed.slice(7))));
      else if (!user) setPosts([]);
      else if (feed === 'activity') {
        const response = await api.get('/v1/notifications?limit=30');
        setActivities(response.data.data.notifications?.data || []);
        setPosts([]);
      } else if (feed === 'profile') {
        const response = await api.get(`/v1/authors/${encodeURIComponent(user.userName)}?limit=50`);
        setPosts(response.data.data.posts?.data || []);
      } else if (feed.startsWith('custom-')) setPosts(await postApi.getFeed('custom', Number(feed.slice(7))));
      else if (feed === 'saved') setPosts(await postApi.getFeed('bookmarks'));
      else if (feed === 'liked') setPosts(await postApi.getFeed('liked'));
      else setPosts(await postApi.getFeed('following'));
    } catch {
      setPosts([]);
      setFeedError('Không tải được bảng tin. Vui lòng thử lại.');
    } finally { setLoading(false); }
  }, [feed, tagFilter, user]);

  useEffect(() => { void loadFeed(); }, [loadFeed]);
  useEffect(() => {
    void postApi.getCommunities().then(setCommunities).catch(() => setCommunities([]));
    if (user) void postApi.getCustomFeeds().then(setCustomFeeds).catch(() => setCustomFeeds([]));
    void postApi.getPublicFeeds().then(setPublicFeeds).catch(() => setPublicFeeds([]));
    void postApi.getCategories().then(setCategories).catch(() => setCategories([]));
  }, [user]);

  useEffect(() => {
    if (!multiColumn) return;
    let cancelled = false;
    setColumnsLoading(true);
    Promise.all(columnFeeds.map(async kind => {
      try {
        if (kind === 'search' || kind === 'insights') return [kind, { posts: await postApi.getPosts(), activities: [] }] as const;
        if (kind === 'discover') return [kind, { posts: await postApi.getPosts(), activities: [] }] as const;
        if (kind === 'following') return [kind, { posts: user ? await postApi.getFeed('following') : [], activities: [] }] as const;
        if (kind === 'saved') return [kind, { posts: user ? await postApi.getFeed('bookmarks') : [], activities: [] }] as const;
        if (kind === 'liked') return [kind, { posts: user ? await postApi.getFeed('liked') : [], activities: [] }] as const;
        if (kind === 'activity') {
          const response = await api.get('/v1/notifications?limit=20');
          return [kind, { posts: [], activities: response.data.data.notifications?.data || [] }] as const;
        }
        if (kind === 'profile' && user) {
          const response = await api.get(`/v1/authors/${encodeURIComponent(user.userName)}?limit=30`);
          return [kind, { posts: response.data.data.posts?.data || [], activities: [] }] as const;
        }
        if (kind.startsWith('custom-')) return [kind, { posts: await postApi.getFeed('custom', Number(kind.slice(7))), activities: [] }] as const;
        if (kind.startsWith('public-')) return [kind, { posts: await postApi.getFeed('public', Number(kind.slice(7))), activities: [] }] as const;
        return [kind, { posts: [], activities: [] }] as const;
      } catch { return [kind, { posts: [], activities: [] }] as const; }
    })).then(rows => { if (!cancelled) setColumnData(Object.fromEntries(rows)); })
      .finally(() => { if (!cancelled) setColumnsLoading(false); });
    return () => { cancelled = true; };
  }, [columnFeeds, multiColumn, user]);

  function selectFeed(kind: FeedKind) {
    setFeed(kind);
    localStorage.setItem('blog-active-feed', kind);
  }

  function addColumn(kind: ColumnKind) {
    setColumnFeeds(current => current.length >= 3 ? current : [...current, kind]);
    setAddColumnOpen(false);
    setOtherFeedsOpen(false);
  }

  async function createFeed(event: React.FormEvent) {
    event.preventDefault();
    if (!feedName.trim() || !feedFilterValue.trim()) return;
    const filters = feedFilterKind === 'category' ? { categoryId: Number(feedFilterValue) } : feedFilterKind === 'community' ? { communityId: Number(feedFilterValue) } : feedFilterKind === 'author' ? { author: feedFilterValue.trim().replace(/^@/, '') } : { tag: toTagSlug(feedFilterValue.replace(/^#/, '')) };
    await api.post('/v1/custom-feeds', { name: feedName.trim(), filters, isPublic: feedPublic });
    setFeedName(''); setFeedFilterValue(''); setFeedPublic(false); setAddingFeed(false);
    const updated = await postApi.getCustomFeeds();
    setCustomFeeds(updated);
    const created = updated[updated.length - 1];
    if (created) selectFeed(`custom-${created.id}`);
    if (feedPublic) setPublicFeeds(await postApi.getPublicFeeds());
  }

  async function saveFeedPreferences(next: { defaultFeed?: FeedKind; pinnedFeedIds?: number[] }) {
    try {
      await api.put('/v1/reader/preferences', { defaultFeed: next.defaultFeed || defaultFeed, pinnedFeedIds: next.pinnedFeedIds || pinnedFeedIds });
      if (next.defaultFeed) setDefaultFeed(next.defaultFeed);
      if (next.pinnedFeedIds) setPinnedFeedIds(next.pinnedFeedIds);
    } catch { setFeedError('Không lưu được tùy chọn bảng tin.'); }
  }

  async function shareCurrentFeed() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/posts?feed=${feed}`); setFeedError('Đã sao chép liên kết bảng tin.'); window.setTimeout(() => setFeedError(''), 1800); }
    catch { setFeedError('Không sao chép được liên kết bảng tin.'); }
  }

  async function toggleReaderControls() {
    const next = !showReaderControls;
    setShowReaderControls(next);
    if (next) {
      try { const { data } = await api.get('/v1/reader/controls'); setReaderControls(data.data || []); }
      catch { setFeedError('Không tải được tùy chọn nội dung.'); }
    }
  }

  async function removeReaderControl(id: number) {
    try { await api.delete(`/v1/reader/controls/${id}`); setReaderControls(rows => rows.filter(row => row.id !== id)); void loadFeed(); }
    catch { setFeedError('Không gỡ được tùy chọn này.'); }
  }

  const visiblePosts = useMemo(() => posts.filter(post => !search || `${post.title} ${post.content}`.toLowerCase().includes(search.toLowerCase())), [posts, search]);
  const categoryOptions = Array.from(new Map(posts.filter(post => post.category).map(post => [post.category!.id, post.category!])).values());
  const feedOptions: { kind: FeedKind; label: string; icon: typeof House }[] = [
    { kind: 'discover', label: labels.discover, icon: icons.discover },
    { kind: 'following', label: labels.following, icon: icons.following },
    ...(user ? [
      { kind: 'saved' as const, label: labels.saved, icon: icons.saved },
      { kind: 'liked' as const, label: labels.liked, icon: icons.liked },
      { kind: 'profile' as const, label: labels.profile, icon: icons.profile },
      { kind: 'activity' as const, label: labels.activity, icon: icons.activity },
    ] : []),
    ...[...customFeeds].sort((a, b) => Number(pinnedFeedIds.includes(Number(b.id))) - Number(pinnedFeedIds.includes(Number(a.id)))).map(item => ({ kind: `custom-${item.id}` as FeedKind, label: `${item.name}${pinnedFeedIds.includes(Number(item.id)) ? ' · Đã ghim' : ''}`, icon: House })),
    ...publicFeeds.map(item => ({ kind: `public-${item.id}` as FeedKind, label: `${item.name} · @${item.creator?.username || 'cộng đồng'}`, icon: House })),
  ];
  const columnOptions: { kind: ColumnKind; label: string; icon: typeof House }[] = [
    { kind: 'search', label: 'Tìm kiếm', icon: MagnifyingGlass },
    { kind: 'activity', label: 'Hoạt động', icon: icons.activity },
    { kind: 'profile', label: 'Trang cá nhân', icon: icons.profile },
    { kind: 'insights', label: 'Thông tin chi tiết', icon: ChartLineUp },
    ...feedOptions.filter(option => option.kind !== 'activity' && option.kind !== 'profile'),
  ];
  const activeLabel = feed.startsWith('custom-') ? customFeeds.find(item => item.id === Number(feed.slice(7)))?.name || 'Bảng tin tùy chỉnh' : feed.startsWith('public-') ? publicFeeds.find(item => item.id === Number(feed.slice(7)))?.name || 'Bảng tin công khai' : labels[feed];

  return <main className="min-h-[calc(100dvh-4rem)] bg-canvas px-4 pb-20 pt-5 sm:px-6">
    <div className="mx-auto max-w-[1180px]">
      <div className={`grid items-start gap-8 ${multiColumn ? 'lg:grid-cols-[210px_minmax(0,1fr)]' : 'lg:grid-cols-[210px_minmax(0,640px)_260px]'} xl:gap-10`}>
        <aside className="sticky top-24 hidden space-y-6 lg:block">
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-[.18em] text-faint">Không gian của bạn</p>
            <nav aria-label="Bảng tin" className="mt-3 space-y-1">
              {feedOptions.map(option => {
                const Icon = option.icon;
                const active = option.kind === feed;
                return <button key={option.kind} onClick={() => selectFeed(option.kind)} aria-current={active ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-raised hover:text-ink'}`}><Icon size={19} weight={active ? 'fill' : 'regular'} />{option.label}</button>;
              })}
            </nav>
          </div>
          {user && <button onClick={() => setAddingFeed(value => !value)} className="flex items-center gap-2 px-3 text-sm font-semibold text-muted transition hover:text-accent"><Plus size={18} />Tạo bảng tin riêng</button>}
          <div className="border-t border-line pt-5">
            <Link href="/communities" className="flex items-center gap-2 px-3 text-sm font-semibold text-muted hover:text-ink"><UsersThree size={18} />Cộng đồng</Link>
            <Link href="/insights" className="mt-3 flex items-center gap-2 px-3 text-sm font-semibold text-muted hover:text-ink"><ChartLineUp size={18} />Thống kê tác giả</Link>
          </div>
        </aside>

        <section className={multiColumn ? 'hidden' : 'min-w-0'}>
          <header className="mb-4 flex items-center justify-between gap-3">
            <div><p className="text-xs font-semibold text-accent">BLOG PLATFORM</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{activeLabel}</h1></div>
            <div className="flex items-center gap-2"><button onClick={() => { setColumnFeeds([feed]); setColumnSearch({}); setMultiColumn(true); }} className="hidden rounded-full border border-line px-3 py-2 text-xs font-semibold text-muted hover:bg-raised lg:inline-flex">Nhiều cột</button>{user ? <Link href="/dashboard/posts/create" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-white transition hover:opacity-90"><Plus size={18} />Viết bài</Link> : <Link href="/login" className="rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white">Đăng nhập</Link>}</div>
          </header>

          <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 lg:hidden">
            {feedOptions.map(option => {
              const Icon = option.icon;
              return <button key={option.kind} onClick={() => selectFeed(option.kind)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${feed === option.kind ? 'border-accent bg-accent text-white' : 'border-line text-muted hover:bg-raised'}`}><Icon size={15} />{option.label}</button>;
            })}
            {user && <button onClick={() => setAddingFeed(value => !value)} aria-label="Tạo bảng tin riêng" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-dashed border-line text-muted"><Plus size={16} /></button>}
          </div>

          {addingFeed && <form onSubmit={createFeed} className="mb-4 space-y-3 rounded-2xl border border-line bg-surface p-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_150px_1fr_auto]"><input className="min-w-0 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent" placeholder="Tên bảng tin" value={feedName} onChange={event => setFeedName(event.target.value)} /><select className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none" value={feedFilterKind} onChange={event => { setFeedFilterKind(event.target.value as FeedFilterKind); setFeedFilterValue(''); }}><option value="category">Chuyên mục</option><option value="tag">Hashtag</option><option value="community">Cộng đồng</option><option value="author">Tác giả</option></select>
              {feedFilterKind === 'category' ? <select required className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none" value={feedFilterValue} onChange={event => setFeedFilterValue(event.target.value)}><option value="">Chọn chuyên mục</option>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
                : feedFilterKind === 'community' ? <select required className="rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none" value={feedFilterValue} onChange={event => setFeedFilterValue(event.target.value)}><option value="">Chọn cộng đồng</option>{communities.map(community => <option key={community.id} value={community.id}>{community.name}</option>)}</select>
                  : <input required className="min-w-0 rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none" placeholder={feedFilterKind === 'tag' ? '#hashtag' : '@tên_người_dùng'} value={feedFilterValue} onChange={event => setFeedFilterValue(event.target.value)} />}
              <button className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white">Tạo feed</button></div>
            <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={feedPublic} onChange={event => setFeedPublic(event.target.checked)} />Cho phép mọi người khám phá và chia sẻ feed này</label>
          </form>}

          {feed === 'discover' && <div className="relative mb-3"><MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm bài viết hoặc chủ đề" aria-label="Tìm bài viết" className="w-full rounded-2xl border border-line bg-surface px-10 py-3 text-sm text-ink outline-none transition focus:border-accent" /></div>}

          {user && <div className="mb-3"><button onClick={() => void toggleReaderControls()} className="text-xs font-semibold text-muted hover:text-accent">{showReaderControls ? 'Đóng tùy chỉnh nội dung' : 'Tùy chỉnh nội dung và tác giả'}</button>{showReaderControls && <div className="mt-2 rounded-2xl border border-line bg-surface p-3"><p className="mb-2 text-xs text-muted">Các lựa chọn này áp dụng cho bảng tin và có thể gỡ bất cứ lúc nào.</p>{readerControls.length ? <div className="divide-y divide-line">{readerControls.map(item => <div key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="text-ink">{readerControlLabels[item.type] || item.type}: {item.targetUser?.username || item.post?.title || item.category?.name || `#${item.target_user_id || item.post_id || item.category_id}`}</span><button onClick={() => void removeReaderControl(item.id)} className="shrink-0 text-xs font-semibold text-accent">Gỡ</button></div>)}</div> : <p className="text-sm text-muted">Chưa có tùy chọn ẩn hoặc chặn nào.</p>}</div>}</div>}

          {feed === 'discover' && tagFilter && <div className="mb-3 flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2"><span className="text-sm font-semibold text-accent">#{tagFilter}</span><button onClick={() => { setTagFilter(''); window.history.replaceState(null, '', '/posts'); }} className="text-xs font-semibold text-muted hover:text-ink">Xóa bộ lọc</button></div>}

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line px-1 pb-3"><span className="text-sm font-semibold text-ink">{feed === 'activity' ? 'Mới nhất' : 'Bài viết'}</span><div className="flex flex-wrap items-center gap-3">{user && !feed.startsWith('public-') && <button onClick={() => void saveFeedPreferences({ defaultFeed: feed })} className="text-xs font-semibold text-muted hover:text-accent">{defaultFeed === feed ? 'Feed mặc định' : 'Đặt làm mặc định'}</button>}{user && feed.startsWith('custom-') && (() => { const id = Number(feed.slice(7)); const pinned = pinnedFeedIds.includes(id); return <button onClick={() => void saveFeedPreferences({ pinnedFeedIds: pinned ? pinnedFeedIds.filter(item => item !== id) : [...pinnedFeedIds, id] })} className="text-xs font-semibold text-muted hover:text-accent">{pinned ? 'Bỏ ghim' : 'Ghim feed'}</button>; })()}{feed.startsWith('public-') && <button onClick={() => void shareCurrentFeed()} className="text-xs font-semibold text-accent">Chia sẻ feed</button>}<button onClick={() => void loadFeed()} className="text-xs font-semibold text-muted hover:text-accent">Làm mới</button></div></div>

          {loading ? <div className="divide-y divide-line" aria-label="Đang tải bài viết">{[0, 1, 2].map(item => <div key={item} className="animate-pulse py-5"><div className="flex gap-3"><div className="h-10 w-10 rounded-full bg-raised" /><div className="flex-1"><div className="h-3 w-32 rounded bg-raised" /><div className="mt-4 h-3 w-full rounded bg-raised" /><div className="mt-2 h-3 w-4/5 rounded bg-raised" /></div></div></div>)}</div>
            : feedError ? <div className="rounded-2xl border border-line p-8 text-center"><p className="text-sm text-muted">{feedError}</p><button onClick={() => void loadFeed()} className="mt-3 text-sm font-bold text-accent">Thử lại</button></div>
            : feed === 'activity' ? activities.length ? <div className="divide-y divide-line">{activities.map(activity => <article key={activity.id} className="py-4"><p className="text-sm font-semibold text-ink">{activity.data?.title || activity.data?.message || 'Thông báo mới'}</p><p className="mt-1 text-sm text-muted">{activity.data?.body || activity.data?.message || ''}</p><div className="mt-2 flex gap-4">{activity.data?.postId && <Link href={`/posts/${activity.data.postId}`} className="text-xs font-bold text-accent">Mở bài viết</Link>}{!activity.read_at && <button onClick={() => void api.patch(`/v1/notifications/${activity.id}/read`).then(() => setActivities(rows => rows.map(row => row.id === activity.id ? { ...row, read_at: new Date().toISOString() } : row)))} className="text-xs text-muted hover:text-ink">Đánh dấu đã đọc</button>}</div></article>)}</div> : <EmptyState title="Bạn đã cập nhật rồi" detail="Hoạt động mới sẽ xuất hiện tại đây." />
            : visiblePosts.length ? <div className="divide-y divide-line">{visiblePosts.map(post => <SocialPostCard key={`${feed}-${post.id}`} post={post} variant="feed" onReaderControl={() => void loadFeed()} />)}</div>
            : <EmptyState title={emptyTitle(feed, user)} detail={emptyDetail(feed, user)} action={feed === 'following' ? <Link href="/posts" onClick={() => selectFeed('discover')} className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-raised">Khám phá bài viết</Link> : undefined} />}
        </section>

        {multiColumn && <section className="min-w-0 lg:col-start-2">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-accent">BLOG PLATFORM</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">Bảng tin nhiều cột</h1></div><div className="flex items-center gap-2"><div className="relative"><button type="button" aria-label="Thêm cột" aria-expanded={addColumnOpen} onClick={() => { setAddColumnOpen(open => !open); setOtherFeedsOpen(false); }} disabled={columnFeeds.length >= 3} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold text-muted transition hover:bg-raised hover:text-ink disabled:opacity-40"><Plus size={18} />Thêm cột</button>{addColumnOpen && <div className="absolute right-0 top-12 z-30 w-60 rounded-2xl border border-line bg-surface p-2 shadow-2xl"><p className="px-3 py-2 text-xs font-medium text-faint">Thêm cột</p>{otherFeedsOpen ? <><button type="button" onClick={() => setOtherFeedsOpen(false)} className="w-full rounded-xl px-3 py-2 text-left text-xs text-muted hover:bg-raised">← Bảng feed khác</button>{feedOptions.map(option => { const Icon = option.icon; return <button key={option.kind} type="button" onClick={() => addColumn(option.kind)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-raised"><Icon size={18} />{option.label}</button>; })}</> : <>{columnOptions.filter(option => option.kind === 'search' || option.kind === 'activity' || option.kind === 'profile' || option.kind === 'insights').map(option => { const Icon = option.icon; return <button key={option.kind} type="button" onClick={() => addColumn(option.kind)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-raised"><Icon size={18} />{option.label}</button>; })}<button type="button" onClick={() => setOtherFeedsOpen(true)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-raised">Bảng feed khác <span aria-hidden>›</span></button></>}</div>}</div><button onClick={() => { setMultiColumn(false); setAddColumnOpen(false); }} className="rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-white">Đóng</button></div></header>
          <div className={`grid gap-4 ${columnFeeds.length > 1 ? 'xl:grid-cols-2 2xl:grid-cols-3' : 'max-w-[760px]'}`}>{columnFeeds.map((kind, index) => {
            const items = columnData[kind];
            const postsInColumn = items?.posts || [];
            const searchTerm = columnSearch[index]?.trim().toLowerCase() || '';
            const searchResults = postsInColumn.filter(post => `${post.title} ${post.content} ${post.tags?.map(tag => tag.name).join(' ') || ''}`.toLowerCase().includes(searchTerm));
            const tagCounts = new Map<string, number>();
            postsInColumn.forEach(post => post.tags?.forEach(tag => tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1)));
            const trendingTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
            const popularPosts = [...postsInColumn].sort((a, b) => Number(b.view_count ?? b.viewCount ?? 0) - Number(a.view_count ?? a.viewCount ?? 0)).slice(0, 5);
            const authors = [...new Map(postsInColumn.filter(post => post.author?.username || post.author?.userName || post.author_name || post.authorName).map(post => [post.author?.username || post.author?.userName || post.author_name || post.authorName || '', post])).values()].slice(0, 4);
            const totalViews = postsInColumn.reduce((sum, post) => sum + Number(post.view_count ?? post.viewCount ?? 0), 0);
            return <section key={`${kind}-${index}`} className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface">
              <header className="flex items-center gap-2 border-b border-line px-3 py-3">{kind === 'search' ? <><div className="relative min-w-0 flex-1"><MagnifyingGlass size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" /><input value={columnSearch[index] || ''} onChange={event => setColumnSearch(current => ({ ...current, [index]: event.target.value }))} placeholder="Tìm kiếm" aria-label={`Tìm kiếm trong cột ${index + 1}`} className="h-10 w-full rounded-full bg-raised pl-9 pr-3 text-sm text-ink outline-none placeholder:text-faint focus:ring-1 focus:ring-accent" /></div><button type="button" aria-label="Bộ lọc tìm kiếm" title="Tìm theo bài viết và hashtag" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-raised"><MagnifyingGlass size={17} /></button></> : <select aria-label={`Chọn feed cho cột ${index + 1}`} value={kind} onChange={event => { setColumnFeeds(current => current.map((item, position) => position === index ? event.target.value as ColumnKind : item)); setColumnSearch(current => ({ ...current, [index]: '' })); }} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none">{columnOptions.map(option => <option key={option.kind} value={option.kind}>{option.label}</option>)}</select>}<button aria-label="Làm mới cột" onClick={() => setColumnFeeds(current => [...current])} className="rounded-full px-2 py-1 text-xs text-muted hover:bg-raised">↻</button>{columnFeeds.length > 1 && <button aria-label="Đóng cột" onClick={() => { setColumnFeeds(current => current.filter((_, position) => position !== index)); setColumnSearch(current => { const next = { ...current }; delete next[index]; return next; }); }} className="rounded-full px-2 py-1 text-xs text-muted hover:bg-raised">×</button>}</header>
              <div className="max-h-[75vh] overflow-y-auto divide-y divide-line">
                {columnsLoading && !items ? <p className="p-5 text-sm text-muted">Đang tải…</p>
                  : kind === 'search' ? searchTerm ? searchResults.length ? searchResults.map(post => <Link href={`/posts/${post.id}`} key={post.id} className="block px-4 py-3 hover:bg-raised"><p className="line-clamp-2 text-sm font-semibold text-ink">{post.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted">{post.excerpt || post.content}</p></Link>) : <p className="p-5 text-sm text-muted">Không tìm thấy bài viết phù hợp.</p> : <div className="p-4"><div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-raised px-3 py-1.5 text-xs font-semibold text-muted">Khám phá</span><span className="text-xs text-faint">Đề xuất</span></div><h2 className="text-lg font-bold text-accent">Đang thịnh hành</h2><p className="mb-3 mt-1 text-xs text-faint">Chủ đề được quan tâm trong cộng đồng</p>{trendingTags.length ? <div className="divide-y divide-line">{trendingTags.map(([tag, count], rank) => <button key={tag} type="button" onClick={() => setColumnSearch(current => ({ ...current, [index]: tag }))} className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-raised"><span><span className="block text-xs text-muted">#{rank + 1} · Chủ đề</span><span className="mt-1 block text-sm font-bold text-ink">#{tag}</span></span><span className="text-xs text-faint">{count} bài viết</span></button>)}</div> : <div className="divide-y divide-line">{popularPosts.map((post, rank) => <Link key={post.id} href={`/posts/${post.id}`} className="block py-3 hover:bg-raised"><span className="text-xs text-muted">#{rank + 1} · Bài viết nổi bật</span><p className="mt-1 line-clamp-2 text-sm font-semibold text-ink">{post.title}</p><p className="mt-1 text-xs text-faint">{Number(post.view_count ?? post.viewCount ?? 0).toLocaleString('vi-VN')} lượt xem</p></Link>)}</div>}{authors.length > 0 && <div className="mt-5 border-t border-line pt-4"><h3 className="text-sm font-bold text-ink">Gợi ý theo dõi</h3><div className="mt-2 divide-y divide-line">{authors.map(post => { const username = post.author?.username || post.author?.userName || post.author_name || post.authorName || ''; const name = post.author?.userName || post.authorName || post.author_name || username; return <div key={username} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{name}</p><p className="truncate text-xs text-muted">@{username}</p></div><Link href={`/authors/${encodeURIComponent(username)}`} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-raised">Xem hồ sơ</Link></div>; })}</div></div>}</div>
                  : kind === 'insights' ? <div className="space-y-3 p-4"><h2 className="text-lg font-bold text-ink">Thông tin chi tiết</h2><p className="text-sm text-muted">Tổng quan nội dung đang có trong bảng tin.</p><div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-raised p-3"><p className="text-xs text-muted">Bài viết</p><p className="mt-1 text-xl font-bold text-ink">{postsInColumn.length}</p></div><div className="rounded-xl bg-raised p-3"><p className="text-xs text-muted">Lượt xem</p><p className="mt-1 text-xl font-bold text-ink">{totalViews.toLocaleString('vi-VN')}</p></div></div><Link href="/insights" className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-raised">Mở thống kê chi tiết</Link></div>
                  : kind === 'activity' ? items?.activities.length ? items.activities.map(activity => <article key={activity.id} className="p-4"><p className="text-sm font-semibold text-ink">{activity.data?.title || activity.data?.message || 'Thông báo mới'}</p><p className="mt-1 text-sm text-muted">{activity.data?.body || activity.data?.message || ''}</p></article>) : <p className="p-5 text-sm text-muted">Chưa có hoạt động.</p>
                  : items?.posts.length ? items.posts.map(post => <SocialPostCard key={post.id} post={post} variant="feed" onReaderControl={() => setColumnFeeds(current => [...current])} />) : <p className="p-5 text-sm text-muted">Chưa có bài viết trong cột này.</p>}
              </div>
            </section>;
          })}</div>
        </section>}

        <aside className={`sticky top-24 hidden space-y-5 xl:block ${multiColumn ? 'xl:hidden' : ''}`}>
          {!user && <section className="rounded-2xl border border-line bg-surface p-5"><h2 className="font-bold text-ink">Tham gia cuộc trò chuyện</h2><p className="mt-2 text-sm leading-6 text-muted">Theo dõi tác giả, lưu bài viết và chia sẻ góc nhìn của bạn.</p><Link href="/register" className="mt-4 inline-flex w-full justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white">Tạo tài khoản</Link></section>}
          <section className="rounded-2xl border border-line bg-surface p-4"><div className="flex items-center justify-between"><h2 className="font-bold text-ink">Cộng đồng</h2><Link href="/communities" className="text-xs font-semibold text-accent">Khám phá</Link></div><div className="mt-2 divide-y divide-line">{communities.slice(0, 5).map(community => <Link href={`/communities/${community.slug}`} key={community.id} className="block py-3"><p className="text-sm font-semibold text-ink">{community.name}</p><p className="mt-1 text-xs text-muted">{community.membersCount} thành viên · {community.topic || 'Chủ đề mở'}</p></Link>)}{communities.length === 0 && <p className="py-3 text-sm text-muted">Cộng đồng sẽ xuất hiện tại đây.</p>}</div></section>
          <p className="px-1 text-xs leading-5 text-faint">© 2026 Blog Platform · Không gian chia sẻ góc nhìn và câu chuyện.</p>
        </aside>
      </div>
    </div>
  </main>;
}

function emptyTitle(feed: FeedKind, user: unknown) {
  if (!user) return 'Đăng nhập để xem bảng tin';
  if (feed === 'following') return 'Bảng tin của bạn đang yên ắng';
  if (feed === 'saved') return 'Chưa có bài viết đã lưu';
  if (feed === 'liked') return 'Chưa có bài viết đã thích';
  if (feed === 'profile') return 'Bạn chưa đăng bài viết nào';
  if (feed.startsWith('custom-')) return 'Chưa có bài phù hợp với chủ đề';
  return 'Chưa có bài viết phù hợp';
}

function emptyDetail(feed: FeedKind, user: unknown) {
  if (!user) return 'Đăng nhập để theo dõi tác giả và cá nhân hóa bảng tin.';
  if (feed === 'following') return 'Khi bạn theo dõi tác giả, bài viết mới của họ sẽ xuất hiện ở đây.';
  if (feed === 'saved') return 'Nhấn biểu tượng lưu dưới bài viết để xem lại sau.';
  if (feed === 'liked') return 'Những bài viết bạn thích sẽ được tập hợp ở đây.';
  if (feed === 'profile') return 'Chia sẻ câu chuyện đầu tiên của bạn với cộng đồng.';
  return 'Hãy thử đổi bộ lọc hoặc quay lại sau nhé.';
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="px-5 py-16 text-center sm:py-20"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-raised text-muted"><House size={21} /></div><h2 className="mt-4 text-base font-bold text-ink">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{detail}</p>{action}</div>;
}
