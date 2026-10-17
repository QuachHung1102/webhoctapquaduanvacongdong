/**
 * lib/queries/dashboard.ts
 * Các query cho dashboard overview — stats, activity, notifications.
 */
import { prisma } from "@/lib/db";

// -- Dashboard Stats --------------------------------------------------------

/**
 * Stats tổng quan cho learner dashboard.
 */
export async function getLearnerStats(userId: string) {
  const [
    activeProjects,
    pendingTasks,
    completedTasks,
    pendingApplications,
    totalReviews,
  ] = await Promise.all([
    // Dự án đang tham gia (chưa hoàn thành)
    prisma.projectMember.count({
      where: {
        userId,
        isActive: true,
        project: { status: { in: ["RECRUITING", "IN_PROGRESS", "REVIEWING"] } },
      },
    }),
    // Tasks chưa xong được giao cho mình — cùng điều kiện với getMyActiveTasks
    prisma.task.count({ where: myOpenTasksWhere(userId) }),
    // Tasks đã hoàn thành
    prisma.task.count({
      where: { assigneeId: userId, status: "DONE" },
    }),
    // Đơn đăng ký đang chờ duyệt
    prisma.application.count({
      where: { userId, status: "PENDING" },
    }),
    // Số lần được đánh giá
    prisma.review.count({
      where: { revieweeId: userId },
    }),
  ]);

  return { activeProjects, pendingTasks, completedTasks, pendingApplications, totalReviews };
}

/**
 * Stats tổng quan cho mentor dashboard.
 */
export async function getMentorStats(mentorId: string) {
  const [
    totalProjects,
    activeProjects,
    pendingApplications,
    totalMembers,
  ] = await Promise.all([
    prisma.project.count({ where: { mentorId } }),
    prisma.project.count({
      where: { mentorId, status: { in: ["RECRUITING", "IN_PROGRESS", "REVIEWING"] } },
    }),
    prisma.application.count({
      where: { project: { mentorId }, status: "PENDING" },
    }),
    prisma.projectMember.count({
      where: { project: { mentorId }, isActive: true },
    }),
  ]);

  return { totalProjects, activeProjects, pendingApplications, totalMembers };
}

// -- Dashboard Feed ---------------------------------------------------------

/**
 * Tasks sắp đến hạn của user (trong 7 ngày tới).
 */
export async function getUpcomingTasks(userId: string, limit = 5) {
  const sevenDaysLater = new Date(Date.now() + 7 * 86_400_000);
  return prisma.task.findMany({
    where: {
      assigneeId: userId,
      status:     { not: "DONE" },
      dueDate:    { lte: sevenDaysLater },
    },
    include: {
      project: { select: { id: true, slug: true, title: true } },
      sprint:  { select: { name: true } },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    take: limit,
  });
}

/**
 * Task đang mở của user: thuộc active sprint, hoặc chưa gắn sprint nào.
 * Dùng chung cho số đếm "Tasks còn lại" và danh sách task để hai nơi luôn khớp.
 */
function myOpenTasksWhere(userId: string) {
  return {
    assigneeId: userId,
    status:     { not: "DONE" as const },
    OR:         [{ sprintId: null }, { sprint: { isActive: true } }],
  };
}

/**
 * Tasks đang mở của user (active sprint của từng dự án + task chưa gắn sprint).
 */
export async function getMyActiveTasks(userId: string, limit = 10) {
  return prisma.task.findMany({
    where: myOpenTasksWhere(userId),
    include: {
      project: { select: { id: true, slug: true, title: true } },
      sprint:  { select: { name: true } },
    },
    orderBy: [{ priority: "desc" }, { position: "asc" }],
    take: limit,
  });
}

/**
 * Đơn đăng ký gần nhất của user.
 */
export async function getMyRecentApplications(userId: string, limit = 5) {
  return prisma.application.findMany({
    where: { userId },
    include: {
      project: {
        select: { id: true, slug: true, title: true, coverImageUrl: true, category: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Đơn đăng ký pending cho mentor cần duyệt.
 */
export async function getPendingApplicationsForMentor(mentorId: string, limit = 10) {
  return prisma.application.findMany({
    where: {
      status:  "PENDING",
      project: { mentorId },
    },
    include: {
      user:    { select: { id: true, name: true, avatarUrl: true, bio: true } },
      project: { select: { id: true, slug: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

// -- Notifications ----------------------------------------------------------

/**
 * Lấy thông báo của user (mới nhất trước).
 */
export async function getNotifications(userId: string, { unreadOnly = false, limit = 20 } = {}) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Đếm thông báo chưa đọc.
 */
export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

/**
 * Đánh dấu tất cả thông báo là đã đọc.
 */
export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data:  { isRead: true },
  });
}
