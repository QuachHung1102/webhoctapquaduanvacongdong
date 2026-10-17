/**
 * app/api/users/me/change-password/route.ts
 * POST — đổi mật khẩu cho user hiện tại.
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { passwordError, readJson } from "@/lib/validation";

export async function POST(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { currentPassword, newPassword } = await readJson(req);

  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
    return NextResponse.json({ error: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới." }, { status: 400 });
  }
  const invalid = passwordError(newPassword);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Tài khoản này không có mật khẩu (đăng nhập qua OAuth)." }, { status: 400 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: sessionUser.id },
    data:  { passwordHash: hashed },
  });

  return NextResponse.json({ ok: true });
}
