'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Activity,
  Award,
} from 'lucide-react';

export default function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Thống kê tổng hợp cấp cao
  const kpiData = [
    {
      title: 'Lượt xem trang',
      value: '48,250',
      change: '+18.4%',
      trend: 'up',
      icon: Eye,
      sub: 'So với tháng trước',
    },
    {
      title: 'Người dùng hoạt động',
      value: '1,420',
      change: '+12.1%',
      trend: 'up',
      icon: Users,
      sub: '320 người dùng mới',
    },
    {
      title: 'Bài viết đã đăng',
      value: '128',
      change: '+8.5%',
      trend: 'up',
      icon: FileText,
      sub: '14 bài nháp chờ duyệt',
    },
    {
      title: 'Tỷ lệ tương tác',
      value: '64.2%',
      change: '-2.4%',
      trend: 'down',
      icon: Activity,
      sub: 'Bình luận & Yêu thích',
    },
  ];

  // Dữ liệu biểu đồ cột tăng trưởng (dùng CSS thuần, không cần cài thư viện)
  const trafficChart = [
    { label: 'Tháng 4', views: 21000, height: '45%' },
    { label: 'Tháng 5', views: 28000, height: '60%' },
    { label: 'Tháng 6', views: 24000, height: '52%' },
    { label: 'Tháng 7', views: 35000, height: '75%' },
    { label: 'Tháng 8', views: 42000, height: '90%' },
    { label: 'Tháng 9', views: 48250, height: '100%' },
  ];

  // Phân bổ danh mục
  const categoryDistribution = [
    { name: 'Lập trình', percentage: 42, color: 'bg-indigo-500', count: 54 },
    { name: 'DevOps & Docker', percentage: 28, color: 'bg-cyan-500', count: 36 },
    { name: 'Kiến trúc hệ thống', percentage: 18, color: 'bg-emerald-500', count: 23 },
    { name: 'UI / UX Design', percentage: 12, color: 'bg-amber-500', count: 15 },
  ];

  // Top bài viết có lượt đọc cao nhất
  const topPosts = [
    {
      id: 1,
      title: 'Xây dựng ứng dụng Full-stack với Next.js và PHP DDD',
      author: 'NguyenVanLuan',
      views: 14200,
      likes: 312,
      category: 'Lập trình',
    },
    {
      id: 2,
      title: 'Tối ưu hoá Docker Compose cho môi trường phát triển',
      author: 'PhucIT',
      views: 9850,
      likes: 245,
      category: 'DevOps & Docker',
    },
    {
      id: 3,
      title: 'Xử lý xác thực JWT an toàn với cơ chế Refresh Token xoay vòng',
      author: 'SecurityTeam',
      views: 8120,
      likes: 189,
      category: 'Kiến trúc hệ thống',
    },
    {
      id: 4,
      title: 'Clean Code: Các nguyên lý cơ bản trong thiết kế phần mềm',
      author: 'NguyenVanLuan',
      views: 6450,
      likes: 130,
      category: 'Lập trình',
    },
  ];

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <BarChart3 className="h-4 w-4" /> Báo cáo & Giám sát
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
            Tổng quan Hoạt động Nền tảng
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Phân tích số liệu lưu lượng, độ gắn kết và xu hướng xuất bản nội dung.
          </p>
        </div>

        {/* Bộ lọc khoảng thời gian */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          <button
            onClick={() => setTimeRange('7d')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              timeRange === '7d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            7 ngày
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              timeRange === '30d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            30 ngày
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              timeRange === '90d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Quý này
          </button>
        </div>
      </div>

      {/* 4 Thẻ KPI */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <div
            key={kpi.title}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{kpi.title}</span>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-indigo-400">
                <kpi.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-white">{kpi.value}</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                {kpi.trend === 'up' ? (
                  <span className="flex items-center text-emerald-400 font-semibold">
                    <ArrowUpRight className="h-3.5 w-3.5" /> {kpi.change}
                  </span>
                ) : (
                  <span className="flex items-center text-rose-400 font-semibold">
                    <ArrowDownRight className="h-3.5 w-3.5" /> {kpi.change}
                  </span>
                )}
                <span className="text-zinc-500">{kpi.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grid: Biểu đồ lưu lượng + Tỷ lệ danh mục */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Biểu đồ tăng trưởng lượt xem */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Xu hướng tăng trưởng lượt xem</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Biểu đồ đo lường lượt đọc tích lũy qua các tháng</p>
            </div>
            <span className="rounded-md border border-emerald-800/40 bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-300">
              +142% toàn kỳ
            </span>
          </div>

          <div className="h-60 w-full flex items-end justify-between gap-4 pt-8 pb-2 px-2 border-b border-white/10">
            {trafficChart.map((col) => (
              <div key={col.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition font-mono">
                  {col.views.toLocaleString('vi-VN')}
                </span>
                <div
                  style={{ height: col.height }}
                  className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-indigo-900 via-indigo-600 to-indigo-400 group-hover:brightness-125 transition-all duration-300 shadow-lg shadow-indigo-500/10"
                />
                <span className="text-xs text-zinc-400 font-medium">{col.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phân bổ theo danh mục */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white">Cơ cấu chuyên mục</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Tỷ lệ bài viết theo từng nhóm đề tài</p>
          </div>

          <div className="space-y-4">
            {categoryDistribution.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">{cat.name}</span>
                  <span className="text-zinc-400">{cat.count} bài ({cat.percentage}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className={`h-full rounded-full ${cat.color}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-xs text-zinc-400 flex items-start gap-2.5">
            <Layers className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Đề tài <strong>Lập trình</strong> và <strong>DevOps</strong> đang chiếm 70% tổng lượng tương tác trên toàn hệ thống.
            </p>
          </div>
        </div>
      </div>

      {/* Bảng Top bài viết thịnh hành */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              <h2 className="text-base font-bold text-white">Top bài viết có lượt đọc cao nhất</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Xếp hạng theo lượt xem tích lũy từ người đọc</p>
          </div>
          <Link
            href="/posts"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
          >
            Xem kho bài viết →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th scope="col" className="pb-3 pr-4">Hạng</th>
                <th scope="col" className="pb-3 px-4">Tiêu đề bài viết</th>
                <th scope="col" className="pb-3 px-4">Tác giả</th>
                <th scope="col" className="pb-3 px-4">Chuyên mục</th>
                <th scope="col" className="pb-3 px-4">Lượt xem</th>
                <th scope="col" className="pb-3 pl-4 text-right">Lượt thích</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topPosts.map((post, idx) => (
                <tr key={post.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 pr-4 font-bold text-indigo-400">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white max-w-sm truncate">
                    {post.title}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">
                    @{post.author}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                      {post.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-white">
                    {post.views.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3.5 pl-4 text-right font-mono text-rose-400">
                    ♥ {post.likes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}