'use client';

import React, { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { MessageSquare, Heart, CornerDownRight, Bell, Send } from 'lucide-react';

interface CommentSectionProps {
  targetId: string;
  targetType?: 'product' | 'order';
  title?: string;
}

export default function CommentSection({
  targetId,
  targetType = 'product',
  title = 'Thảo luận & Ghi chú nội bộ'
}: CommentSectionProps) {
  const {
    comments,
    notifications,
    unreadNotificationCount,
    addComment,
    addReply,
    toggleLike,
    markNotificationsRead
  } = useComments(targetId, targetType);

  const [newContent, setNewContent] = useState('');
  const [authorName, setAuthorName] = useState('Trần Minh Phát');
  const [authorRole, setAuthorRole] = useState<'Khách hàng' | 'Thủ kho' | 'Kế toán' | 'Tài xế' | 'Admin'>('Khách hàng');

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    addComment(newContent, authorName, authorRole);
    setNewContent('');
  };

  const handlePostReply = (commentId: string) => {
    if (!replyContent.trim()) return;
    addReply(commentId, replyContent, authorName, authorRole);
    setReplyContent('');
    setReplyingToId(null);
  };

  const formatTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* HEADER SECTION & NOTIFICATION BELL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color="#0f172a" />
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
            {title} ({comments.length})
          </h4>
          <span style={{ fontSize: '10.5px', backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
            ● Realtime
          </span>
        </div>

        {/* NÚT THÔNG BÁO */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) markNotificationsRead();
            }}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#475569' }}
            title="Xem thông báo trao đổi mới"
          >
            <Bell size={16} />
            {unreadNotificationCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                width: '8px',
                height: '8px',
                backgroundColor: '#ef4444',
                borderRadius: '50%'
              }} />
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '28px',
              width: '280px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 50,
              padding: '12px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>
                Thông báo trao đổi gần đây:
              </div>
              {notifications.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Chưa có thông báo mới.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {notifications.map((n) => (
                    <div key={n.id} style={{ fontSize: '11px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      <strong>{n.authorName}</strong>: {n.content}
                      <div style={{ color: '#94a3b8', fontSize: '10px' }}>{n.timestamp}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FORM GỬI BÌNH LUẬN MỚI */}
      <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Chọn danh tính người viết (ERP simulation) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600' }}>Đăng bởi:</span>
          <select
            value={authorRole}
            onChange={(e) => {
              const role = e.target.value as any;
              setAuthorRole(role);
              if (role === 'Khách hàng') setAuthorName('Trần Minh Phát');
              if (role === 'Thủ kho') setAuthorName('Lê Hoàng Minh (Thủ kho)');
              if (role === 'Kế toán') setAuthorName('Trần Anh Thư (Kế toán)');
              if (role === 'Tài xế') setAuthorName('Trần Văn Tài (Tài xế)');
              if (role === 'Admin') setAuthorName('Admin Bến Bãi');
            }}
            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11.5px', backgroundColor: '#f8fafc' }}
          >
            <option value="Khách hàng">Khách hàng (Trần Minh Phát)</option>
            <option value="Thủ kho">Thủ kho (Lê Hoàng Minh)</option>
            <option value="Kế toán">Kế toán (Trần Anh Thư)</option>
            <option value="Tài xế">Tài xế (Trần Văn Tài)</option>
            <option value="Admin">Admin Điều phối</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Nhập nội dung ghi chú, đối chiếu tải trọng hoặc phản hồi..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Send size={12} />
            <span>Gửi</span>
          </button>
        </div>
      </form>

      {/* DANH SÁCH BÌNH LUẬN & TRẢ LỜI ĐA CẤP */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '12px' }}>
            Chưa có ghi chú hoặc thảo luận nào cho mục này.
          </div>
        ) : (
          comments.map((cmt) => (
            <div key={cmt.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #f8fafc', paddingBottom: '12px' }}>
              
              {/* Comment gốc */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <img
                  src={cmt.authorAvatar}
                  alt={cmt.authorName}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', flexShrink: 0 }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>{cmt.authorName}</strong>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: cmt.authorRole === 'Khách hàng' ? '#e0f2fe' : cmt.authorRole === 'Thủ kho' ? 'var(--theme-color-15)' : '#dcfce7',
                      color: cmt.authorRole === 'Khách hàng' ? '#0369a1' : cmt.authorRole === 'Thủ kho' ? '#92400e' : '#166534'
                    }}>
                      {cmt.authorRole}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {formatTimeAgo(cmt.createdAt)}</span>
                  </div>

                  <p style={{ margin: '4px 0 6px 0', fontSize: '12.5px', color: '#334155', lineHeight: '1.4' }}>
                    {cmt.content}
                  </p>

                  {/* Cụm Thao tác: Like & Reply */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px' }}>
                    <button
                      type="button"
                      onClick={() => toggleLike(cmt.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: cmt.likedByMe ? '#ef4444' : '#64748b',
                        fontWeight: '600'
                      }}
                    >
                      <Heart size={12} fill={cmt.likedByMe ? '#ef4444' : 'none'} />
                      <span>{cmt.likes > 0 ? cmt.likes : 'Thích'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyingToId(replyingToId === cmt.id ? null : cmt.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', fontWeight: '600' }}
                    >
                      Trả lời
                    </button>
                  </div>
                </div>
              </div>

              {/* Ô nhập Reply nếu đang mở */}
              {replyingToId === cmt.id && (
                <div style={{ marginLeft: '42px', display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="text"
                    placeholder={`Trả lời ${cmt.authorName}...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handlePostReply(cmt.id)}
                    style={{ padding: '6px 12px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Gửi
                  </button>
                </div>
              )}

              {/* Danh sách các câu trả lời (Replies) */}
              {cmt.replies && cmt.replies.length > 0 && (
                <div style={{ marginLeft: '42px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', borderLeft: '2px solid #f1f5f9', paddingLeft: '12px' }}>
                  {cmt.replies.map((rep) => (
                    <div key={rep.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <CornerDownRight size={12} color="#94a3b8" style={{ marginTop: '4px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '12px', color: '#0f172a' }}>{rep.authorName}</strong>
                          <span style={{ fontSize: '9.5px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                            {rep.authorRole}
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>• {formatTimeAgo(rep.createdAt)}</span>
                        </div>
                        <p style={{ margin: '2px 0', fontSize: '12px', color: '#334155' }}>
                          {rep.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))
        )}
      </div>

    </div>
  );
}
