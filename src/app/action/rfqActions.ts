"use server";

export interface RfqItem {
  productId: string;
  quantity: number;
  requestedPrice?: number;
}

export interface RfqFormData {
  customerName: string;
  companyName?: string;
  email: string;
  phone: string;
  notes?: string;
  items: RfqItem[];
}


export async function submitRfqAction(formData: RfqFormData) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/rfq/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Gửi yêu cầu báo giá thất bại.",
      };
    }

    return {
      success: true,
      orderId: result.orderId,
      message: result.message || "Yêu cầu báo giá sỉ của bạn đã được tiếp nhận thành công.",
    };
  } catch (error) {
    return {
      success: false,
      error: "Đã xảy ra lỗi kết nối trong quá trình gửi yêu cầu.",
    };
  }
}