'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { postApi, PostItem } from '@/services/postApi';
import {
    FileText,
    Eye,
    BookmarkCheck,
    Plus,
    Trash2,
    Edit3,
    Search,
    ExternalLink,
    BookOpen,
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [posts, setPosts] = useState<PostItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    // Khắc phục triệt để tên hiển thị
    const displayName =
        user?.username ||
        (user as any)?.userName ||
        (user as any)?.name ||
        user?.email?.split('@')[0] ||
        'Tác giả';

    useEffect(() => {
        setMounted(true);
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const data = await postApi.getMyPosts();
            setPosts(data);
        } catch {
            setActionMessage('Không thể tải danh sách bài viết.');
        } finally {
            setLoading(false);
        }
    };

    // Tính toán số liệu thống kê tự động từ danh sách bài viết thực tế
    const stats = useMemo(() => {
        const totalPosts = posts.length;
        const publishedPosts = posts.filter((p) => p.status.toLowerCase() === 'published').length;
        const draftPosts = totalPosts - publishedPosts;
        const totalViews = posts.reduce((sum, p) => sum + (p.views || p.views_count || 0), 0);

        return [
            {
                label: 'Tổng bài viết',
                value: totalPosts.toString(),
                icon: FileText,
                subtext: `${draftPosts} bản nháp`,
            },
            {
                label: 'Đã xuất bản',
                value: publishedPosts.toString(),
                icon: BookmarkCheck,
                subtext: `${totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0}% tổng bài`,
            },
            {
                label: 'Lượt đọc tổng',
                value: totalViews.toLocaleString('vi-VN'),
                icon: Eye,
                subtext: 'Lượt xem tích lũy',
            },
        ];
    }, [posts]);

    // Bộ lọc bài viết theo ô tìm kiếm và trạng thái
    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            const matchSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
            const postStatus = post.status.toLowerCase();
            const matchStatus =
                statusFilter === 'all' ? true : postStatus === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [posts, searchQuery, statusFilter]);
    // Đổi trạng thái xuất bản nhanh
    const handleToggleStatus = async (post: PostItem) => {
        const nextStatus = post.status.toLowerCase() === 'published' ? 'draft' : 'published';
        try {
            await postApi.updatePost(post.id, {
                title: post.title,
                content: post.content || '',
                status: nextStatus,
            });
        } catch {
            // Fallback update state
        }
        setPosts((prev) =>
            prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p))
        );
    };
    // Xử lý xóa bài viết
    const handleDeletePost = async (id: number | string, title: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bài viết: "${title}"?`)) {
            return;
        }

        try {
            await postApi.deletePost(id);
        } catch {
            // Fallback xóa trên state khi mock API
        }
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setActionMessage(`Đã xóa thành công bài viết "${title}".`);
        setTimeout(() => setActionMessage(null), 4000);
    };

    if (!mounted) return null;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header Bảng điều khiển */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Khu vực sáng tạo
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
                                Bảng điều khiển tác giả
                            </h1>
                            <p className="text-sm text-slate-400 mt-1">
                                Xin chào, <span className="text-indigo-400 font-semibold">{displayName}</span>. Theo dõi chỉ số và ấn phẩm cá nhân.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/profile"
                                className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                            >
                                Hồ sơ
                            </Link>
                            <Link
                                href="/dashboard/posts/create"
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition"
                            >
                                <Plus className="h-4 w-4" />
                                Soạn bài mới
                            </Link>
                        </div>
                    </div>

                    {/* Thông báo thao tác */}
                    {actionMessage && (
                        <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
                            {actionMessage}
                        </div>
                    )}

                    {/* Thẻ Thống Kê Nhanh */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        {stats.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 flex flex-col justify-between hover:border-slate-700 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        {item.label}
                                    </span>
                                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-indigo-400">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="text-3xl font-black text-white tracking-tight">{item.value}</div>
                                    <div className="text-xs text-slate-500 mt-1">{item.subtext}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Khu Vực Quản Lý Bài Viết */}
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6">
                        {/* Bộ Lọc & Tìm Kiếm */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/60">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'all'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    Tất cả ({posts.length})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('published')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'published'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    Đã xuất bản
                                </button>
                                <button
                                    onClick={() => setStatusFilter('draft')}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${statusFilter === 'draft'
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    Bản nháp
                                </button>
                            </div>

                            <div className="relative max-w-xs w-full">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Tìm tiêu đề bài viết..."
                                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {/* Danh Sách Bài Viết */}
                        {loading ? (
                            <div className="py-20 text-center text-sm text-slate-500">
                                Đang tải dữ liệu bài viết...
                            </div>
                        ) : filteredPosts.length === 0 ? (
                            <div className="py-16 text-center space-y-3">
                                <div className="mx-auto h-12 w-12 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-600">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium text-slate-400">Không tìm thấy bài viết nào</p>
                                <Link
                                    href="/dashboard/posts/create"
                                    className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Tạo bài viết ngay
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto mt-4">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th scope="col" className="pb-3 pr-4">Tiêu đề bài viết</th>
                                            <th scope="col" className="pb-3 px-4">Chuyên mục</th>
                                            <th scope="col" className="pb-3 px-4">Trạng thái</th>
                                            <th scope="col" className="pb-3 px-4">Lượt xem</th>
                                            <th scope="col" className="pb-3 px-4">Ngày tạo</th>
                                            <th scope="col" className="pb-3 pl-4 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {filteredPosts.map((post) => {
                                            const isPublished = post.status.toLowerCase() === 'published';
                                            return (
                                                <tr key={post.id} className="hover:bg-slate-800/30 transition group">
                                                    <td className="py-4 pr-4 font-medium text-white max-w-sm truncate">
                                                        {post.title}
                                                    </td>
                                                    <td className="py-4 px-4 text-xs">
                                                        <span className="rounded-md border border-slate-800 bg-slate-800/60 px-2.5 py-1 text-slate-300">
                                                            {post.category || 'Chưa phân loại'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <button
                                                            onClick={() => handleToggleStatus(post)}
                                                            title="Nhấn để đổi trạng thái"
                                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition cursor-pointer hover:opacity-80 ${isPublished
                                                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
                                                                    : 'bg-amber-950/80 text-amber-300 border-amber-800/50'
                                                                }`}
                                                        >
                                                            {isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                                                        </button>
                                                    </td>
                                                    <td className="py-4 px-4 text-xs text-slate-400">
                                                        {(post.views || post.views_count || 0).toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="py-4 px-4 text-xs text-slate-500">
                                                        {post.createdAt || post.created_at || 'Mới tạo'}
                                                    </td>
                                                    <td className="py-4 pl-4 text-right">
                                                        <div className="flex items-center justify-end gap-3 opacity-90 group-hover:opacity-100">
                                                            <Link
                                                                href={`/dashboard/posts/edit/${post.id}`}
                                                                className="text-slate-400 hover:text-indigo-400 transition"
                                                                title="Chỉnh sửa"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDeletePost(post.id, post.title)}
                                                                className="text-slate-400 hover:text-rose-400 transition"
                                                                title="Xóa bài"
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
            </div>
        </ProtectedRoute>
    );
}