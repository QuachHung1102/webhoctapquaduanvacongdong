import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { getCurrentUser } from "@/lib/session";
import { canUpdateApplication } from "@/lib/permissions";
import { readJson } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/applications/[id] — accept or reject
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await readJson(req); // ACCEPTED | REJECTED | WITHDRAWN

    if (status !== "ACCEPTED" && status !== "REJECTED" && status !== "WITHDRAWN") {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }

    const existing = await prisma.application.findUnique({
      where: { id },
      include: { project: { select: { mentorId: true, maxMembers: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy đơn ứng tuyển." }, { status: 404 });
    }
    if (!canUpdateApplication(currentUser, existing, status)) {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Đơn ứng tuyển đã được xử lý." }, { status: 409 });
    }

    if (status === "ACCEPTED") {
      const memberCount = await prisma.projectMember.count({
        where: { projectId: existing.projectId, isActive: true },
      });
      if (memberCount >= existing.project.maxMembers) {
        return NextResponse.json({ error: "Dự án đã đủ thành viên." }, { status: 409 });
      }
    }

    // ponytail: This capacity check is transaction-local; add project-row locking if concurrent approvals become common.
    const application = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({ where: { id }, data: { status } });

      if (status === "ACCEPTED") {
        await tx.projectMember.upsert({
          where: {
            projectId_userId: {
              projectId: updated.projectId,
              userId: updated.userId,
            },
          },
          update: { role: updated.role, isActive: true },
          create: {
            projectId: updated.projectId,
            userId: updated.userId,
            role: updated.role,
          },
        });
      }

      return updated;
    });

    // Send notification to applicant
    const project = await prisma.project.findUnique({
      where: { id: application.projectId },
      select: { title: true, slug: true },
    });
    if (project) {
      if (status === "ACCEPTED") {
        await createNotification({
          userId:  application.userId,
          type:    "APPLICATION_ACCEPTED",
          title:   "Đơn đăng ký được chấp nhận!",
          message: `Bạn đã được nhận vào dự án "${project.title}"`,
          link:    `/dashboard/projects/${project.slug}`,
        });
      } else if (status === "REJECTED") {
        await createNotification({
          userId:  application.userId,
          type:    "APPLICATION_REJECTED",
          title:   "Đơn đăng ký không được chấp nhận",
          message: `Đơn đăng ký vào dự án "${project.title}" đã bị từ chối`,
          link:    `/projects/${project.slug}`,
        });
      }
    }

    return NextResponse.json(application);
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
