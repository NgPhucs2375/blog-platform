'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Smiley, HashStraight, SlidersHorizontal, FloppyDisk, Eye, X, CircleNotch, UserCircle } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { postApi, type Category, type PostItem } from '@/services/postApi';
import api from '@/lib/axios';
import { isAxiosError } from 'axios';

export default function PostComposer({ postId, onClose, onSaved }: { postId?: string; onClose?: () => void; onSaved?: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [topicSuggestions, setTopicSuggestions] = useState<{ id: number; name: string; slug: string; posts_count: number }[]>([]);
  const [communities, setCommunities] = useState<{ id: number; name: string; isMember: boolean }[]>([]);
  const [communityId, setCommunityId] = useState('');
  const [topicQuery, setTopicQuery] = useState('');
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [topicInputFocused, setTopicInputFocused] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [cover, setCover] = useState('');
  const [media, setMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [threadContents, setThreadContents] = useState<string[]>([]);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollDuration, setPollDuration] = useState('7');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [replyPermission, setReplyPermission] = useState<'everyone' | 'followers' | 'none'>('everyone');
  const [quotePermission, setQuotePermission] = useState<'everyone' | 'followers' | 'none'>('everyone');
  const [replyApproval, setReplyApproval] = useState(false);
  const [tags, setTags] = useState('');
  const [options, setOptions] = useState(false);
  const [preview, setPreview] = useState(false);
  const [emoji, setEmoji] = useState(false);
  const [hashtagPanel, setHashtagPanel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<PostItem | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const contentInput = useRef<HTMLTextAreaElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const baseline = useRef(JSON.stringify(['', '', '', '', '', '', '', []]));
  const dirty = ready && JSON.stringify([title, content, category, excerpt, cover, tags, communityId, threadContents]) !== baseline.current;

  function toggleTopic(name: string) {
    const normalized = name.replace(/^#/, '').trim();
    const selected = tags.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean);
    setTags(selected.some(tag => tag.toLowerCase() === normalized.toLowerCase())
      ? selected.filter(tag => tag.toLowerCase() !== normalized.toLowerCase()).join(', ')
      : [...selected, normalized].join(', '));
  }

  function selectTopic(name: string) {
    const normalized = name.replace(/^#/, '').trim().toLowerCase();
    const selected = tags.split(',').map(tag => tag.trim().replace(/^#/, '').toLowerCase()).filter(Boolean);
    if (!selected.includes(normalized)) toggleTopic(name);
  }

  function addTypedTopic() {
    const value = topicQuery.trim().replace(/^#/, '');
    if (!value) return;
    selectTopic(value);
    setTopicQuery(`#${value}`);
    setTopicPickerOpen(false);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [cats, post, groups, topics] = await Promise.all([
          postId ? postApi.getCategoriesForAdmin() : Promise.resolve([]),
          postId ? postApi.getManagePostById(postId) : Promise.resolve(null),
          postApi.getCommunities(),
          postApi.getPopularTags(8).catch(() => []),
        ]);
        if (!active) return;
        setCategories(cats);
        setTopicSuggestions(topics);
        setCommunities(groups.filter((community: any) => community.isMember));
        if (postId && !post) throw new Error('Không tìm thấy bài viết hoặc bạn không có quyền sửa.');
        if (post) {
          baseline.current = JSON.stringify([post.title, post.content, String(post.categoryId || post.category_id), post.excerpt || '', post.coverImage || post.cover_image || '', post.tags?.map(t => t.name).join(', ') || '', String(post.community?.id || ''), []]);
          setTitle(post.title); setContent(post.content); setCategory(String(post.categoryId || post.category_id));
          setCover(post.coverImage || post.cover_image || ''); setExcerpt(post.excerpt || ''); setTags(post.tags?.map(t => t.name).join(', ') || '');
          setMedia(post.media || []);
          setPollEnabled(!!post.poll);
          setPollOptions(post.poll?.options?.length ? post.poll.options : ['', '']);
          setReplyPermission(post.replyPermission || 'everyone');
          setQuotePermission(post.quotePermission || 'everyone');
          setReplyApproval(!!post.replyApproval);
          setCommunityId(String(post.community?.id || ''));
        }
        setReady(true);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Không tải được chuyên mục. Hãy tải lại trang.'); }
    }
    void load();
    return () => { active = false; };
  }, [postId]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => { if (dirty && !saved) e.preventDefault(); };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty, saved]);
  const close = () => {
    if (busy || uploading) return;
    if (!saved && dirty && !window.confirm('Bỏ những thay đổi chưa lưu?')) return;
    if (onClose) onClose(); else router.push('/posts?feed=profile');
  };
  useEffect(() => {
    if (!onClose) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]):not([type="file"]), select:not([disabled]), textarea:not([disabled]), a[href]');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', trap); previous?.focus(); };
  }, [onClose]);
  async function upload(file?: File) {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'].includes(file.type) || file.size > (isVideo ? 20 : 5) * 1024 * 1024) { setError('Chọn ảnh tối đa 5 MB hoặc video MP4/WebM tối đa 20 MB.'); return; }
    setUploading(true); setError('');
    try {
      const body = new FormData(); body.append('media', file);
      const res = await api.post('/v1/media', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMedia(current => [...current, { url: res.data.data.url, type: isVideo ? 'video' : 'image' }]);
    } catch { setError('Tải ảnh thất bại. Hãy thử lại.'); }
    finally { setUploading(false); if (fileInput.current) fileInput.current.value = ''; }
  }
  async function save(status: 'draft' | 'published') {
    if (busy || uploading || !ready) return;
    if (!content.trim()) { setError('Nhập nội dung trước khi lưu bài viết.'); return; }
    if (pollEnabled && (pollOptions.filter(option => option.trim()).length < 2)) { setError('Thêm ít nhất hai lựa chọn cho bình chọn.'); return; }
    setBusy(true); setError('');
    try {
      const firstTitle = title.trim() || content.trim().replace(/\s+/g, ' ').slice(0, 80);
      const pollEndsAt = pollEnabled && pollDuration !== 'never' ? new Date(Date.now() + Number(pollDuration) * 86400000).toISOString() : undefined;
      const textHashtags = [...`${title}\n${content}\n${threadContents.join('\n')}`.matchAll(/#([\p{L}\p{N}_]+)/gu)].map(match => match[1]);
      const postTags = [...new Set([...tags.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean), ...textHashtags])];
      const payload = { title: firstTitle, content: content.trim(), categoryId: category ? Number(category) : undefined, excerpt, coverImage: cover, media, pollOptions: pollEnabled ? pollOptions.map(option => option.trim()).filter(Boolean) : postId ? null : undefined, pollEndsAt, replyPermission, quotePermission, replyApproval, communityId: communityId ? Number(communityId) : undefined, tags: postTags, status };
      const threadItems = [{ content: content.trim(), media }, ...threadContents.filter(item => item.trim()).map(item => ({ content: item.trim() }))];
      const result = postId ? await postApi.updatePost(postId, payload) : threadItems.length > 1 ? (await postApi.createThread({ categoryId: category ? Number(category) : undefined, communityId: communityId ? Number(communityId) : undefined, tags: postTags, items: threadItems })).posts[0] : await postApi.createPost(payload);
      setSaved(result); onSaved?.();
    } catch (e) {
      const data = isAxiosError(e) ? e.response?.data : null;
      setError(data?.errors ? String(Object.values(data.errors).flat()[0]) : data?.message || 'Không lưu được bài viết. Hãy thử lại.');
    } finally { setBusy(false); }
  }
  const field = 'w-full rounded-xl border border-white/15 bg-[#202020] px-3 py-2.5 text-sm text-white outline-none focus:border-white/50';
  function insertEmoji(symbol: string) {
    const input = contentInput.current;
    const start = input?.selectionStart ?? content.length;
    const end = input?.selectionEnd ?? content.length;
    const next = `${content.slice(0, start)}${symbol}${content.slice(end)}`;
    setContent(next);
    setEmoji(false);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  }
  return <div className={onClose ? 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm' : 'min-h-[75dvh] bg-[#0a0a0a] px-3 py-10 sm:py-16'}>
    <div ref={panel} tabIndex={-1} role={onClose ? 'dialog' : undefined} aria-modal={onClose ? true : undefined} aria-labelledby="composer-heading" onKeyDown={e => { if (e.key === 'Escape') close(); }} className="scrollbar-hidden mx-auto max-h-[90dvh] w-full max-w-[740px] overflow-y-auto rounded-[26px] border border-[#363636] bg-[#181818] text-[#f3f3f3] shadow-2xl outline-none">
      <header className="flex items-center justify-between border-b border-[#333] px-5 py-5 sm:px-7">
        <button type="button" onClick={close} disabled={busy || uploading} className="text-base disabled:opacity-40">{saved ? 'Đóng' : 'Hủy'}</button>
        <h1 id="composer-heading" className="text-lg font-bold">{postId ? 'Sửa bài viết' : 'Bài viết mới'}</h1>
        <button type="button" aria-label={preview ? 'Tiếp tục soạn' : 'Xem trước'} disabled={!!saved} onClick={() => setPreview(!preview)} className="rounded-lg p-2 hover:bg-white/10"><Eye size={23} /></button>
      </header>
      {saved ? <section className="space-y-5 px-7 py-12 text-center" role="status"><h2 className="text-xl font-bold">{saved.status.toLowerCase() === 'pending' ? 'Bài viết cần được kiểm tra' : saved.status.toLowerCase() === 'draft' ? 'Đã lưu bản nháp' : 'Đã đăng bài viết'}</h2><p className="text-sm text-[#aaa]">{saved.status.toLowerCase() === 'pending' ? 'Bài viết có từ ngữ khớp với quy tắc kiểm duyệt nên đang chờ quản trị viên xem.' : saved.status.toLowerCase() === 'draft' ? 'Bạn có thể tiếp tục chỉnh sửa bản nháp trong mục bài viết của bạn.' : 'Bài viết bình thường đã được đăng và hiển thị cho mọi người.'}</p><button onClick={() => { if (onClose) onClose(); else router.push('/posts?feed=profile'); }} className="rounded-xl bg-white px-5 py-3 font-semibold text-black">Về bài viết của tôi</button></section> : <>
        {error && <p role="alert" className="mx-6 mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <div className="flex gap-3 px-5 pb-3 pt-6 sm:gap-4 sm:px-7">
          <div className="flex w-11 shrink-0 flex-col items-center gap-3">{user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" /> : <UserCircle size={44} weight="fill" className="text-[#a3a3a3]" />}<span className="w-px flex-1 bg-[#383838]" /></div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{user?.userName}</strong>{postId && <><span className="text-[#666]">›</span><select aria-label="Chuyên mục cũ" value={category} onChange={e => setCategory(e.target.value)} disabled={!ready || busy} className="max-w-full rounded bg-[#181818] text-sm text-[#aaa] outline-none"><option value="">Không thuộc chuyên mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></>}{!postId && <><span className="text-[#666]">›</span><div className="relative min-w-[190px] flex-1 sm:max-w-[300px]"><input role="combobox" aria-label="Cộng đồng hoặc chủ đề" aria-expanded={topicPickerOpen} aria-controls="topic-community-options" value={topicInputFocused ? topicQuery : communityId ? communities.find(item => String(item.id) === communityId)?.name || '' : topicQuery} onFocus={() => { setTopicInputFocused(true); setTopicQuery(''); setTopicPickerOpen(true); }} onBlur={() => window.setTimeout(() => { setTopicPickerOpen(false); setTopicInputFocused(false); }, 100)} onChange={event => { setCommunityId(''); setTopicQuery(event.target.value); setTopicPickerOpen(true); }} onKeyDown={event => { if (event.key === 'Enter' && topicQuery.trim()) { event.preventDefault(); addTypedTopic(); setTopicInputFocused(false); } else if (event.key === 'Escape') setTopicPickerOpen(false); }} placeholder="Cộng đồng hoặc chủ đề" className="w-full border-0 border-b border-transparent bg-transparent py-1 text-sm text-[#ccc] outline-none placeholder:text-[#777] focus:border-white/20" />{topicPickerOpen && <div id="topic-community-options" role="listbox" className="absolute left-0 top-full z-30 mt-2 max-h-64 w-[min(320px,85vw)] overflow-y-auto rounded-xl border border-white/10 bg-[#202020] p-2 shadow-2xl">{communities.filter(item => item.name.toLowerCase().includes(topicQuery.toLowerCase())).map(item => <button key={`community-${item.id}`} type="button" role="option" aria-selected={communityId === String(item.id)} onMouseDown={event => event.preventDefault()} onClick={() => { setCommunityId(String(item.id)); setTopicQuery(''); setTopicPickerOpen(false); setTopicInputFocused(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">{item.name}<span className="ml-2 text-xs text-[#777]">Cộng đồng</span></button>)}{topicSuggestions.filter(item => item.name.toLowerCase().includes(topicQuery.toLowerCase().replace(/^#/, ''))).map(item => <button key={`topic-${item.id}`} type="button" role="option" aria-selected={tags.split(',').some(tag => tag.trim().replace(/^#/, '').toLowerCase() === item.name.toLowerCase())} onMouseDown={event => event.preventDefault()} onClick={() => { selectTopic(item.name); setTopicQuery(`#${item.name}`); setTopicPickerOpen(false); setTopicInputFocused(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10">#{item.name}<span className="ml-2 text-xs text-[#777]">Chủ đề phổ biến</span></button>)}{topicQuery.trim() && !topicSuggestions.some(item => item.name.toLowerCase() === topicQuery.trim().replace(/^#/, '').toLowerCase()) && <button type="button" role="option" onMouseDown={event => event.preventDefault()} onClick={() => { addTypedTopic(); setTopicInputFocused(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#5eead4] hover:bg-white/10">Thêm chủ đề “{topicQuery.trim().replace(/^#/, '')}”</button>}{!communities.length && !topicSuggestions.length && !topicQuery.trim() && <p className="px-3 py-2 text-xs text-[#888]">Gõ để tìm hoặc tạo chủ đề mới</p>}</div>}</div>{communityId && <button type="button" aria-label="Bỏ chọn cộng đồng" onClick={() => setCommunityId('')} className="text-xs text-[#888] hover:text-white">×</button>}</>}</div>
            {preview ? <article className="space-y-4"><h2 className="text-xl font-semibold">{title || 'Tiêu đề bài viết'}</h2><p className="whitespace-pre-wrap break-words leading-7 text-[#ccc]">{content || 'Nội dung sẽ hiển thị ở đây.'}</p></article> : <>
              {postId && <input aria-label="Tiêu đề bài viết (không bắt buộc)" maxLength={500} value={title} disabled={busy} onChange={e => setTitle(e.target.value)} placeholder="Tiêu đề (không bắt buộc)" className="w-full border-0 bg-transparent py-1 text-lg font-semibold outline-none placeholder:text-[#777]" />}
              <textarea ref={contentInput} aria-label="Nội dung bài viết" value={content} disabled={busy} onChange={e => setContent(e.target.value)} placeholder="Bạn có điều gì muốn chia sẻ?" className="min-h-32 w-full resize-y border-0 bg-transparent text-base leading-7 outline-none placeholder:text-[#777]" />
              {threadContents.map((item, index) => <div key={index} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><div className="mb-2 flex items-center justify-between text-xs text-[#888]"><span>Bài tiếp theo · {index + 2}</span><button type="button" aria-label={`Xóa bài thứ ${index + 2} trong chuỗi`} onClick={() => setThreadContents(rows => rows.filter((_, itemIndex) => itemIndex !== index))} className="rounded-md p-1 hover:bg-white/10 hover:text-white"><X size={16} /></button></div><textarea aria-label={`Nội dung bài thứ ${index + 2} trong chuỗi`} value={item} disabled={busy} onChange={event => setThreadContents(rows => rows.map((row, itemIndex) => itemIndex === index ? event.target.value : row))} placeholder="Tiếp tục chuỗi bài viết…" className="min-h-24 w-full resize-y bg-transparent text-base leading-7 outline-none placeholder:text-[#777]" /></div>)}
              {!postId && threadContents.length > 0 && threadContents.length < 9 && <button type="button" onClick={() => setThreadContents(rows => [...rows, ''])} className="rounded-lg border border-dashed border-white/15 px-3 py-2 text-sm text-[#aaa] hover:border-white/30 hover:text-white">＋ Thêm bài vào chuỗi</button>}
            </>}
            {cover && <div className="relative"><img src={cover} alt="Ảnh bìa bài viết" className="max-h-72 w-full rounded-2xl object-cover" />{!preview && <button aria-label="Xóa ảnh bìa" disabled={busy || uploading} onClick={() => setCover('')} className="absolute right-2 top-2 rounded-full bg-black/70 p-2"><X /></button>}</div>}
            {!preview && <div className="flex items-center gap-2 text-[#999]">
              <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" className="hidden" onChange={e => { for (const file of Array.from(e.target.files || [])) void upload(file); }} />
              <button title="Thêm ảnh hoặc video" aria-label="Thêm ảnh hoặc video" disabled={uploading || busy} onClick={() => fileInput.current?.click()} className="rounded-lg p-1.5 hover:bg-white/10">{uploading ? <CircleNotch size={25} className="animate-spin" /> : <ImageIcon size={25} />}</button>
              {!postId && <button type="button" title="Thêm bài vào chuỗi" aria-label="Thêm bài vào chuỗi" onClick={() => setThreadContents(rows => rows.length ? [] : [''])} className="rounded-lg p-1.5 hover:bg-white/10">＋</button>}
              {!postId && <button type="button" title="Tạo bình chọn" aria-label="Tạo bình chọn" aria-pressed={pollEnabled} onClick={() => setPollEnabled(!pollEnabled)} className="rounded-lg p-1.5 text-sm hover:bg-white/10">☷</button>}
              <button title="Chèn biểu tượng cảm xúc" aria-label="Chèn biểu tượng cảm xúc" aria-pressed={emoji} onClick={() => setEmoji(!emoji)} className="rounded-lg p-1.5 hover:bg-white/10"><Smiley size={22} /></button>
              <button type="button" title="Thêm chủ đề hoặc hashtag" aria-label="Thêm chủ đề hoặc hashtag" aria-pressed={hashtagPanel} onClick={() => setHashtagPanel(value => !value)} className={`rounded-lg p-1.5 hover:bg-white/10 ${hashtagPanel ? 'text-white' : ''}`}><HashStraight size={22} /></button>
              <span className="ml-auto text-xs">{uploading ? 'Đang tải…' : media.length ? `${media.length}/10` : ''}</span>
            </div>}
            {media.length > 0 && <div className="grid grid-cols-2 gap-2">{media.map((item, index) => <div key={item.url} className="relative overflow-hidden rounded-xl border border-white/10">{item.type === 'video' ? <video src={item.url} controls className="max-h-56 w-full" /> : <img src={item.url} alt="Tệp đính kèm" className="max-h-56 w-full object-cover" />}<button type="button" aria-label="Xóa tệp" onClick={() => setMedia(items => items.filter((_, i) => i !== index))} className="absolute right-2 top-2 rounded-full bg-black/70 p-1"><X size={18} /></button></div>)}</div>}
            {pollEnabled && <div className="space-y-2 rounded-xl border border-white/10 p-3">{pollOptions.map((option, index) => <div key={index} className="flex gap-2"><input aria-label={`Lựa chọn ${index + 1}`} className={`${field} flex-1`} maxLength={100} value={option} onChange={e => setPollOptions(rows => rows.map((row, i) => i === index ? e.target.value : row))} placeholder={`Lựa chọn ${index + 1}`} />{index > 1 && <button type="button" aria-label="Xóa lựa chọn" onClick={() => setPollOptions(rows => rows.filter((_, i) => i !== index))}><X /></button>}</div>)}{pollOptions.length < 4 && <button type="button" onClick={() => setPollOptions(rows => [...rows, ''])} className="text-sm text-[#aaa]">＋ Thêm lựa chọn</button>}<label className="block text-xs text-[#aaa]">Thời hạn<select aria-label="Thời hạn bình chọn" value={pollDuration} onChange={e => setPollDuration(e.target.value)} className={`${field} mt-1`}><option value="1">1 ngày</option><option value="3">3 ngày</option><option value="7">7 ngày</option><option value="never">Không thời hạn</option></select></label></div>}
            {emoji && <div className="grid grid-cols-8 gap-1 rounded-2xl border border-white/10 bg-white/[.03] p-2">{['😊','😂','🥹','😍','😎','🤔','🙌','👏','❤️','💚','🔥','✨','🎉','💡','🌿','☕','📚','💻','🎨','🚀','🐱','🌸','🌈','👍'].map(symbol => <button key={symbol} type="button" aria-label={`Chèn ${symbol}`} disabled={busy} onClick={() => insertEmoji(symbol)} className="rounded-lg p-2 text-xl transition hover:bg-white/10">{symbol}</button>)}</div>}
            {hashtagPanel && <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[.03] p-3">{!postId && topicSuggestions.length > 0 && <div><p className="mb-2 text-xs text-[#888]">Chủ đề gợi ý</p><div className="flex flex-wrap gap-2">{topicSuggestions.map(topic => { const selected = tags.split(',').some(tag => tag.trim().replace(/^#/, '').toLowerCase() === topic.name.toLowerCase()); return <button key={topic.id} type="button" onClick={() => toggleTopic(topic.name)} aria-pressed={selected} className={`rounded-full border px-2.5 py-1 text-xs transition ${selected ? 'border-[#2cc7b4]/50 bg-[#2cc7b4]/15 text-[#5eead4]' : 'border-white/10 text-[#aaa] hover:border-white/25 hover:text-white'}`}>#{topic.name}</button>; })}</div></div>}<label className="block text-xs text-[#aaa]">Chủ đề hoặc hashtag, cách nhau bằng dấu phẩy<input className={`${field} mt-2`} value={tags} disabled={busy} onChange={event => setTags(event.target.value)} placeholder="#Công nghệ, #Đời sống" /></label><span className="block text-xs text-[#777]">Hashtag viết trong nội dung cũng được tự nhận diện.</span></div>}
          </div>
        </div>
        {options && <div className="mx-6 my-4 space-y-3 rounded-2xl border border-white/10 p-4"><label className="block text-xs text-[#aaa]">Tóm tắt<input className={`${field} mt-2`} value={excerpt} maxLength={2000} disabled={busy} onChange={e => setExcerpt(e.target.value)} placeholder="Mô tả ngắn cho người đọc" /></label><label className="block text-xs text-[#aaa]">Ai có thể trả lời?<select className={`${field} mt-2`} value={replyPermission} onChange={e => setReplyPermission(e.target.value as typeof replyPermission)}><option value="everyone">Mọi người</option><option value="followers">Người theo dõi tôi</option><option value="none">Không ai</option></select></label><label className="block text-xs text-[#aaa]">Ai có thể trích dẫn?<select className={`${field} mt-2`} value={quotePermission} onChange={e => setQuotePermission(e.target.value as typeof quotePermission)}><option value="everyone">Mọi người</option><option value="followers">Người theo dõi tôi</option><option value="none">Không ai</option></select></label><label className="flex items-center gap-2 text-sm text-[#ccc]"><input type="checkbox" checked={replyApproval} onChange={e => setReplyApproval(e.target.checked)} />Duyệt phản hồi trước khi hiển thị</label></div>}
        <footer className="flex items-center justify-between gap-3 border-t border-white/[.06] px-5 py-4 sm:px-7"><div className="flex gap-1"><button type="button" title={options ? 'Ẩn tùy chọn bài viết' : 'Tùy chọn bài viết'} aria-label="Tùy chọn bài viết" aria-expanded={options} onClick={() => setOptions(!options)} className={`rounded-lg p-2 text-[#999] hover:bg-white/5 ${options ? 'text-white' : ''}`}><SlidersHorizontal size={20} /></button><button type="button" title="Lưu nháp" aria-label="Lưu nháp" disabled={busy || uploading || !ready} onClick={() => void save('draft')} className="rounded-lg p-2 text-[#999] hover:bg-white/5 disabled:opacity-30"><FloppyDisk size={19} /></button></div><button disabled={busy || uploading || !ready || !content.trim()} onClick={() => void save('published')} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition hover:bg-white/90 disabled:bg-white/10 disabled:text-[#777]">{busy ? 'Đang đăng…' : postId ? 'Cập nhật' : 'Đăng'}</button></footer>
      </>}
    </div>
  </div>;
}
