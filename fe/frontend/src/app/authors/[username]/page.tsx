'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { ArrowSquareOut, ChartLineUp, ChatCircleText, ImageSquare, InstagramLogo, LinkSimple, MicrophoneStage, PencilSimple, Repeat, UserCircle, UserPlus, UserCheck, X } from '@phosphor-icons/react';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/services/profileApi';
import SocialPostCard from '@/components/SocialPostCard';
import type { PostItem } from '@/services/postApi';
import AuthorHoverCard from '@/components/AuthorHoverCard';

type Tab = 'threads' | 'replies' | 'media' | 'reposts';
type Author = { id: number; username: string; displayName?: string; bio?: string | null; avatarUrl?: string | null; interests?: string[]; profileLink?: string | null; podcastUrl?: string | null; instagramUrl?: string | null; showInstagram?: boolean; showViews?: boolean; followersCount: number; followingCount: number; postsCount: number; viewsCount: number; isFollowing: boolean };
type ProfileDraft = { displayName: string; userName: string; bio: string; interests: string; profileLink: string; podcastUrl: string; instagramUrl: string; showInstagram: boolean; showViews: boolean; avatarUrl: string };
type Reply = { id: number; content: string; createdAt?: string; post?: { id: number; slug: string; title: string; authorName?: string } | null };
const tabs: { id: Tab; label: string; icon: typeof ChatCircleText }[] = [
  { id: 'threads', label: 'Cuộc trò chuyện', icon: ChatCircleText },
  { id: 'replies', label: 'Câu trả lời', icon: ChatCircleText },
  { id: 'media', label: 'File phương tiện', icon: ImageSquare },
  { id: 'reposts', label: 'Bài đăng lại', icon: Repeat },
];

export default function PublicAuthorPage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>('threads');
  const [author, setAuthor] = useState<Author | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

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

  function openProfileEditor() {
    if (!author) return;
    setProfileError('');
    setProfileDraft({
      displayName: author.displayName || author.username,
      userName: author.username,
      bio: author.bio || '',
      interests: (author.interests || []).join(', '),
      profileLink: author.profileLink || '',
      podcastUrl: author.podcastUrl || '',
      instagramUrl: author.instagramUrl || '',
      showInstagram: !!author.showInstagram,
      showViews: !!author.showViews,
      avatarUrl: author.avatarUrl || '',
    });
    setEditOpen(true);
  }

  async function uploadAvatar(file?: File) {
    if (!file || !profileDraft) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setProfileError('Ảnh hồ sơ phải là tệp hình ảnh và không quá 5 MB.');
      return;
    }
    setUploadingAvatar(true);
    setProfileError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await api.post('/v1/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfileDraft({ ...profileDraft, avatarUrl: data.data.url });
    } catch {
      setProfileError('Không tải được ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInput.current) avatarInput.current.value = '';
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileDraft || savingProfile) return;
    setSavingProfile(true);
    setProfileError('');
    try {
      const updatedUser = await profileApi.updateProfile({
        userName: profileDraft.userName.trim(),
        displayName: profileDraft.displayName.trim(),
        bio: profileDraft.bio.trim() || null,
        avatarUrl: profileDraft.avatarUrl || null,
        interests: profileDraft.interests.split(',').map(item => item.trim()).filter(Boolean),
        profileLink: profileDraft.profileLink.trim() || null,
        podcastUrl: profileDraft.podcastUrl.trim() || null,
        instagramUrl: profileDraft.instagramUrl.trim() || null,
        showInstagram: profileDraft.showInstagram,
        showViews: profileDraft.showViews,
      });
      updateUser(updatedUser);
      setAuthor({ ...author!, username: updatedUser.userName, displayName: updatedUser.displayName || updatedUser.userName, bio: updatedUser.bio, avatarUrl: updatedUser.avatarUrl, interests: updatedUser.interests || [], profileLink: updatedUser.profileLink, podcastUrl: updatedUser.podcastUrl, instagramUrl: updatedUser.instagramUrl, showInstagram: updatedUser.showInstagram, showViews: updatedUser.showViews });
      setEditOpen(false);
      if (updatedUser.userName !== username) router.replace(`/authors/${encodeURIComponent(updatedUser.userName)}`);
    } catch (error) {
      const response = isAxiosError(error) ? error.response?.data : null;
      const validationMessage = response?.errors ? Object.values(response.errors).flat().find((message): message is string => typeof message === 'string') : null;
      setProfileError(validationMessage || response?.message || 'Không lưu được hồ sơ. Vui lòng thử lại.');
    } finally {
      setSavingProfile(false);
    }
  }

  function updateDraft<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setProfileDraft(current => current ? { ...current, [key]: value } : current);
  }

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
    <div className="mx-auto max-w-[760px] px-0 pb-20 pt-0 sm:px-4 sm:pt-5">
      <div className="overflow-hidden border-y border-line bg-surface sm:rounded-[28px] sm:border">
      <section className="px-5 pb-5 pt-7 sm:px-8 sm:pt-8">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Trang cá nhân</p>
            <h1 className="mt-2 truncate text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{author.displayName || author.username}</h1>
            <p className="mt-1 text-sm text-muted">@{author.username}</p>
          </div>
          {author.avatarUrl ? <img src={author.avatarUrl} alt={`${author.username} avatar`} className="h-20 w-20 shrink-0 rounded-full border border-line object-cover sm:h-24 sm:w-24" /> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-raised text-muted sm:h-24 sm:w-24"><UserCircle size={56} weight="fill" /></div>}
        </div>
        {author.bio && <p className="mt-5 max-w-[58ch] whitespace-pre-line text-sm leading-relaxed">{author.bio}</p>}
        {author.interests?.length ? <div className="mt-3 flex flex-wrap gap-2">{author.interests.map(interest => <span key={interest} className="rounded-full border border-line bg-raised px-3 py-1 text-xs font-medium text-muted">{interest}</span>)}</div> : null}
        {(author.profileLink || author.podcastUrl || (author.showInstagram && author.instagramUrl)) && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
          {author.profileLink && <a href={author.profileLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-ink hover:underline"><LinkSimple size={16} />Liên kết<ArrowSquareOut size={13} /></a>}
          {author.podcastUrl && <a href={author.podcastUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-ink hover:underline"><MicrophoneStage size={16} />Podcast<ArrowSquareOut size={13} /></a>}
          {author.showInstagram && author.instagramUrl && <a href={author.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" className="inline-flex items-center gap-1.5 text-ink hover:underline"><InstagramLogo size={18} />Instagram</a>}
        </div>}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          <span><strong className="font-bold text-ink">{author.followersCount.toLocaleString('vi-VN')}</strong> người theo dõi</span>
          <span><strong className="font-bold text-ink">{author.followingCount.toLocaleString('vi-VN')}</strong> đang theo dõi</span>
          <span><strong className="font-bold text-ink">{author.postsCount.toLocaleString('vi-VN')}</strong> bài viết</span>
          {author.showViews && <span><strong className="font-bold text-ink">{author.viewsCount.toLocaleString('vi-VN')}</strong> lượt xem</span>}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {!ownProfile ? <button onClick={() => void toggleFollow()} disabled={busy} aria-pressed={author.isFollowing} className={`inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition disabled:opacity-60 ${author.isFollowing ? 'border border-line bg-transparent text-ink hover:bg-raised' : 'bg-ink text-canvas hover:opacity-90'}`}>
            {author.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}{author.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
          </button> : <button type="button" onClick={openProfileEditor} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line text-sm font-bold hover:bg-raised"><PencilSimple size={18} /> Chỉnh sửa trang cá nhân</button>}
          {ownProfile && <Link href="/insights" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line text-sm font-bold hover:bg-raised"><ChartLineUp size={18} /> Xem thông tin chi tiết</Link>}
        </div>
        {notice && <p role="status" className="mt-3 text-xs text-accent">{notice}</p>}
      </section>

      <nav aria-label="Nội dung trang cá nhân" className="sticky top-0 z-20 grid grid-cols-4 border-y border-line bg-surface/95 backdrop-blur">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={`relative flex min-h-14 items-center justify-center gap-2 px-1 text-[11px] font-semibold transition sm:px-2 sm:text-sm ${tab === id ? 'text-ink' : 'text-muted hover:text-ink'}`}><Icon size={18} className="hidden sm:block" /><span>{label}</span>{tab === id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" />}</button>)}
      </nav>

      {ownProfile && tab === 'threads' && <Link href="/dashboard/posts/create" className="flex items-center gap-3 border-b border-line px-5 py-4 transition hover:bg-raised/60 sm:px-7">
        {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <UserCircle size={40} weight="fill" className="shrink-0 text-muted" />}
        <span className="flex-1 rounded-full bg-raised px-4 py-3 text-sm text-muted">Có gì mới?</span>
        <span className="rounded-full border border-line px-5 py-2 text-sm font-bold text-ink">Đăng</span>
      </Link>}

      {loading ? <div className="space-y-3 p-4">{[0, 1, 2].map(index => <div key={index} className="h-48 animate-pulse rounded-3xl bg-raised" />)}</div> : tab === 'replies' ? (
        <div className="divide-y divide-line">{replies.map(reply => <article key={reply.id} className="px-5 py-4 sm:px-6"><div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-raised"><ChatCircleText size={18} className="text-muted" /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold"><AuthorHoverCard username={author.username} name={author.username}><Link href={`/authors/${encodeURIComponent(author.username)}`} className="hover:underline">{author.username}</Link></AuthorHoverCard><span className="ml-2 font-normal text-muted">đã phản hồi</span></p><p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{reply.content}</p>{reply.post && <div className="mt-3 rounded-2xl border border-line p-3 text-sm hover:bg-raised">{reply.post.authorName && <p className="text-xs text-muted"><AuthorHoverCard username={reply.post.authorName} name={reply.post.authorName}><Link href={`/authors/${encodeURIComponent(reply.post.authorName)}`} className="hover:underline">{reply.post.authorName}</Link></AuthorHoverCard></p>}<Link href={`/posts/${reply.post.slug || reply.post.id}`} className="mt-1 block font-semibold">{reply.post.title}</Link></div>}</div></div></article>)}{!replies.length && <EmptyState text="Chưa có phản hồi nào." />}</div>
      ) : <div className="divide-y divide-line">{posts.map(post => <SocialPostCard key={post.id} post={post} variant="feed" />)}{!posts.length && <EmptyState text={tab === 'media' ? 'Chưa có bài viết kèm hình ảnh.' : tab === 'reposts' ? 'Chưa có bài viết được đăng lại.' : 'Chưa có bài viết nào.'} />}</div>}
      </div>
    </div>
    {editOpen && profileDraft && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-3 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setEditOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="profile-editor-title" className="scrollbar-hidden max-h-[92dvh] w-full max-w-[620px] overflow-y-auto rounded-[28px] border border-line bg-surface text-ink shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-5 py-4 backdrop-blur sm:px-7">
          <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted">Tùy chỉnh</p><h2 id="profile-editor-title" className="mt-1 text-xl font-bold">Chỉnh sửa trang cá nhân</h2></div>
          <button type="button" onClick={() => setEditOpen(false)} aria-label="Đóng" className="grid h-10 w-10 place-items-center rounded-full border border-line hover:bg-raised"><X size={19} /></button>
        </header>
        <form onSubmit={saveProfile} className="space-y-1 px-5 py-2 sm:px-7">
          <div className="flex items-center gap-4 border-b border-line py-5">
            {profileDraft.avatarUrl ? <img src={profileDraft.avatarUrl} alt="Ảnh đại diện xem trước" className="h-16 w-16 rounded-full object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-full bg-raised text-muted"><UserCircle size={42} weight="fill" /></div>}
            <div className="flex-1"><p className="font-semibold">Ảnh đại diện</p><p className="mt-1 text-xs text-muted">PNG, JPG, WEBP hoặc GIF · tối đa 5 MB</p></div>
            <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={event => void uploadAvatar(event.target.files?.[0])} />
            <button type="button" disabled={uploadingAvatar} onClick={() => avatarInput.current?.click()} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-raised disabled:opacity-60">{uploadingAvatar ? 'Đang tải…' : 'Thay ảnh'}</button>
          </div>
          <ProfileField label="Tên" hint="Tên hiển thị trên trang cá nhân."><input required maxLength={120} value={profileDraft.displayName} onChange={event => updateDraft('displayName', event.target.value)} /></ProfileField>
          <ProfileField label="Tên người dùng" hint="Dùng trong đường dẫn trang cá nhân."><div className="flex items-center gap-2"><span className="text-muted">@</span><input required maxLength={255} value={profileDraft.userName} onChange={event => updateDraft('userName', event.target.value)} /></div></ProfileField>
          <ProfileField label="Tiểu sử"><textarea rows={3} maxLength={1000} value={profileDraft.bio} onChange={event => updateDraft('bio', event.target.value)} placeholder="Viết vài dòng giới thiệu về bạn" /></ProfileField>
          <ProfileField label="Mối quan tâm" hint="Phân cách bằng dấu phẩy, tối đa 12 mục."><input value={profileDraft.interests} onChange={event => updateDraft('interests', event.target.value)} placeholder="Ví dụ: công nghệ, du lịch, sách" /></ProfileField>
          <ProfileField label="Liên kết"><input type="url" value={profileDraft.profileLink} onChange={event => updateDraft('profileLink', event.target.value)} placeholder="https://example.com" /></ProfileField>
          <ProfileField label="Podcast"><input type="url" value={profileDraft.podcastUrl} onChange={event => updateDraft('podcastUrl', event.target.value)} placeholder="https://..." /></ProfileField>
          <ProfileField label="Instagram"><input type="url" value={profileDraft.instagramUrl} onChange={event => updateDraft('instagramUrl', event.target.value)} placeholder="https://instagram.com/ten-cua-ban" /></ProfileField>
          <div className="space-y-3 border-t border-line py-5">
            <ProfileToggle label="Hiển thị biểu tượng Instagram" checked={profileDraft.showInstagram} onChange={checked => updateDraft('showInstagram', checked)} />
            <ProfileToggle label="Hiển thị lượt xem" description="Cho người khác thấy tổng lượt xem bài viết của bạn." checked={profileDraft.showViews} onChange={checked => updateDraft('showViews', checked)} />
          </div>
          {profileError && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{profileError}</p>}
          <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-surface py-4">
            <Link href="/profile" onClick={() => setEditOpen(false)} className="mr-auto self-center text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink">Cài đặt mật khẩu</Link>
            <button type="button" onClick={() => setEditOpen(false)} className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold hover:bg-raised">Hủy</button>
            <button type="submit" disabled={savingProfile || uploadingAvatar} className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-canvas disabled:opacity-60">{savingProfile ? 'Đang lưu…' : 'Lưu'}</button>
          </footer>
        </form>
      </section>
    </div>}
  </main>;
}

function ProfileField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block border-b border-line py-4"><span className="text-sm font-semibold">{label}</span>{hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}<div className="mt-2 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-line [&_input]:bg-canvas [&_input]:px-3.5 [&_input]:py-3 [&_input]:text-sm [&_input]:outline-none [&_input]:focus:border-ink [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-line [&_textarea]:bg-canvas [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:outline-none [&_textarea]:focus:border-ink">{children}</div></label>;
}

function ProfileToggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line px-4 py-3"><span><span className="block text-sm font-semibold">{label}</span>{description && <span className="mt-1 block text-xs text-muted">{description}</span>}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-5 w-5 accent-black" /></label>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-5 py-16 text-center"><p className="text-sm text-muted">{text}</p></div>;
}
