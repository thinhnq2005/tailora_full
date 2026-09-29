// src/types/comment.types.ts

export interface CommentReply {
  id: string;
  authorName: string;
  authorRole: 'Khách hàng' | 'Thủ kho' | 'Kế toán' | 'Tài xế' | 'Admin';
  authorAvatar: string;
  content: string;
  createdAt: string; // ISO string
  likes: number;
  likedByMe?: boolean;
}

export interface CommentItem {
  id: string;
  targetId: string; // productId hoặc orderId
  targetType: 'product' | 'order';
  authorName: string;
  authorRole: 'Khách hàng' | 'Thủ kho' | 'Kế toán' | 'Tài xế' | 'Admin';
  authorAvatar: string;
  content: string;
  createdAt: string; // ISO string
  likes: number;
  likedByMe?: boolean;
  replies: CommentReply[];
}

export interface CommentNotification {
  id: string;
  commentId: string;
  authorName: string;
  content: string;
  targetName: string;
  timestamp: string;
  read: boolean;
}
