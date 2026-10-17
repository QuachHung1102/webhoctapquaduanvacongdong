/**
 * lib/notifications.ts
 * Helper tạo notification — gọi từ API routes sau khi thực hiện các hành động quan trọng.
 * Không throw lỗi để không ảnh hưởng flow chính nếu notification insert thất bại.
 */
import { prisma } from "@/lib/db";
import type { NotificationType } from "@/app/generated/prisma/client";

interface CreateNotifOptions {
  userId:  string;
  type:    NotificationType;
  title:   string;
  message?: string;
  link?:   string;
}

export async function createNotification(opts: CreateNotifOptions) {
  try {
    await prisma.notification.create({
      data: {
        userId:  opts.userId,
        type:    opts.type,
        title:   opts.title,
        message: opts.message ?? null,
        link:    opts.link    ?? null,
      },
    });
  } catch {
    // Notification failures should never crash the main operation
  }
}

/** Gửi notification cho nhiều user cùng lúc */
export async function createNotifications(opts: CreateNotifOptions[]) {
  if (opts.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: opts.map((o) => ({
        userId:  o.userId,
        type:    o.type,
        title:   o.title,
        message: o.message ?? null,
        link:    o.link    ?? null,
      })),
      skipDuplicates: true,
    });
  } catch {
    // Notification failures should never crash the main operation
  }
}

/** Báo cho các thành viên đang hoạt động (trừ người thao tác) rằng sprint đã được kích hoạt. */
export async function notifySprintStarted(projectId: string, sprintName: string, actorId: string) {
  try {
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: {
        slug:    true,
        title:   true,
        members: { where: { isActive: true, userId: { not: actorId } }, select: { userId: true } },
      },
    });
    if (!project) return;
    await createNotifications(
      project.members.map((m) => ({
        userId:  m.userId,
        type:    "SPRINT_STARTED" as const,
        title:   "Sprint mới đã bắt đầu!",
        message: `"${sprintName}" trong dự án "${project.title}" đã được kích hoạt`,
        link:    `/dashboard/projects/${project.slug}/kanban`,
      }))
    );
  } catch {
    // Notification failures should never crash the main operation
  }
}
