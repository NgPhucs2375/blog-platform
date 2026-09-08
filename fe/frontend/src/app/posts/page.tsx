'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { postApi, PostItem, Category } from '@/services/postApi';
import {
  Search,
  BookOpen,
  Eye,
  Calendar,
  Tag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function PostsExplorerPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [cats, allPosts] = await Promise.all([
        postApi.getCategories(),
        postApi.getMyPosts(),
      ]);
      setCategories(cats);
      // Chỉ hiển thị các bài viết đã xuất bản (Published) ra trang công khai
      setPosts(allPosts.filter((p) => p.status.toLowerCase() === 'published'));
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory =
        selectedCategory === 'all'
          ? true
          : String(post.category_id) === selectedCategory ||
            post.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [posts, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header trang Blog */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" /> Khám phá tri thức kỹ thuật
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Bài viết & Chia sẻ công nghệ
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Tổng hợp các bài viết chuyên sâu về kiến trúc phần mềm, DevOps, tối ưu cơ sở dữ liệu và bảo mật hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-medium text-slate-400 hover:text-white border border-slate-800 rounded-xl px-4 py-2.5 transition"
            >
              ← Trang chủ
            </Link>
            <Link
              href="/dashboard/posts/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition"
            >
              Viết bài của bạn
            </Link>
          </div>
        </div>

        {/* Thanh công cụ tìm kiếm và lọc danh mục */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả chủ đề
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(String(cat.id))}
                className={`rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === String(cat.id)
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Danh sách bài viết dạng lưới Card */}
        {loading ? (
          <div className="py-24 text-center text-sm text-slate-500">
            Đang tải danh sách bài viết...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center space-y-3 rounded-2xl border border-dashed border-slate-800">
            <BookOpen className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-400">Không tìm thấy bài viết nào phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 hover:border-slate-700 hover:bg-slate-900/70 transition space-y-5"
              >
                <div className="space-y-4">
                  {post.featured_image && (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="h-44 w-full object-cover rounded-xl border border-slate-800"
                    />
                  )}

                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-indigo-800/50 bg-indigo-950/70 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
                      {post.category || 'Công nghệ'}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {post.createdAt || post.created_at || 'Gần đây'}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white group-hover:text-indigo-400 transition line-clamp-2 leading-snug">
                    <Link href={`/posts/${post.id}`}>
                      {post.title}
                    </Link>
                  </h2>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {post.excerpt || post.content || 'Nhấp vào để đọc chi tiết bài viết...'}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 text-xs">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {(post.views || post.views_count || 0).toLocaleString('vi-VN')} lượt xem
                  </span>
                  <Link
                    href={`/posts/${post.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Đọc tiếp <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}