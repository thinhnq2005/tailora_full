// src/mock/commentsData.ts
import { CommentItem } from '@/types/comment.types';

export const INITIAL_COMMENTS_MOCK: CommentItem[] = [
  {
    id: 'cmt-01',
    targetId: 'ORD-8821',
    targetType: 'order',
    authorName: 'Trần Minh Phát',
    authorRole: 'Khách hàng',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Phat',
    content: 'Tài xế giao tới nhớ gọi trước 15 phút để cai thầu mở cổng bãi công trình nhé.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    likes: 3,
    likedByMe: false,
    replies: [
      {
        id: 'rep-01',
        authorName: 'Trần Văn Tài',
        authorRole: 'Tài xế',
        authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Tai',
        content: 'Dạ anh Phát, em vừa cân niêm phong xong xe 65C-123.45, đang qua cầu Quang Trung ghé anh liền.',
        createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        likes: 2,
        likedByMe: true
      },
      {
        id: 'rep-02',
        authorName: 'Lê Hoàng Minh',
        authorRole: 'Thủ kho',
        authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Minh',
        content: 'Xe ben số 1 đã chốt cân 7,850 kg và kẹp tem chì SEAL-LP-4421 rồi anh nhé. Anh kiểm tra đối chiếu khi xe đến.',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        likes: 1,
        likedByMe: false
      }
    ]
  },
  {
    id: 'cmt-02',
    targetId: '54', // Xi măng Vicem Hà Tiên PCB40
    targetType: 'product',
    authorName: 'Kỹ sư Hoàng Nam',
    authorRole: 'Khách hàng',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nam',
    content: 'Xi măng đợt này date sản xuất mới không em? Công trình dầm sàn yêu cầu chứng chỉ CQ mẻ mới nhất.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    likes: 4,
    likedByMe: false,
    replies: [
      {
        id: 'rep-03',
        authorName: 'Trần Anh Thư',
        authorRole: 'Kế toán',
        authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Thu',
        content: 'Dạ lô này nhà máy Kiên Lương vừa xuất xưởng tuần trước, phiếu xuất xưởng và kết quả nén mẫu 3 ngày 7 ngày đã đính kèm trên mục Tài liệu kỹ thuật rồi anh!',
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        likes: 3,
        likedByMe: true
      }
    ]
  },
  {
    id: 'cmt-03',
    targetId: '45', // Thép cây D10 Hòa Phát
    targetType: 'product',
    authorName: 'Cai thầu Ba Hưng',
    authorRole: 'Khách hàng',
    authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Hung',
    content: 'Thép cây bên mình giao có hỗ trợ xe cẩu hạ hàng xuống tầng hầm không?',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    likes: 2,
    likedByMe: false,
    replies: [
      {
        id: 'rep-04',
        authorName: 'Lê Hoàng Đức',
        authorRole: 'Tài xế',
        authorAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Duc',
        content: 'Dạ bên em có xe cẩu tự hành 10 tấn vươn cần 12m, hạ sát mép hầm công trình theo yêu cầu của anh được luôn ạ.',
        createdAt: new Date(Date.now() - 3600000 * 40).toISOString(),
        likes: 5,
        likedByMe: true
      }
    ]
  }
];
