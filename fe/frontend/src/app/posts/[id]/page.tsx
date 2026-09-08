'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { postApi, PostItem } from '@/services/postApi';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Tag,
  Share2,
  Heart,
  MessageSquare,
} from 'lucide-react';

interface PostDetailProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PostDetailProps) {
  const resolvedParams = use(params);
  const postId = resolvedParams.id;

  const [post, setPost] = useState<PostItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(12);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      const data = await postApi.getPostById(postId);
      setPost(data);
      setLoading(false);
    };
    loadPost();
  }, [postId]);

  const handleLike = () => {
    if (hasLiked) {
      setLikes((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-sm text-slate-500">
        Đang nạp nội dung bài viết...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-400">
        <p className="text-base font-semibold">Bài viết không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/posts"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
        >
          Quay lại danh sách bài viết
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto space-y-8">
        {/* Navigation quay lại */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Về danh sách bài viết
          </Link>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-indigo-800/50 bg-indigo-950/70 px-2.5 py-1 text-xs font-semibold text-indigo-300">
              {post.category || 'Công nghệ'}
            </span>
          </div>
        </div>

        {/* Tiêu đề & Thông tin Meta */}
        <header className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {post.createdAt || post.created_at || 'Gần đây'}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> {(post.views || post.views_count || 0) + 1} lượt đọc
            </span>
          </div>

          {post.excerpt && (
            <div className="rounded-xl border-l-4 border-indigo-500 bg-slate-900/50 p-4 text-sm italic text-slate-300">
              {post.excerpt}
            </div>
          )}
        </header>

        {/* Ảnh đại diện nếu có */}
        {post.featured_image && (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full max-h-96 object-cover rounded-2xl border border-slate-800"
          />
        )}

        {/* Thân bài viết */}
        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-base space-y-4 whitespace-pre-wrap border-t border-slate-800/80 pt-6">
          {post.content}
        </div>

        {/* Tương tác cuối bài (Like & Thảo luận) */}
        <div className="flex items-center justify-between border-y border-slate-800/80 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold border transition ${
                hasLiked
                  ? 'border-rose-500/50 bg-rose-950/40 text-rose-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              {likes} Yêu thích
            </button>
            <button
              onClick={() => alert('Tính năng bình luận đang được kết nối với cơ sở dữ liệu.')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              <MessageSquare className="h-4 w-4" /> Thảo luận
            </button>
          </div>

          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('Đã sao chép liên kết bài viết!');
              }
            }}
            className="text-slate-400 hover:text-white transition p-2 rounded-lg border border-slate-800 bg-slate-900"
            title="Chia sẻ liên kết"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </article>
    </div>
  );
}