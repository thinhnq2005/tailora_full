// src/services/commentService.ts
import { CommentItem, CommentReply, CommentNotification } from '@/types/comment.types';
import { INITIAL_COMMENTS_MOCK } from '@/mock/commentsData';

const COMMENTS_STORAGE_KEY = 'vlxd_realtime_comments';
const NOTIFICATIONS_STORAGE_KEY = 'vlxd_comment_notifications';

class CommentBroadcastBus {
  private channel: BroadcastChannel | null = null;
  private listeners: ((event: { type: string; payload: any }) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('vlxd_comments_channel');
      this.channel.onmessage = (event) => {
        this.listeners.forEach(cb => cb(event.data));
      };
    }
  }

  subscribe(callback: (event: { type: string; payload: any }) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  broadcast(type: string, payload: any) {
    if (this.channel) {
      this.channel.postMessage({ type, payload });
    }
    // Also dispatch to current window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vlxd-comment-local-event', { detail: { type, payload } }));
    }
  }
}

export const commentBus = new CommentBroadcastBus();

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Lỗi ghi comments localStorage:', e);
  }
}

export const commentService = {
  getComments(targetId?: string, targetType?: 'product' | 'order'): CommentItem[] {
    const all = safeGet<CommentItem[]>(COMMENTS_STORAGE_KEY, INITIAL_COMMENTS_MOCK);
    if (!targetId) return all;
    return all.filter(c => c.targetId === String(targetId) && (!targetType || c.targetType === targetType));
  },

  addComment(params: {
    targetId: string;
    targetType: 'product' | 'order';
    authorName: string;
    authorRole: 'Khách hàng' | 'Thủ kho' | 'Kế toán' | 'Tài xế' | 'Admin';
    content: string;
    authorAvatar?: string;
  }): CommentItem {
    const all = safeGet<CommentItem[]>(COMMENTS_STORAGE_KEY, INITIAL_COMMENTS_MOCK);
    const newComment: CommentItem = {
      id: `cmt-${Date.now()}`,
      targetId: params.targetId,
      targetType: params.targetType,
      authorName: params.authorName || 'Nhân viên kinh doanh',
      authorRole: params.authorRole || 'Khách hàng',
      authorAvatar: params.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${params.authorName || 'user'}`,
      content: params.content,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      replies: []
    };

    const updated = [newComment, ...all];
    safeSet(COMMENTS_STORAGE_KEY, updated);

    // Gửi thông báo realtime qua bus
    commentBus.broadcast('NEW_COMMENT', newComment);

    this.addNotification({
      commentId: newComment.id,
      authorName: newComment.authorName,
      content: newComment.content,
      targetName: `${params.targetType === 'order' ? 'Đơn hàng' : 'Vật tư'} #${params.targetId}`
    });

    return newComment;
  },

  addReply(commentId: string, params: {
    authorName: string;
    authorRole: 'Khách hàng' | 'Thủ kho' | 'Kế toán' | 'Tài xế' | 'Admin';
    content: string;
    authorAvatar?: string;
  }): CommentReply | null {
    const all = safeGet<CommentItem[]>(COMMENTS_STORAGE_KEY, INITIAL_COMMENTS_MOCK);
    const targetIdx = all.findIndex(c => c.id === commentId);
    if (targetIdx === -1) return null;

    const newReply: CommentReply = {
      id: `rep-${Date.now()}`,
      authorName: params.authorName || 'Thủ kho TAILORA',
      authorRole: params.authorRole || 'Thủ kho',
      authorAvatar: params.authorAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${params.authorName || 'staff'}`,
      content: params.content,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByMe: false
    };

    const updatedComment: CommentItem = {
      ...all[targetIdx],
      replies: [...all[targetIdx].replies, newReply]
    };

    all[targetIdx] = updatedComment;
    safeSet(COMMENTS_STORAGE_KEY, all);

    commentBus.broadcast('NEW_REPLY', { commentId, reply: newReply });

    this.addNotification({
      commentId,
      authorName: newReply.authorName,
      content: `Trả lời: ${newReply.content}`,
      targetName: `Thảo luận #${commentId}`
    });

    return newReply;
  },

  toggleLike(commentId: string, isReply: boolean = false, replyId?: string): { likes: number; likedByMe: boolean } {
    const all = safeGet<CommentItem[]>(COMMENTS_STORAGE_KEY, INITIAL_COMMENTS_MOCK);
    let result = { likes: 0, likedByMe: false };

    const updated = all.map(c => {
      if (!isReply && c.id === commentId) {
        const liked = !c.likedByMe;
        const count = liked ? c.likes + 1 : Math.max(0, c.likes - 1);
        result = { likes: count, likedByMe: liked };
        return { ...c, likes: count, likedByMe: liked };
      }
      if (isReply && c.id === commentId && replyId) {
        const newReplies = c.replies.map(r => {
          if (r.id === replyId) {
            const liked = !r.likedByMe;
            const count = liked ? r.likes + 1 : Math.max(0, r.likes - 1);
            result = { likes: count, likedByMe: liked };
            return { ...r, likes: count, likedByMe: liked };
          }
          return r;
        });
        return { ...c, replies: newReplies };
      }
      return c;
    });

    safeSet(COMMENTS_STORAGE_KEY, updated);
    commentBus.broadcast('LIKE_UPDATED', { commentId, isReply, replyId, ...result });
    return result;
  },

  getNotifications(): CommentNotification[] {
    return safeGet<CommentNotification[]>(NOTIFICATIONS_STORAGE_KEY, [
      {
        id: 'notif-1',
        commentId: 'cmt-01',
        authorName: 'Trần Văn Tài (Tài xế)',
        content: 'Đã phản hồi đơn hàng ORD-8821',
        targetName: 'Đơn hàng ORD-8821',
        timestamp: '15 phút trước',
        read: false
      }
    ]);
  },

  addNotification(params: { commentId: string; authorName: string; content: string; targetName: string }) {
    const list = safeGet<CommentNotification[]>(NOTIFICATIONS_STORAGE_KEY, []);
    const newNotif: CommentNotification = {
      id: `notif-${Date.now()}`,
      commentId: params.commentId,
      authorName: params.authorName,
      content: params.content,
      targetName: params.targetName,
      timestamp: 'Vừa xong',
      read: false
    };
    safeSet(NOTIFICATIONS_STORAGE_KEY, [newNotif, ...list.slice(0, 19)]);
  },

  markNotificationsRead() {
    const list = safeGet<CommentNotification[]>(NOTIFICATIONS_STORAGE_KEY, []);
    safeSet(NOTIFICATIONS_STORAGE_KEY, list.map(n => ({ ...n, read: true })));
  }
};
