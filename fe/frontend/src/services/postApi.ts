import api from '@/lib/axios';

export interface PostItem {
  id: number | string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  cover_image?: string;
  categoryId?: number;
  category_id?: number;
  status: 'published' | 'draft' | string;
  viewCount?: number;
  view_count?: number;
  authorId?: number;
  author_id?: number;
  authorName?: string;
  author_name?: string;
  author?: { id?: number; userName?: string; username?: string; avatarUrl?: string | null; followersCount?: number };
  createdAt?: string;
  created_at?: string;
  publishedAt?: string;
  category?: Category;
  moderationReason?: string;
  tags?: { id: number; name: string; slug: string }[];
  scheduledAt?: string;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  followersCount?: number;
  sharesCount?: number;
  quotedPost?: {
    id: number | string;
    slug?: string;
    title: string;
    content?: string;
    coverImage?: string | null;
    authorName?: string;
    author?: { id?: number; userName?: string; avatarUrl?: string | null } | null;
  } | null;
  media?: { url: string; type: 'image' | 'video' }[];
  poll?: { options: string[]; voteCounts: number[]; totalVotes: number; endsAt?: string | null; hasEnded: boolean; myVote?: number | null } | null;
  threadId?: string | null;
  threadPosition?: number;
  threadItems?: { id: number; slug: string; content: string; media?: { url: string; type: 'image' | 'video' }[]; position: number }[];
  replyPermission?: 'everyone' | 'followers' | 'none';
  quotePermission?: 'everyone' | 'followers' | 'none';
  replyApproval?: boolean;
  community?: { id: number; name: string; slug: string; icon?: string | null; authorFlair?: string | null; authorIsChampion?: boolean } | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

function unwrapData(resData: any) {
  let payload = resData;
  if (payload?.data) payload = payload.data;
  if (payload?.data) payload = payload.data;
  if (payload?.post) payload = payload.post;
  return payload;
}

export const postApi = {
  // Lấy danh sách bài viết
  getPosts: async (params?: { tag?: string }): Promise<PostItem[]> => {
    try {
      const res = await api.get('/v1/posts', { params });
      const payload = unwrapData(res.data);
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.posts)) return payload.posts;
      return [];
    } catch (err) {
      console.error('Lỗi khi tải danh sách bài viết:', err);
      return [];
    }
  },
  getFeed: async (kind: 'following' | 'liked' | 'bookmarks' | 'custom' | 'public', id?: number): Promise<PostItem[]> => {
    const path = kind === 'following' ? '/v1/feed/following' : kind === 'liked' ? '/v1/posts/liked' : kind === 'bookmarks' ? '/v1/bookmarks' : `/v1/custom-feeds/${id}/posts`;
    const res = await api.get(path);
    const payload = unwrapData(res.data);
    return Array.isArray(payload) ? payload : payload?.posts || payload?.data || [];
  },

  // Lấy chi tiết một bài viết
  getPostById: async (id: number | string): Promise<PostItem | null> => {
    if (!id || id === 'undefined' || id === 'null') return null;
    try {
      const res = await api.get(`/v1/posts/${id}`);
      return unwrapData(res.data);
    } catch (err: any) {
      console.error(`Lỗi khi tải bài viết ID ${id}:`, err?.message);
      return null;
    }
  },

  // Route co xac thuc de tac gia/Admin xem duoc nhap, pending va reject.
  getManagePostById: async (id: number | string): Promise<PostItem | null> => {
    if (!id || id === 'undefined' || id === 'null') return null;
    try {
      const res = await api.get(`/v1/posts/${id}/manage`);
      return unwrapData(res.data);
    } catch (err: any) {
      console.error(`Lỗi khi tải bài viết quản lý ID ${id}:`, err?.message);
      return null;
    }
  },

  // Tạo bài viết mới (gửi song song cả camelCase và snake_case cho database)
  createPost: async (payload: any): Promise<PostItem> => {
    const rawStatus = (payload.status || 'published').toString().toUpperCase();
    const formattedPayload = {
      title: payload.title,
      slug: payload.slug,
      content: payload.content,
      excerpt: payload.excerpt || '',
      coverImage: payload.coverImage || payload.cover_image || payload.featured_image || '',
      tags: payload.tags || [],
      scheduledAt: payload.scheduledAt || undefined,
      categoryId: payload.categoryId || payload.category_id ? Number(payload.categoryId || payload.category_id) : undefined,
      status: rawStatus,
      media: payload.media,
      pollOptions: payload.pollOptions,
      pollEndsAt: payload.pollEndsAt,
      replyPermission: payload.replyPermission,
      quotePermission: payload.quotePermission,
      replyApproval: payload.replyApproval,
      communityId: payload.communityId,
    };

    const res = await api.post('/v1/posts', formattedPayload);
    return unwrapData(res.data);
  },
  createThread: async (payload: { categoryId?: number; items: { content: string; media?: { url: string; type: 'image' | 'video' }[] }[]; communityId?: number; tags?: string[] }): Promise<{ threadId: string; posts: PostItem[] }> => {
    const res = await api.post('/v1/posts/thread', payload);
    return unwrapData(res.data);
  },
  getInsights: async (): Promise<any> => unwrapData((await api.get('/v1/insights')).data),
  getCommunities: async (search = ''): Promise<any[]> => {
    const res = await api.get('/v1/communities', { params: { search } });
    const payload = unwrapData(res.data);
    return Array.isArray(payload) ? payload : payload?.data || [];
  },
  getCustomFeeds: async (): Promise<any[]> => {
    const payload = unwrapData((await api.get('/v1/custom-feeds')).data);
    return Array.isArray(payload) ? payload : [];
  },
  getPublicFeeds: async (): Promise<any[]> => {
    const payload = unwrapData((await api.get('/v1/custom-feeds/public')).data);
    return Array.isArray(payload) ? payload : payload?.data || [];
  },

  // Cập nhật bài viết
  updatePost: async (id: number | string, payload: any): Promise<PostItem> => {
    const rawStatus = (payload.status || 'published').toString().toLowerCase();
    const formattedPayload = {
      title: payload.title,
      slug: payload.slug,
      content: payload.content,
      excerpt: payload.excerpt || '',
      category_id: payload.categoryId || payload.category_id ? Number(payload.categoryId || payload.category_id) : null,
      categoryId: payload.categoryId || payload.category_id ? Number(payload.categoryId || payload.category_id) : null,
      cover_image: payload.coverImage || payload.cover_image || '',
      coverImage: payload.coverImage || payload.cover_image || '',
      tags: payload.tags,
      scheduledAt: payload.scheduledAt || undefined,
      status: rawStatus,
      media: payload.media,
      pollOptions: payload.pollOptions,
      pollEndsAt: payload.pollEndsAt,
      replyPermission: payload.replyPermission,
      quotePermission: payload.quotePermission,
      replyApproval: payload.replyApproval,
      communityId: payload.communityId,
    };

    const res = await api.put(`/v1/posts/${id}`, formattedPayload);
    return unwrapData(res.data);
  },

  // Xóa bài viết
  deletePost: async (id: number | string): Promise<void> => {
    await api.delete(`/v1/posts/${id}`);
  },

  // Lấy danh mục
  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await api.get('/v1/categories');
      const payload = unwrapData(res.data);
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      console.error('Lỗi khi tải chuyên mục:', err);
      return [];
    }
  },
  getCategoriesForAdmin: async (): Promise<Category[]> => {
    const res = await api.get('/v1/categories');
    const payload = unwrapData(res.data);
    return Array.isArray(payload) ? payload : [];
  },
  getPopularTags: async (limit = 8): Promise<{ id: number; name: string; slug: string; posts_count: number }[]> => {
    const payload = unwrapData((await api.get('/v1/tags', { params: { popular: true, limit } })).data);
    return Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  },
  createCategory: async (payload: Pick<Category, 'name' | 'slug'> & { description?: string }): Promise<Category> => {
    const res = await api.post('/v1/categories', payload);
    return unwrapData(res.data);
  },
  updateCategory: async (id: number, payload: Pick<Category, 'name' | 'slug'> & { description?: string }): Promise<Category> => {
    const res = await api.put(`/v1/categories/${id}`, payload);
    return unwrapData(res.data);
  },
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/v1/categories/${id}`);
  },
  // Lấy toàn bộ bài viết cá nhân (cả Nháp lẫn Đã duyệt) qua route /v1/posts/me
  getMyPosts: async (): Promise<PostItem[]> => {
    try {
      const res = await api.get('/v1/posts/me');
      const payload = unwrapData(res.data);
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.items)) return payload.items;
      if (Array.isArray(payload?.posts)) return payload.posts;
      return [];
    } catch (err) {
      console.error('Lỗi khi tải danh sách bài viết cá nhân:', err);
      return [];
    }
  },
  // Tăng lượt xem
  trackView: async (id: number | string): Promise<{ viewCount: number }> => {
    try {
      const res = await api.post(`/v1/posts/${id}/view`);
      return unwrapData(res.data) || { viewCount: 0 };
    } catch {
      return { viewCount: 0 };
    }
  },
};
