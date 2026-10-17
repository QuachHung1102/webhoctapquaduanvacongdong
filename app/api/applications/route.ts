import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MemberRole } from "@/app/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";
import { canManageProject } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
import { isOneOf, readJson } from "@/lib/validation";

// POST /api/applications — apply for a project role
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }
    if (currentUser.role !== "LEARNER") {
      return NextResponse.json({ error: "Chỉ học viên mới có thể ứng tuyển." }, { status: 403 });
    }

    const { projectId, role, message } = await readJson(req);

    if (typeof projectId !== "string" || !isOneOf(MemberRole, role)) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
    }
    if (message !== undefined && (typeof message !== "string" || message.length > 500)) {
      return NextResponse.json({ error: "Lời nhắn không hợp lệ." }, { status: 400 });
    }

    // Check project exists and is recruiting
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });
    }
    if (project.status !== "RECRUITING") {
      return NextResponse.json({ error: "Dự án không còn tuyển thành viên." }, { status: 400 });
    }

    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: currentUser.id } },
    });
    if (isMember?.isActive) {
      return NextResponse.json({ error: "Bạn đã là thành viên của dự án." }, { status: 409 });
    }

    // Check current member count
    const memberCount = await prisma.projectMember.count({
      where: { projectId, isActive: true },
    });
    if (memberCount >= project.maxMembers) {
      return NextResponse.json({ error: "Dự án đã đủ thành viên." }, { status: 400 });
    }

    const application = await prisma.application.upsert({
      where: { projectId_userId: { projectId, userId: currentUser.id } },
      update: { role, message, status: "PENDING" },
      create: { projectId, userId: currentUser.id, role, message },
    });

    // Báo cho mentor — cả khi nộp mới lẫn khi nộp lại
    await createNotification({
      userId:  project.mentorId,
      type:    "MEMBER_JOINED",
      title:   "Có đơn đăng ký mới",
      message: `${currentUser.name ?? "Một học viên"} đăng ký tham gia dự án "${project.title}"`,
      link:    "/dashboard/applications",
    });

    return NextResponse.json(application, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

// GET /api/applications?projectId=xxx  or  ?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const userId    = searchParams.get("userId");

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { mentorId: true },
      });
      if (!project) {
        return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });
      }
      if (!canManageProject(currentUser, project)) {
        return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
      }
    } else if (userId && userId !== currentUser.id && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }

    const where = projectId
      ? { projectId, ...(userId ? { userId } : {}) }
      : currentUser.role === "ADMIN"
        ? (userId ? { userId } : {})
        : { userId: currentUser.id };

    const applications = await prisma.application.findMany({
      where,
      include: {
        user:    { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, title: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
