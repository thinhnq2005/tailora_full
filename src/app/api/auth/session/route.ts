import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("server_session_id");
    const profileCookie = cookieStore.get("user_profile");

    if (!sessionCookie || !profileCookie) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = JSON.parse(profileCookie.value);
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("server_session_id");
    cookieStore.delete("user_profile");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}