'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SendHorizontal, Sparkles, X } from 'lucide-react';
import { postApi, PostItem, Category } from '@/services/postApi';

// ============================================================
// Anum: trợ lý biên tập của Blog Platform.
// Rule-based NLU tiếng Việt, ground trên dữ liệu bài viết thật
// (top đọc, mới nhất, chuyên mục). Không phụ thuộc backend AI.
// ============================================================

type ChatMessage = {
  id: number;
  role: 'bot' | 'user';
  text: string;
  posts?: PostItem[];
  chips?: string[];
};

const DEFAULT_CHIPS = ['Đọc nhiều nhất', 'Bài viết mới nhất', 'Cách đăng bài', 'Anum là ai?'];

const viewCountOf = (p: PostItem) =>
  Number((p as any).view_count ?? p.viewCount ?? 0);

const coverOf = (p: PostItem) =>
  (p as any).cover_image ||
  p.coverImage ||
  `https://picsum.photos/seed/${p.slug || p.id}/160/100`;

function buildGreeting(): ChatMessage {
  return {
    id: 0,
    role: 'bot',
    text:
      'Chào bạn, mình là Anum, trợ lý biên tập của Blog Platform. ' +
      'Mình có thể gợi ý bài viết đáng đọc, kể về các chuyên mục, hoặc hướng dẫn bạn đăng bài. ' +
      'Bạn muốn bắt đầu từ đâu?',
    chips: DEFAULT_CHIPS,
  };
}

function getReply(
  rawInput: string,
  posts: PostItem[],
  categories: Category[],
): ChatMessage {
  const input = rawInput.toLowerCase().trim();
  const byViews = [...posts].sort((a, b) => viewCountOf(b) - viewCountOf(a));
  const newest = [...posts].slice(0, 3);

  const mini = (list: PostItem[]) => (list.length ? { posts: list.slice(0, 3) } : {});

  if (/(chào|hello|hi |hi$|xin chào|alo)/.test(input)) {
    return {
      id: 0,
      role: 'bot',
      text: 'Chào bạn! Hôm nay bạn muốn đọc điều gì? Mình có thể gợi ý theo chuyên mục hoặc những bài đang được đọc nhiều.',
      chips: ['Đọc nhiều nhất', 'Bài viết mới nhất', 'Xem chuyên mục'],
    };
  }

  if (/(đọc nhiều|xem nhiều|hot|nổi bật|thịnh hành|trend)/.test(input)) {
    if (!posts.length) {
      return {
        id: 0,
        role: 'bot',
        text: 'Hiện chưa có bài viết nào được xuất bản để mình xếp hạng. Bạn quay lại sau ít phút nhé!',
      };
    }
    return {
      id: 0,
      role: 'bot',
      text: 'Đây là 3 bài đang được đọc nhiều nhất tuần này:',
      ...mini(byViews),
    };
  }

  if (/(mới nhất|bài mới|vừa đăng|fresh)/.test(input)) {
    if (!posts.length) {
      return {
        id: 0,
        role: 'bot',
        text: 'Trang đang trống trơn, chưa có ấn phẩm mới nào. Bạn là tác giả thì cứ mạnh dạn đăng bài đầu tiên nhé!',
        chips: ['Cách đăng bài'],
      };
    }
    return {
      id: 0,
      role: 'bot',
      text: 'Những ấn phẩm mới nhất vừa lên sóng:',
      ...mini(newest),
    };
  }

  if (/(chuyên mục|chủ đề|category|đề tài)/.test(input)) {
    if (!categories.length) {
      return {
        id: 0,
        role: 'bot',
        text: 'Danh sách chuyên mục đang không tải được. Bạn thử xem toàn bộ bài viết ở trang Khám phá nhé!',
        chips: ['Đọc nhiều nhất'],
      };
    }
    return {
      id: 0,
      role: 'bot',
      text:
        'Blog Platform hiện có ' + categories.length + ' chuyên mục: ' +
        categories.map((c) => c.name).join(', ') +
        '. Bạn bấm vào một chuyên mục để xem toàn bộ bài viết của chuyên mục đó.',
      chips: categories.slice(0, 4).map((c) => 'Bài viết ' + c.name),
    };
  }

  const matchedCat = categories.find(
    (c) => input.includes(c.name.toLowerCase()) || input.includes(c.slug.toLowerCase()),
  );
  if (matchedCat) {
    const inCat = posts.filter((p) => p.categoryId === matchedCat.id || (p as any).category_id === matchedCat.id);
    return {
      id: 0,
      role: 'bot',
      text: inCat.length
        ? 'Chuyên mục "' + matchedCat.name + '" có ' + inCat.length + ' bài viết. Đáng chú ý nhất là:'
        : 'Chuyên mục "' + matchedCat.name + '" chưa có bài nào, nhưng bạn hoàn toàn có thể là người đầu tiên viết bài cho chuyên mục này!',
      ...(inCat.length ? mini(inCat) : { chips: ['Cách đăng bài'] }),
    };
  }

  if (/(viết|đăng bài|đóng góp|đăng ký viết|soạn)/.test(input)) {
    return {
      id: 0,
      role: 'bot',
      text:
        'Đăng bài rất đơn giản: bạn đăng nhập tài khoản, vào Bảng điều khiển rồi chọn "Tạo bài viết mới". ' +
        'Bài viết sẽ qua một vòng kiểm duyệt nhẹ trước khi lên sóng để giữ chất lượng chung của tạp chí.',
      chips: ['Đọc nhiều nhất', 'Bài viết mới nhất'],
    };
  }

  if (/(tài khoản|đăng nhập|đăng ký| mật khẩu)/.test(input)) {
    return {
      id: 0,
      role: 'bot',
      text: 'Bạn cần tài khoản để viết bài và bình luận. Nếu chưa có, trang Đăng ký chỉ mất chưa đến một phút. Còn đã có tài khoản thì đăng nhập thôi!',
      chips: ['Cách đăng bài'],
    };
  }

  if (/(anum|bạn là ai|giới thiệu|robot|ai )/.test(input)) {
    return {
      id: 0,
      role: 'bot',
      text:
        'Mình là Anum, trợ lý biên tập của Blog Platform. Sở trường của mình là ghép đúng bài viết với đúng người đọc, ' +
        'và trả lời các thắc mắc quanh việc xuất bản trên nền tảng. Mình không ngủ trưa, nên cứ hỏi thoải mái!',
      chips: DEFAULT_CHIPS,
    };
  }

  if (/(cảm ơn|thanks|hay lắm|tuyệt)/.test(input)) {
    return {
      id: 0,
      role: 'bot',
      text: 'Rất vui được giúp bạn! Khi cần gợi ý đọc hay hỗ trợ đăng bài, bạn chỉ cần gọi mình nhé.',
      chips: ['Đọc nhiều nhất', 'Bài viết mới nhất'],
    };
  }

  // Fallback: thử dò theo từ khóa trong tiêu đề bài viết
  const keywords = input.split(/\s+/).filter((w) => w.length > 2);
  const hit = keywords.length
    ? posts.filter((p) => keywords.some((k) => p.title.toLowerCase().includes(k)))
    : [];
  if (hit.length) {
    return {
      id: 0,
      role: 'bot',
      text: 'Mình tìm được vài bài viết khớp với ý bạn:',
      ...mini(hit),
    };
  }

  return {
    id: 0,
    role: 'bot',
    text: 'Câu này hơi ngoài chuyên môn của mình. Bạn thử hỏi về bài viết đáng đọc, các chuyên mục, hoặc cách đăng bài nhé!',
    chips: DEFAULT_CHIPS,
  };
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typing, setTyping] = useState(false);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const reduceMotion = useReducedMotion();
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      postApi.getPosts().catch(() => []),
      postApi.getCategories().catch(() => []),
    ]).then(([allPosts, cats]) => {
      if (!alive) return;
      const published = (allPosts || []).filter(
        (p) => (p.status || '').toLowerCase() === 'published',
      );
      setPosts(published);
      setCategories(cats || []);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const pushBotReply = useCallback(
    (userText: string) => {
      setTyping(true);
      const delay = reduceMotion ? 150 : 650 + Math.random() * 450;
      typingTimer.current = setTimeout(() => {
        const reply = getReply(userText, posts, categories);
        setMessages((prev) => [...prev, { ...reply, id: nextId.current++ }]);
        setTyping(false);
      }, delay);
    },
    [posts, categories, reduceMotion],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean || typing) return;
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, role: 'user', text: clean },
      ]);
      setInputValue('');
      pushBotReply(clean);
    },
    [pushBotReply, typing],
  );

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next && !everOpened) {
        setEverOpened(true);
        setMessages([buildGreeting()]);
      }
      return next;
    });
  };

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 380, damping: 30 };

  return (
    <>
      {/* Nút mở chat, né góc phải dưới. Chỉ render sau mount để tránh lệch hydration. */}
      {mounted && (
      <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        <AnimatePresence mode="popLayout">
          {open && (
            <motion.section
              key="anum-panel"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
              transition={spring}
              style={{ transformOrigin: 'bottom right', willChange: 'transform, opacity' }}
              aria-label="Trò chuyện cùng Anum"
              className="flex h-[min(560px,calc(100dvh-8.5rem))] w-[min(384px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-black/20"
            >
              {/* Header */}
              <header className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                <div className="relative">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#a4161a] via-[#7a0f18] to-[#4f060e] text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-500"
                  />
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-sm font-bold text-ink">Anum</p>
                  <p className="mt-0.5 text-[11px] text-muted">Trợ lý biên tập, luôn trực tuyến</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Đóng khung chat"
                  className="grid h-8 w-8 place-items-center rounded-xl text-muted transition hover:bg-raised hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="scroll-slim flex-1 space-y-3 overflow-y-auto px-4 py-4"
              >
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                  >
                    <div className="max-w-[88%]">
                      <div
                        className={
                          msg.role === 'user'
                            ? 'rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-[13px] leading-relaxed text-accent-ink'
                            : 'rounded-2xl rounded-bl-md bg-raised px-3.5 py-2.5 text-[13px] leading-relaxed text-ink'
                        }
                      >
                        {msg.text}
                      </div>

                      {msg.posts && msg.posts.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {msg.posts.map((p) => (
                            <Link
                              key={String(p.id)}
                              href={`/posts/${p.id}`}
                              onClick={() => setOpen(false)}
                              className="group flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2 transition hover:border-accent/40"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={coverOf(p)}
                                alt=""
                                loading="lazy"
                                className="h-11 w-16 shrink-0 rounded-lg object-cover saturate-[.85]"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-[12px] font-semibold text-ink group-hover:text-accent">
                                  {p.title}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-faint">
                                  {viewCountOf(p).toLocaleString('vi-VN')} lượt đọc
                                </span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}

                      {msg.chips && msg.chips.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {msg.chips.map((chip) => (
                            <button
                              key={chip}
                              onClick={() => sendMessage(chip)}
                              className="rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-muted transition hover:border-accent/50 hover:text-accent"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {typing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-raised px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{ animationDelay: `${i * 0.15}s` }}
                          className="animate-typing h-1.5 w-1.5 rounded-full bg-muted"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(inputValue);
                }}
                className="border-t border-line px-3.5 pb-2 pt-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Hỏi Anum bất cứ điều gì..."
                    aria-label="Nhập tin nhắn cho Anum"
                    className="min-w-0 flex-1 rounded-full border border-line bg-canvas px-4 py-2.5 text-[13px] text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || typing}
                    aria-label="Gửi tin nhắn"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#a4161a] via-[#7a0f18] to-[#4f060e] text-white shadow-md shadow-[#a4161a]/30 transition hover:opacity-90 disabled:opacity-40"
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-faint">
                  Anum có thể nhầm lẫn. Bạn hãy kiểm chứng lại thông tin quan trọng.
                </p>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Launcher */}
        <motion.button
          onClick={toggleOpen}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring, delay: reduceMotion ? 0 : 0.8 }}
          whileHover={reduceMotion ? undefined : { scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          aria-label={open ? 'Đóng khung chat Anum' : 'Mở khung chat Anum'}
          className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#a4161a] via-[#7a0f18] to-[#4f060e] text-white shadow-xl shadow-[#a4161a]/35"
        >
          {!open && !everOpened && (
            <span
              aria-hidden
              className="animate-ping-ring absolute inset-0 rounded-full border-2 border-red-500"
            />
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? 'close' : 'open'}
              initial={reduceMotion ? false : { rotate: -60, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { rotate: 60, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid place-items-center"
            >
              {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </motion.span>
          </AnimatePresence>
          {!everOpened && !open && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-ink"
            >
              1
            </span>
          )}
        </motion.button>
      </div>
      )}
    </>
  );
}
