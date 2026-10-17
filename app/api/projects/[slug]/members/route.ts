/**
 * app/api/projects/[slug]/members/route.ts
 * DELETE — mentor kick member hoặc member tự rời dự án.
 * Body: { userId } — userId của người bị kick / người rời.
 */
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { readJson } from "@/lib/validation";

type Params = { params: Promise<{ slug: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { slug } = await params;
  const { userId } = await readJson(req);

  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, mentorId: true, status: true },
  });
  if (!project) return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });

  const isMentor  = project.mentorId === session.user.id;
  const isAdmin   = session.user.role === "ADMIN";
  const isSelf    = userId === session.user.id;

  // Only mentor/admin can kick others; anyone can leave themselves
  if (!isSelf && !isMentor && !isAdmin) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }
  // Mentor cannot be kicked (they own the project)
  if (userId === project.mentorId) {
    return NextResponse.json({ error: "Không thể xoá mentor khỏi dự án." }, { status: 400 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId } },
    select: { id: true },
  });
  if (!member) return NextResponse.json({ error: "Người này không phải thành viên." }, { status: 404 });

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId: project.id, userId } },
  });

  // Notify
  if (!isSelf) {
    // Kicked — notify the kicked user
    await createNotification({
      userId,
      // shortcut: NotificationType has no MEMBER_REMOVED value, so MENTION is reused; add a dedicated enum value with the next schema migration.
      type:    "MENTION",
      title:   "Bạn đã bị xoá khỏi dự án",
      message: `Bạn không còn là thành viên của dự án "${project.title}"`,
      link:    `/projects/${project.slug}`,
    });
  }

  return NextResponse.json({ ok: true });
}
