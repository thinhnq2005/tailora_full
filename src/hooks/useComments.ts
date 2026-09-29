// src/hooks/useComments.ts
import { useState, useEffect, useCallback } from 'react';
import { CommentItem, CommentNotification } from '@/types/comment.types';
import { commentService, commentBus } from '@/services/commentService';

export function useComments(targetId: string, targetType: 'product' | 'order' = 'product') {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [notifications, setNotifications] = useState<CommentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    const list = commentService.getComments(targetId, targetType);
    const notifs = commentService.getNotifications();
    setComments(list);
    setNotifications(notifs);
    setLoading(false);
  }, [targetId, targetType]);

  useEffect(() => {
    loadData();

    // Lắng nghe qua BroadcastChannel bus
    const unsubscribe = commentBus.subscribe(() => {
      loadData();
    });

    // Lắng nghe qua Window event
    const handleLocal = () => loadData();
    window.addEventListener('vlxd-comment-local-event', handleLocal);
    window.addEventListener('storage', (e) => {
      if (e.key === 'vlxd_realtime_comments') loadData();
    });

    return () => {
      unsubscribe();
      window.removeEventListener('vlxd-comment-local-event', handleLocal);
    };
  }, [loadData]);

  const addComment = (content: string, authorName?: string, authorRole?: any) => {
    if (!content.trim()) return;
    commentService.addComment({
      targetId,
      targetType,
      authorName: authorName || 'Khách hàng',
      authorRole: authorRole || 'Khách hàng',
      content: content.trim()
    });
    loadData();
  };

  const addReply = (commentId: string, content: string, authorName?: string, authorRole?: any) => {
    if (!content.trim()) return;
    commentService.addReply(commentId, {
      authorName: authorName || 'Thủ kho TAILORA',
      authorRole: authorRole || 'Thủ kho',
      content: content.trim()
    });
    loadData();
  };

  const toggleLike = (commentId: string, isReply: boolean = false, replyId?: string) => {
    commentService.toggleLike(commentId, isReply, replyId);
    loadData();
  };

  return {
    comments,
    notifications,
    unreadNotificationCount: notifications.filter(n => !n.read).length,
    addComment,
    addReply,
    toggleLike,
    markNotificationsRead: () => {
      commentService.markNotificationsRead();
      loadData();
    },
    loading
  };
}
