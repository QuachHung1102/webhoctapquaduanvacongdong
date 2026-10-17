/**
 * app/api/admin/badges/award/route.ts
 * POST — trao badge cho user (ADMIN only)
 * Body: { badgeId, userId }
 */
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { readJson } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const { badgeId, userId } = await readJson(req);
  if (typeof badgeId !== "string" || typeof userId !== "string" || !badgeId || !userId) {
    return NextResponse.json({ error: "Thiếu badgeId hoặc userId." }, { status: 400 });
  }

  // Kiểm tra tồn tại
  const [badge, user] = await Promise.all([
    prisma.badge.findUnique({ where: { id: badgeId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
  ]);
  if (!badge) return NextResponse.json({ error: "Badge không tồn tại." }, { status: 404 });
  if (!user)  return NextResponse.json({ error: "User không tồn tại." }, { status: 404 });

  const userBadge = await prisma.userBadge.upsert({
    where:  { userId_badgeId: { userId, badgeId } },
    update: {},                              // đã có → không làm gì
    create: { userId, badgeId },
  });

  return NextResponse.json({ ...userBadge, badge, user });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const { badgeId, userId } = await readJson(req);
  if (typeof badgeId !== "string" || typeof userId !== "string" || !badgeId || !userId) {
    return NextResponse.json({ error: "Thiếu badgeId hoặc userId." }, { status: 400 });
  }

  await prisma.userBadge.deleteMany({ where: { badgeId, userId } });
  return NextResponse.json({ ok: true });
}
