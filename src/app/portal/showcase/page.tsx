'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/app/context/TenantContext';
// ️ BỐC HÀM LẤY ẢNH CÔNG TRÌNH TĨNH TỪ IMAGEHELPER
import { getShowcaseImageUrl } from '@/utils/imageHelper';

interface Project {
  id: string;
  name: string;
}

export default function ShowcasePage() {
  const router = useRouter();
  const { tenant } = useTenant();
  
  // Gán cứng 100% dữ liệu danh sách công trình theo tên chuẩn Odoo để helper map ảnh tự động
  const [projects] = useState<Project[]>([
    { id: '1', name: 'Đại học FPT Cần Thơ' },
    { id: '2', name: 'Trường Đại học Nam Cần Thơ' },
    { id: '3', name: 'Căn hộ cao cấp Cara River Park' },
    { id: '4', name: 'Bệnh viện chấn thương chỉnh hình trung ương Cần Thơ' },
    { id: '5', name: 'Bệnh viện Nhi đồng' },
    { id: '6', name: 'Khách sạn Wink' },
    { id: '7', name: 'Học viện Chính trị khu vực IV' },
    { id: '8', name: 'Khách sạn Mường Thanh' },
    { id: '9', name: 'Bệnh viện Đại học Nam Cần Thơ' }
  ]);

  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '90px 12px 40px 12px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', backgroundColor: '#ffffff', borderTop: `4px solid ${themeColor}`, borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <button 
              onClick={() => router.push('/')}
              style={{ background: 'none', border: 'none', color: themeColor, fontSize: '14px', fontWeight: '700', cursor: 'pointer', padding: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>←</span> Trở về trang chủ
            </button>
          </div>
          
          <div>
            <h1 style={{ fontSize: 'calc(18px + 0.5vw)', fontWeight: '900', color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              CÔNG TRÌNH TIÊU BIỂU
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', fontWeight: '600', lineHeight: '1.4' }}>
              Danh sách các dự án hạ tầng và công trình xây dựng sử dụng nguồn vật tư cung ứng trọng điểm.
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '14px', fontFamily: 'monospace' }}>
            Hiện chưa có dữ liệu công trình tiêu biểu từ bến bãi.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
            {projects.map((project) => {
              // ️ CHỌC THẲNG VÀO HÀM ĐỂ BỐC ĐƯỜNG DẪN ẢNH TĨNH THEO TÊN CÔNG TRÌNH
              const computedShowcaseImg = getShowcaseImageUrl(project.name);
              return (
                <div 
                  key={project.id} 
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                >
                  <div style={{ width: '100%', height: '200px', backgroundColor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={computedShowcaseImg} 
                      alt={project.name} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="%23cbd5e1">CHƯA CẬP NHẬT ẢNH CÔNG TRÌNH</text></svg>';
                      }}
                    />
                  </div>
                  <div style={{ padding: '16px', boxSizing: 'border-box' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#000000', margin: 0, lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.name}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}