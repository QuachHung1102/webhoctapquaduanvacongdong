import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Lấy session hiện tại (Server Component / Route Handler).
 * Trả về null nếu chưa đăng nhập.
 */
export async function getSession() {
  return await auth();
}

/**
 * Lấy user hiện tại.
 * Trả về null nếu chưa đăng nhập.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Yêu cầu đăng nhập — dùng trong Server Components / page.tsx protected.
 * Redirect về /login nếu chưa đăng nhập.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Yêu cầu quyền MENTOR hoặc ADMIN.
 * Redirect về /dashboard nếu không đủ quyền.
 */
export async function requireMentor() {
  const user = await requireAuth();
  if (user.role !== "MENTOR" && user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}
