/**
 * lib/queries/task.ts
 * Các query cho Kanban board và task management.
 */
import { prisma } from "@/lib/db";
import type { TaskStatus } from "@/app/generated/prisma/client";

// -- Kanban Board -----------------------------------------------------------

/**
 * Lấy toàn bộ tasks của một sprint, nhóm theo status (cho Kanban).
 */
export async function getSprintKanban(sprintId: string) {
  const tasks = await prisma.task.findMany({
    where: { sprintId },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { position: "asc" },
  });

  // Nhóm theo status
  const columns: Record<TaskStatus, typeof tasks> = {
    TODO:        [],
    IN_PROGRESS: [],
    IN_REVIEW:   [],
    DONE:        [],
  };
  for (const task of tasks) {
    columns[task.status].push(task);
  }
  return columns;
}

/**
 * Lấy active sprint của một dự án.
 */
export async function getActiveSprint(projectId: string) {
  return prisma.sprint.findFirst({
    where: { projectId, isActive: true },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { position: "asc" },
      },
    },
  });
}

/**
 * Lấy tất cả sprints của dự án (cho sprint selector).
 */
export async function getProjectSprints(projectId: string) {
  return prisma.sprint.findMany({
    where:   { projectId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { startDate: "asc" },
  });
}

/**
 * Cập nhật status của task (kéo thả Kanban).
 * Trả về task đã update hoặc null nếu task không thuộc project.
 */
export async function moveTask(taskId: string, newStatus: TaskStatus, newPosition: number, userId: string) {
  // Verify task belongs to a project the user is member of
  const task = await prisma.task.findFirst({
    where: {
      id:      taskId,
      project: { members: { some: { userId, isActive: true } } },
    },
    select: { id: true },
  });
  if (!task) return null;

  return prisma.task.update({
    where: { id: taskId },
    data:  { status: newStatus, position: newPosition },
  });
}

/**
 * Lấy chi tiết một task.
 */
export async function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee:  { select: { id: true, name: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true, avatarUrl: true } },
      sprint:    { select: { id: true, name: true } },
      project:   { select: { id: true, slug: true, title: true } },
    },
  });
}

/**
 * Lấy danh sách members có thể được giao task (trong dự án).
 */
export async function getProjectMembersForAssign(projectId: string) {
  return prisma.projectMember.findMany({
    where:   { projectId, isActive: true },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { joinedAt: "asc" },
  });
}
