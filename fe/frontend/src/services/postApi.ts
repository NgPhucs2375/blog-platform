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
  author?: { id?: number; userName?: string; username?: string };
  createdAt?: string;
  created_at?: string;
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
  getPosts: async (): Promise<PostItem[]> => {
    try {
      const res = await api.get('/v1/posts');
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

  // Tạo bài viết mới (gửi song song cả camelCase và snake_case cho database)
  createPost: async (payload: any): Promise<PostItem> => {
    const rawStatus = (payload.status || 'published').toString().toLowerCase();
    const formattedPayload = {
      title: payload.title,
      slug: payload.slug,
      content: payload.content,
      excerpt: payload.excerpt || '',
      category_id: Number(payload.categoryId || payload.category_id || 1),
      categoryId: Number(payload.categoryId || payload.category_id || 1),
      cover_image: payload.coverImage || payload.cover_image || '',
      coverImage: payload.coverImage || payload.cover_image || '',
      status: rawStatus, // Bắt buộc chữ thường 'published' hoặc 'draft'
      user_id: payload.userId || payload.user_id,
      author_id: payload.authorId || payload.author_id,
    };

    const res = await api.post('/v1/posts', formattedPayload);
    return unwrapData(res.data);
  },

  // Cập nhật bài viết
  updatePost: async (id: number | string, payload: any): Promise<PostItem> => {
    const rawStatus = (payload.status || 'published').toString().toLowerCase();
    const formattedPayload = {
      title: payload.title,
      slug: payload.slug,
      content: payload.content,
      excerpt: payload.excerpt || '',
      category_id: Number(payload.categoryId || payload.category_id || 1),
      categoryId: Number(payload.categoryId || payload.category_id || 1),
      cover_image: payload.coverImage || payload.cover_image || '',
      coverImage: payload.coverImage || payload.cover_image || '',
      status: rawStatus,
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