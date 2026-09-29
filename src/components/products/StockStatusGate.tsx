// "use client";

// import React from "react";

// interface StockStatusProps {
//   stockInventory?: Record<string, number>;
// }

// export default function StockStatusGate({ stockInventory }: StockStatusProps): React.JSX.Element {
//   // Kiểm tra xem Odoo có thực sự trả về mảng dữ liệu bến bãi phân rã hay không
//   const hasValidInventory = stockInventory && Object.keys(stockInventory).length > 0;

//   const bãiNinhKieu = stockInventory?.["Bãi 1: Ninh Kiều"];
//   const bãiCaiRang = stockInventory?.["Bãi 2: Cái Răng"];
  
//   // Tính tổng tồn kho nếu có dữ liệu hợp lệ
//   const tongTon = (bãiNinhKieu ?? 0) + (bãiCaiRang ?? 0);

//   return (
//     <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
//       <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
//         <span style={{ 
//           width: "10px", 
//           height: "10px", 
//           borderRadius: "50%", 
//           backgroundColor: !hasValidInventory ? "#3b82f6" : (tongTon > 0 ? "#10b981" : "#ef4444") 
//         }}></span>
//         <span style={{ fontSize: "13px", fontWeight: "900", color: "#000000", textTransform: "uppercase", letterSpacing: "0.5px" }}>
//           Trạng thái tồn bãi
//         </span>
//       </div>
      
//       {hasValidInventory ? (
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
//           {bãiNinhKieu !== undefined && (
//             <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", borderLeft: "4px solid var(--theme-color, var(--theme-color))" }}>
//               <div style={{ fontSize: "11px", color: "#475569", fontWeight: "700" }}>Bãi 1: Ninh Kiều</div>
//               <div style={{ fontSize: "18px", fontWeight: "900", color: "#000000", fontFamily: "monospace", marginTop: "4px" }}>
//                 {bãiNinhKieu.toLocaleString("vi-VN")}
//               </div>
//             </div>
//           )}
//           {bãiCaiRang !== undefined && (
//             <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", borderLeft: "4px solid var(--theme-color, var(--theme-color))" }}>
//               <div style={{ fontSize: "11px", color: "#475569", fontWeight: "700" }}>Bãi 2: Cái Răng</div>
//               <div style={{ fontSize: "18px", fontWeight: "900", color: "#000000", fontFamily: "monospace", marginTop: "4px" }}>
//                 {bãiCaiRang.toLocaleString("vi-VN")}
//               </div>
//             </div>
//           )}
//         </div>
//       ) : (
//         // Khối hiển thị thu gọn chuẩn chỉ khi Odoo chưa cấu hình tồn kho - Không tự bịa số lượng
//         <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
//           <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", borderLeft: "4px solid var(--theme-color, var(--theme-color))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <div>
//               <div style={{ fontSize: "12px", color: "#475569", fontWeight: "700" }}>Bến bãi phân phối:</div>
//               <div style={{ fontSize: "15px", fontWeight: "900", color: "#000000", marginTop: "2px" }}>Cần Thơ</div>
//             </div>
//             <div style={{ fontSize: "12px", color: "#475569", fontWeight: "700", backgroundColor: "#e2e8f0", padding: "6px 12px", borderRadius: "6px" }}>
//               Liên hệ chủ bãi
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }