'use server';

export async function getTenantConfigAction(domain: string) {
  return {
    id: 1,
    subdomain: 'tailoratech',
    custom_domain: 'vlxdtailoratech.vn',
    brand_name: 'ERP TAILORA TECH',
    phone: '0907.123.456',
    email: 'tailoratech@gmail.com',
    logo_url: '/lpdata/logo.png',
    primary_color: '#1e3a8a',
    homepage_banners: ['/lpdata/banner/banner1.jpg', '/lpdata/banner/banner2.png'],
    about_us_short: 'Đại lý phân phối Cát Đá Xi Măng Sắt Thép uy tín số 1 Cần Thơ.',
    about_us_full: 'Với hơn 15 năm kinh nghiệm phục vụ các công trình trọng điểm tại Cần Thơ và Đồng Bằng Sông Cửu Long.',
    footer_copyright: ' 2026 ERP TAILORA TECH - Bến Bãi Cần Thơ',
    footer_description: 'Chuyên cung ứng vật tư xây dựng thô và hoàn thiện cho nhà thầu, chủ đầu tư.',
    zalo_oa_url: 'https://zalo.me/0907123456',
    facebook_page_url: 'https://www.facebook.com/share/1DVf7316r1/?mibextid=wwXIfr',
    youtube_channel_url: 'https://www.facebook.com/share/1DVf7316r1/?mibextid=wwXIfr',
    hotline_support: '0907.123.456',
    email_support: 'tailoratech@gmail.com',
    office_address: 'Bến bãi ERP TAILORA TECH, Bờ Kè Sông Hậu, Ninh Kiều, Cần Thơ',
    business_hours: '06:30 - 18:00 (Thứ 2 - Chủ Nhật)',
    payment_bank_info: {
      bank_name: 'MBBank',
      account_number: '0907123456',
      account_holder: 'DOANH NGHIEP TU NHAN VLXD TAILORA'
    },
    vat: '1801234567'
  };
}