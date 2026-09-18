'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  PenSquare,
  FileText,
  CheckCircle2,
  Eye,
  Trash2,
  Edit3,
  Search,
  Plus,
  ExternalLink,
  AlertCircle,
  X,
  Loader2,
  Check,
  BookOpen,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { postApi, PostItem, Category } from '@/services/postApi';

export default function DashboardPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modal tạo bài viết
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newCoverImage, setNewCoverImage] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<'published' | 'draft'>('published');

  const currentUserId = user?.id ?? (user as any)?.userId ?? (user as any)?.sub;
  const currentUsername = (user?.userName || (user as any)?.username || '').toLowerCase().trim();
  const isAdmin = user?.role === 'Admin';

  // Hàm tải dữ liệu an toàn có cơ chế Fallback
  const fetchDashboardData = useCallback(async () => {
    if (!currentUserId && !currentUsername) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Tải danh mục
      const cats = await postApi.getCategories().catch(() => [] as Category[]);
      setCategories(cats || []);
      if (cats && cats.length > 0) {
        setNewCategoryId((prev) => (prev ? prev : cats[0].id));
      }

      let myPosts: PostItem[] = [];

      // 1. Thử gọi API chuyên dụng /v1/posts/me
      try {
        if (typeof postApi.getMyPosts === 'function') {
          const resMe = await postApi.getMyPosts();
          if (Array.isArray(resMe) && resMe.length > 0) {
            myPosts = resMe;
          }
        }
      } catch (e) {
        console.warn('Endpoint /v1/posts/me chưa sẵn sàng, chuyển sang chế độ dự phòng.');
      }

      // 2. Nếu API trên chưa có bài hoặc lỗi 500, fallback sang lấy danh sách chung rồi lọc
      if (myPosts.length === 0) {
        const allPosts = await postApi.getPosts().catch(() => [] as PostItem[]);
        myPosts = (allPosts || []).filter((p: any) => {
          if (isAdmin) return true; // Admin được xem toàn bộ bài viết hệ thống

          const pAuthorId = p.author_id ?? p.authorId ?? p.user_id ?? p.userId ?? p.author?.id;
          const pAuthorName = (
            p.author_name ?? p.authorName ?? p.author?.userName ?? p.author?.username ?? ''
          ).toLowerCase().trim();

          const matchId = currentUserId && pAuthorId && String(pAuthorId) === String(currentUserId);
          const matchName = currentUsername && pAuthorName && pAuthorName === currentUsername;

          return matchId || matchName;
        });
      }

      setPosts(myPosts);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, currentUsername, isAdmin]);

  // Chỉ kích hoạt lại khi User ID thực sự thay đổi (Triệt tiêu vòng lặp vô tận)
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Tự động sinh Slug chống trùng
  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const baseSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    const uniqueSuffix = Date.now().toString().slice(-4);
    setNewSlug(baseSlug ? `${baseSlug}-${uniqueSuffix}` : '');
  };

  // Tạo bài viết
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !newCategoryId) {
      setModalError('Vui lòng nhập tiêu đề, nội dung và chọn chuyên mục hợp lệ.');
      return;
    }

    try {
      setCreating(true);
      setModalError('');

      const created = await postApi.createPost({
        title: newTitle.trim(),
        slug: newSlug.trim() || `post-${Date.now()}`,
        excerpt: newExcerpt.trim(),
        coverImage: newCoverImage.trim(),
        content: newContent.trim(),
        categoryId: newCategoryId,
        category_id: newCategoryId,
        status: newStatus.toUpperCase(),
        userId: currentUserId,
        authorId: currentUserId,
      });

      const createdRaw = created as any;
      const createdStatus = String(createdRaw.status || '').toLowerCase();
      if (createdStatus === 'reject') {
        setModalError(createdRaw.moderationReason || 'Bài viết có chứa ngôn từ không phù hợp và đã bị từ chối xuất bản.');
        await fetchDashboardData();
        return;
      }
      if (createdStatus === 'pending') {
        setModalError('Bộ lọc gặp lỗi; bài viết đang chờ Admin xử lý.');
        await fetchDashboardData();
        return;
      }
      setIsModalOpen(false);
      setNewTitle('');
      setNewSlug('');
      setNewExcerpt('');
      setNewCoverImage('');
      setNewContent('');
      setActionMessage('Đã tạo ấn phẩm mới thành công.');
      setTimeout(() => setActionMessage(null), 3500);

      // Tải lại danh sách sau khi tạo
      await fetchDashboardData();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || err?.message || 'Không thể tạo bài viết.');
    } finally {
      setCreating(false);
    }
  };

  // Xóa bài viết
  const handleDeletePost = async (id: number | string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}"?`)) return;

    try {
      await postApi.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setActionMessage(`Đã xóa bài viết "${title}".`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xóa bài viết!');
    }
  };

  // Thống kê ấn phẩm
  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter(
      (p: any) => (p.status || '').toString().toLowerCase() === 'published'
    ).length;
    const drafts = total - published;
    const totalViews = posts.reduce((acc, p: any) => {
      return acc + Number(p.view_count ?? p.viewCount ?? 0);
    }, 0);

    return { total, published, drafts, totalViews };
  }, [posts]);

  // Bộ lọc bài viết
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const status = (post.status || '').toString().toLowerCase();
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && status === 'published') ||
        (statusFilter === 'draft' && status === 'draft');

      const query = searchQuery.toLowerCase().trim();
      const title = (post.title || '').toLowerCase();
      const content = (post.content || '').toLowerCase();
      const matchSearch = !query || title.includes(query) || content.includes(query);

      return matchStatus && matchSearch;
    });
  }, [posts, statusFilter, searchQuery]);

  const getCategoryName = (catId?: number) => {
    if (!catId) return 'Tổng hợp';
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : 'Tổng hợp';
  };

  const username = user?.userName || (user as any)?.username || 'Tác giả';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-[#06080e] dark:text-zinc-100 transition-colors duration-200 pb-20">
      <div className="absolute inset-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-200/80 dark:border-white/[0.08] pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              TÒA SOẠN & BÀN BIÊN TẬP
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Bảng điều khiển tác giả
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Xin chào, <span suppressHydrationWarning className="font-semibold text-red-700 dark:text-red-400">{username}</span>. Theo dõi chỉ số và quản lý ấn phẩm của bạn.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Xem trang chủ
            </Link>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-700/25 hover:bg-red-600 active:scale-95 transition"
            >
              <Plus className="h-4 w-4" />
              Soạn bài mới
            </button>
          </div>
        </div>

        {/* Thông báo */}
        {actionMessage && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* 3 Thẻ chỉ số */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                TỔNG BÀI VIẾT
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-600/10 text-red-700 dark:text-red-400">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white">
                {stats.total}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                ({stats.drafts} bản nháp)
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                ĐÃ XUẤT BẢN
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white">
                {stats.published}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {stats.total > 0 ? Math.round((stats.published / stats.total) * 100) : 0}% tổng bài
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                LƯỢT ĐỌC TÍCH LŨY
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white">
                {stats.totalViews.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">lượt xem</span>
            </div>
          </div>
        </div>

        {/* Bộ lọc & Tìm kiếm */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'published'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5'
              }`}
            >
              Đã xuất bản ({stats.published})
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === 'draft'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5'
              }`}
            >
              Bản nháp ({stats.drafts})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tiêu đề bài viết..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white dark:placeholder-zinc-500 transition"
            />
          </div>
        </div>

        {/* Bảng Dữ liệu */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02]">
          {loading ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-zinc-500 dark:text-zinc-400">
              <Loader2 className="h-7 w-7 animate-spin text-red-700 dark:text-red-400" />
              <p className="text-xs">Đang nạp danh sách bài viết...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-zinc-400 dark:text-zinc-600 mb-3" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Chưa có bài viết nào</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Bấm vào nút &quot;Soạn bài mới&quot; để xuất bản ấn phẩm đầu tiên!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200/80 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-zinc-400">
                    <th className="py-3.5 px-6">TIÊU ĐỀ BÀI VIẾT</th>
                    <th className="py-3.5 px-6">CHUYÊN MỤC</th>
                    <th className="py-3.5 px-6">TRẠNG THÁI</th>
                    <th className="py-3.5 px-6 text-center">LƯỢT XEM</th>
                    <th className="py-3.5 px-6">NGÀY CẬP NHẬT</th>
                    <th className="py-3.5 px-6 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.04] text-xs">
                  {filteredPosts.map((post, idx) => {
                    const raw = post as any;
                    const catId = Number(raw.categoryId || raw.category_id);
                    const viewCount = raw.view_count ?? raw.viewCount ?? 0;
                    const status = (post.status || '').toString().toLowerCase();
                    const uniqueKey = post.id ?? raw._id ?? `post-${idx}`;

                    return (
                      <tr key={uniqueKey} className="group hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition">
                        <td className="py-4 px-6 max-w-md">
                          <Link
                            href={`/posts/${post.id}`}
                            className="font-bold text-zinc-950 dark:text-white hover:text-red-700 dark:hover:text-red-400 line-clamp-1 transition"
                            title={post.title}
                          >
                            {post.title || 'Chưa đặt tiêu đề'}
                          </Link>
                          <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                            {post.slug || 'slug-tu-dong'}
                          </p>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                            {getCategoryName(catId)}
                          </span>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          {status === 'published' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Đã xuất bản
                            </span>
                          ) : status === 'reject' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                Từ chối
                              </span>
                              <p className="max-w-48 truncate text-[10px] text-rose-600 dark:text-rose-300" title={raw.moderationReason || 'Bài viết có chứa ngôn từ không phù hợp và đã bị từ chối xuất bản.'}>
                                {raw.moderationReason || 'Bài viết có chứa ngôn từ không phù hợp và đã bị từ chối xuất bản.'}
                              </p>
                            </div>
                          ) : status === 'pending' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                              Chờ duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Bản nháp
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-center font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {viewCount.toLocaleString()}
                        </td>

                        <td className="py-4 px-6 text-zinc-500 whitespace-nowrap">
                          {raw.created_at ? new Date(raw.created_at).toLocaleDateString('vi-VN') : 'Mới đây'}
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/posts/${post.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-white transition"
                              title="Xem trực tiếp"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>

                            <Link
                              href={`/dashboard/posts/edit/${post.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-600/10 dark:hover:text-red-400 transition"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Link>

                            <button
                              onClick={() => handleDeletePost(post.id, post.title)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition"
                              title="Xóa bài viết"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Modal Soạn bài mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-white/10 dark:bg-[#0c101a] text-zinc-900 dark:text-white my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-700/10 text-red-700 dark:bg-red-600/20 dark:text-red-400">
                  <PenSquare className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold">Soạn thảo ấn phẩm mới</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePost} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Tiêu đề bài viết
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Nhập tiêu đề truyền cảm hứng..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-zinc-500 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Đường dẫn tĩnh (Slug - tự sinh an toàn)
                  </label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="tieu-de-bai-viet-xxxx"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-zinc-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                    Chuyên mục
                  </label>
                  <select
                    value={newCategoryId ?? ''}
                    onChange={(e) => setNewCategoryId(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 focus:border-red-600 focus:outline-none dark:border-white/10 dark:bg-[#0c101a] dark:text-white transition"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Trích đoạn ngắn (Excerpt)
                </label>
                <input
                  type="text"
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="Mô tả tóm tắt nội dung bài viết..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-zinc-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  URL Ảnh bìa (Cover Image)
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="url"
                    value={newCoverImage}
                    onChange={(e) => setNewCoverImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-zinc-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Nội dung bài viết
                </label>
                <textarea
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Chia sẻ nội dung hoặc câu chuyện của bạn..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs text-zinc-950 placeholder-zinc-400 focus:border-red-600 focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/[0.08] dark:text-white dark:placeholder-zinc-500 transition leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Chế độ lưu
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={newStatus === 'published'}
                      onChange={() => setNewStatus('published')}
                      className="text-red-700 focus:ring-red-600"
                    />
                    Xuất bản ngay lập tức
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={newStatus === 'draft'}
                      onChange={() => setNewStatus('draft')}
                      className="text-red-700 focus:ring-red-600"
                    />
                    Lưu bản nháp
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-700/25 hover:bg-red-600 active:scale-95 disabled:opacity-50 transition"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {newStatus === 'published' ? 'Đăng bài viết' : 'Lưu bản nháp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
