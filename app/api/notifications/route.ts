import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "@/lib/queries/dashboard";
import { prisma } from "@/lib/db";
import { readJson } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isInteger(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 20;

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(sessionUser.id, { unreadOnly, limit }),
    getUnreadNotificationCount(sessionUser.id),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await readJson(req);
  if (typeof body.id === "string" && body.id) {
    // Mark single notification read (only if it belongs to the user)
    await prisma.notification.updateMany({
      where: { id: body.id, userId: sessionUser.id },
      data: { isRead: true },
    });
  } else {
    await markAllNotificationsRead(sessionUser.id);
  }
  return NextResponse.json({ ok: true });
}
