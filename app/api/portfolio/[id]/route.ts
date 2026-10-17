import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseOptionalUrl, readJson } from "@/lib/validation";

// PATCH /api/portfolio/[id] — update a portfolio item
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

    const { id } = await params;
    const item = await prisma.portfolio.findUnique({ where: { id } });
    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    }

    const { title, summary, demoUrl, repoUrl, coverUrl, isPublic } = await readJson(req);
    if (
      (title    !== undefined && (typeof title   !== "string" || !title.trim())) ||
      (summary  !== undefined && (typeof summary !== "string" || !summary.trim())) ||
      (isPublic !== undefined && typeof isPublic !== "boolean")
    ) {
      return NextResponse.json({ error: "Tiêu đề và mô tả không được để trống." }, { status: 400 });
    }
    const demo  = parseOptionalUrl(demoUrl);
    const repo  = parseOptionalUrl(repoUrl);
    const cover = parseOptionalUrl(coverUrl);
    if (demo === undefined || repo === undefined || cover === undefined) {
      return NextResponse.json({ error: "Link không hợp lệ (cần bắt đầu bằng http:// hoặc https://)." }, { status: 400 });
    }

    const updated = await prisma.portfolio.update({
      where: { id },
      data: {
        ...(title   !== undefined && { title:    title.trim() }),
        ...(summary !== undefined && { summary:  summary.trim() }),
        ...(demoUrl !== undefined && { demoUrl:  demo }),
        ...(repoUrl !== undefined && { repoUrl:  repo }),
        ...(coverUrl !== undefined && { coverUrl: cover }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: { project: { select: { id: true, slug: true, title: true, category: true } } },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

// DELETE /api/portfolio/[id] — remove a portfolio item
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

    const { id } = await params;
    const item = await prisma.portfolio.findUnique({ where: { id } });
    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Không tìm thấy." }, { status: 404 });
    }

    await prisma.portfolio.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
