import api from '@/lib/axios';

export interface Category {
  id: number | string;
  name: string;
  slug: string;
}

export interface PostItem {
  id: number | string;
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  category?: string;
  category_id?: number | string;
  featured_image?: string;
  status: 'published' | 'draft' | 'Published' | 'Draft';
  views?: number;
  views_count?: number;
  createdAt?: string;
  created_at?: string;
}

export interface SavePostPayload {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  category_id?: number | string;
  featured_image?: string;
  status: 'published' | 'draft';
}

const STORAGE_KEY = 'blog_platform_posts';

const getStoredPosts = (): PostItem[] => {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: PostItem[] = [
      {
        id: 1,
        title: 'Xây dựng ứng dụng Full-stack với Next.js và PHP DDD',
        slug: 'xay-dung-ung-dung-full-stack-nextjs-php-ddd',
        content: 'Tìm hiểu cách kết hợp sức mạnh giao diện của Next.js với kiến trúc phân tầng Domain-Driven Design trong PHP.',
        excerpt: 'Kiến trúc Clean Architecture kết hợp Next.js và PHP DDD.',
        category: 'Lập trình',
        category_id: 1,
        status: 'published',
        views: 820,
        createdAt: '02 Th09, 2026',
      },
      {
        id: 2,
        title: 'Tối ưu hoá Docker Compose cho môi trường phát triển',
        slug: 'toi-uu-hoa-docker-compose',
        content: 'Các mẹo cấu hình container nhẹ hơn, nạp hot-reload mượt mà và quản lý tài nguyên hiệu quả.',
        excerpt: 'Cấu hình container nhẹ và tối ưu tài nguyên.',
        category: 'DevOps',
        category_id: 2,
        status: 'published',
        views: 420,
        createdAt: '28 Th08, 2026',
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw);
};

const setStoredPosts = (posts: PostItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }
};

export const postApi = {
  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await api.get('/categories');
      return res.data?.data || res.data || [];
    } catch {
      return [
        { id: 1, name: 'Lập trình', slug: 'lap-trinh' },
        { id: 2, name: 'DevOps', slug: 'devops' },
        { id: 3, name: 'Kiến trúc hệ thống', slug: 'kien-truc-he-thong' },
        { id: 4, name: 'UI/UX Design', slug: 'ui-ux-design' },
      ];
    }
  },

  getMyPosts: async (): Promise<PostItem[]> => {
    try {
      const res = await api.get('/posts/my-posts');
      return res.data?.data || res.data || [];
    } catch {
      return getStoredPosts();
    }
  },

  getPostById: async (id: number | string): Promise<PostItem | null> => {
    try {
      const res = await api.get(`/posts/${id}`);
      return res.data?.data || res.data;
    } catch {
      const posts = getStoredPosts();
      return posts.find((p) => String(p.id) === String(id)) || null;
    }
  },

  createPost: async (payload: SavePostPayload): Promise<PostItem> => {
    try {
      const res = await api.post('/posts', payload);
      return res.data?.data || res.data;
    } catch {
      const posts = getStoredPosts();
      const newPost: PostItem = {
        id: Date.now(),
        ...payload,
        views: 0,
        createdAt: 'Vừa xong',
      };
      posts.unshift(newPost);
      setStoredPosts(posts);
      return newPost;
    }
  },

  updatePost: async (id: number | string, payload: SavePostPayload): Promise<PostItem> => {
    try {
      const res = await api.put(`/posts/${id}`, payload);
      return res.data?.data || res.data;
    } catch {
      const posts = getStoredPosts();
      const idx = posts.findIndex((p) => String(p.id) === String(id));
      if (idx !== -1) {
        posts[idx] = { ...posts[idx], ...payload };
        setStoredPosts(posts);
        return posts[idx];
      }
      throw new Error('Bài viết không tồn tại.');
    }
  },

  deletePost: async (id: number | string): Promise<void> => {
    try {
      await api.delete(`/posts/${id}`);
    } catch {
      const posts = getStoredPosts().filter((p) => String(p.id) !== String(id));
      setStoredPosts(posts);
    }
  },
};