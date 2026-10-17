/**
 * app/api/admin/badges/route.ts
 * GET  — danh sách tất cả badges
 * POST — tạo badge mới (ADMIN only)
 */
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseOptionalUrl, readJson, text } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }

  const badges = await prisma.badge.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { userBadges: true } } },
  });

  return NextResponse.json(badges);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }

    const body = await readJson(req);
    const name        = text(body.name);
    const description = text(body.description);
    if (!name || !description) {
      return NextResponse.json({ error: "Tên và mô tả badge là bắt buộc." }, { status: 400 });
    }
    const iconUrl = parseOptionalUrl(body.iconUrl);
    if (iconUrl === undefined) {
      return NextResponse.json({ error: "Link icon không hợp lệ (cần bắt đầu bằng http:// hoặc https://)." }, { status: 400 });
    }

    const badge = await prisma.badge.create({ data: { name, description, iconUrl } });

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Đã có badge trùng tên." }, { status: 409 });
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
