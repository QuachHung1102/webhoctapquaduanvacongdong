import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseOptionalUrl, readJson, text } from "@/lib/validation";

// GET /api/portfolio — list current user's portfolio items (all, including private)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const items = await prisma.portfolio.findMany({
    where: { userId: session.user.id },
    include: { project: { select: { id: true, slug: true, title: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

// POST /api/portfolio — create a new portfolio item
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    const userId = session.user.id;

    const body = await readJson(req);
    const projectId = text(body.projectId);
    const title     = text(body.title);
    const summary   = text(body.summary);
    if (!projectId || !title || !summary) {
      return NextResponse.json({ error: "projectId, title và summary là bắt buộc." }, { status: 400 });
    }

    const demoUrl  = parseOptionalUrl(body.demoUrl);
    const repoUrl  = parseOptionalUrl(body.repoUrl);
    const coverUrl = parseOptionalUrl(body.coverUrl);
    if (demoUrl === undefined || repoUrl === undefined || coverUrl === undefined) {
      return NextResponse.json({ error: "Link không hợp lệ (cần bắt đầu bằng http:// hoặc https://)." }, { status: 400 });
    }
    const isPublic = body.isPublic !== false;

    // Verify user was a member of the project, or is its mentor
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { mentorId: true, members: { where: { userId }, select: { id: true } } },
    });
    if (!project) {
      return NextResponse.json({ error: "Dự án không tồn tại." }, { status: 404 });
    }
    if (project.mentorId !== userId && project.members.length === 0) {
      return NextResponse.json({ error: "Bạn không là thành viên của dự án này." }, { status: 403 });
    }

    const data = { title, summary, demoUrl, repoUrl, coverUrl, isPublic };
    const item = await prisma.portfolio.upsert({
      where: { userId_projectId: { userId, projectId } },
      update: data,
      create: { userId, projectId, ...data },
      include: { project: { select: { id: true, slug: true, title: true, category: true } } },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
