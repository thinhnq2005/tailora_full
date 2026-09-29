import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");

        // Nếu Google trả về lỗi trên URL query
        if (errorParam || !code) {
            return new NextResponse(
                `<html><body><script>
          window.opener.postMessage({ source: "google-oauth-error", error: "Xác thực bị hủy hoặc không tìm thấy mã code từ Google" }, "*");
          window.close();
        </script></body></html>`,
                { headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
        }

        const clientId = process.env.GOOGLE_CLIENT_ID || "952749144152-7ibsjm2f0ke0o1nlvoe74qba9mkm5os2.apps.googleusercontent.com";
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "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";
        
        // Chuẩn hóa redirectUri động theo sát URL gốc hệ thống đang chạy
        const requestUrl = new URL(request.url);
        const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || `${requestUrl.origin}/api/auth/google/callback`;

        // Gọi sang Google API đổi mã code lấy token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text().catch(() => "Không rõ");
            console.error("============= [GOOGLE OAUTH ERROR] =============");
            console.error("Chi tiết lỗi từ Google API:", errorText);
            console.error("Redirect URI gửi lên:", redirectUri);
            console.error("================================================");
            
            return new NextResponse(
                `<html><body><script>
          window.opener.postMessage({ source: "google-oauth-error", error: "Lỗi xác thực mã token với Google API (Kiểm tra Log Vercel)" }, "*");
          window.close();
        </script></body></html>`,
                { headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Sử dụng access_token lấy thông tin Email từ Google
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
            return new NextResponse(
                `<html><body><script>
          window.opener.postMessage({ source: "google-oauth-error", error: "Không thể truy xuất thông tin tài khoản từ Google" }, "*");
          window.close();
        </script></body></html>`,
                { headers: { "Content-Type": "text/html; charset=utf-8" } }
            );
        }

        const userData = await userResponse.json();
        const email = userData.email;

        return new NextResponse(
            `<html>
        <body>
          <h3 style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #1e293b;">
            Xác thực tài khoản thành công! Đang đồng bộ hóa dữ liệu bến bãi...
          </h3>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                source: "google-oauth-success", 
                email: "${email}" 
              }, "*");
            }
            window.close();
          </script>
        </body>
      </html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
        );

    } catch (error: any) {
        console.error("[OAUTH CALLBACK EXCEPTION]:", error?.message || error);
        return new NextResponse(
            `<html><body><script>
        window.opener.postMessage({ source: "google-oauth-error", error: "Lỗi xử lý luồng Callback mạng nội bộ" }, "*");
        window.close();
      </script></body></html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
    }
}