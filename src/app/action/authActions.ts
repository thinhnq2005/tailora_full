'use server';

import { cookies } from "next/headers";

export async function clearSessionAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("server_session_id");
    cookieStore.delete("user_profile");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function checkActiveSessionAction() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("server_session_id");
    const profile = cookieStore.get("user_profile");

    if (!session || !profile) {
      return { authenticated: false, user: null };
    }

    return {
      authenticated: true,
      user: JSON.parse(profile.value)
    };
  } catch {
    return { authenticated: false, user: null };
  }
}