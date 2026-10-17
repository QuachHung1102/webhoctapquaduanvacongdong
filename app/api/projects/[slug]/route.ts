/**
 * app/api/projects/[slug]/route.ts
 * GET   — chi tiết dự án theo slug (public)
 * PATCH — cập nhật trạng thái / thông tin dự án (mentor hoặc ADMIN)
 */
import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectStatus, type NotificationType } from "@/app/generated/prisma/client";
import { createNotifications } from "@/lib/notifications";
import { canManageProject } from "@/lib/permissions";
import { statusDates } from "@/lib/queries/project";
import { getCurrentUser } from "@/lib/session";
import { isOneOf, parseOptionalUrl, readJson } from "@/lib/validation";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    // Route này public (không cần đăng nhập): không trả peer review hay danh sách task.
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        mentor: { select: { id: true, name: true, avatarUrl: true, bio: true } },
        skills: { include: { skill: true } },
        members: {
          where: { isActive: true },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        },
        sprints: { orderBy: { startDate: "asc" } },
        _count: { select: { applications: true, members: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

/** Thông báo gửi cho thành viên khi dự án chuyển sang từng trạng thái. */
const STATUS_NOTIFICATIONS: Partial<Record<ProjectStatus, {
  type:    NotificationType;
  title:   string;
  message: (projectTitle: string) => string;
  path:    string; // nối sau /dashboard/projects/[slug]
}>> = {
  COMPLETED: {
    type:    "PROJECT_COMPLETED",
    title:   "Dự án đã hoàn thành",
    message: (t) => `"${t}" đã được đánh dấu hoàn thành. Hãy để lại đánh giá cho nhau nhé!`,
    path:    "/reviews",
  },
  IN_PROGRESS: {
    type:    "SPRINT_STARTED",
    title:   "Dự án đã bắt đầu!",
    message: (t) => `"${t}" chính thức khởi động. Vào Kanban để nhận task ngay!`,
    path:    "",
  },
  // shortcut: NotificationType has no REVIEWING/CANCELLED value, so MENTION is reused; add dedicated enum values with the next schema migration.
  REVIEWING: {
    type:    "MENTION",
    title:   "Dự án chuyển sang giai đoạn review",
    message: (t) => `"${t}" đang ở giai đoạn review cuối. Hãy nộp sản phẩm và đánh giá đồng đội.`,
    path:    "/reviews",
  },
  CANCELLED: {
    type:    "MENTION",
    title:   "Dự án đã bị huỷ",
    message: (t) => `Dự án "${t}" đã bị huỷ.`,
    path:    "",
  },
};

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const { slug } = await params;
    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true, mentorId: true, status: true, startDate: true },
    });

    if (!project) return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });

    if (!canManageProject(user, project)) {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }

    const { status, title, description, outputGoal, coverImageUrl, outputUrl } = await readJson(req);

    if (status !== undefined && !isOneOf(ProjectStatus, status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }
    if (
      (title !== undefined && (typeof title !== "string" || !title.trim())) ||
      (description !== undefined && (typeof description !== "string" || !description.trim())) ||
      (outputGoal !== undefined && typeof outputGoal !== "string")
    ) {
      return NextResponse.json({ error: "Thông tin dự án không hợp lệ." }, { status: 400 });
    }
    const coverUrl = parseOptionalUrl(coverImageUrl);
    const output   = parseOptionalUrl(outputUrl);
    if (coverUrl === undefined || output === undefined) {
      return NextResponse.json({ error: "URL không hợp lệ." }, { status: 400 });
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(status         !== undefined && { status, ...statusDates(status, project) }),
        ...(title          !== undefined && { title }),
        ...(description    !== undefined && { description }),
        ...(outputGoal     !== undefined && { outputGoal }),
        ...(coverImageUrl  !== undefined && { coverImageUrl: coverUrl }),
        ...(outputUrl      !== undefined && { outputUrl: output }),
      },
      select: { id: true, slug: true, status: true, title: true },
    });

    // Notify all active members when status changes
    const notification = status !== undefined && status !== project.status ? STATUS_NOTIFICATIONS[status] : undefined;
    if (notification) {
      const members = await prisma.projectMember.findMany({
        where: { projectId: project.id, isActive: true, userId: { not: user.id } },
        select: { userId: true },
      });
      await createNotifications(
        members.map((m) => ({
          userId:  m.userId,
          type:    notification.type,
          title:   notification.title,
          message: notification.message(updated.title),
          link:    `/dashboard/projects/${updated.slug}${notification.path}`,
        }))
      );
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
