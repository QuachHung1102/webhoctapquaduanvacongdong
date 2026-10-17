import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { TaskPriority, TaskStatus, type Prisma } from "@/app/generated/prisma/client";
import { createNotification } from "@/lib/notifications";
import { canManageProject } from "@/lib/permissions";
import { isActiveMember } from "@/lib/queries/project";
import { isOneOf, parseDate, readJson } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

async function findTask(id: string) {
  return prisma.task.findUnique({
    where:  { id },
    select: {
      id: true, title: true, status: true, assigneeId: true, projectId: true, createdById: true,
      project: { select: { slug: true, title: true, mentorId: true } },
    },
  });
}

// PATCH /api/tasks/[id] — update any subset of
// { title, description, status, priority, position, assigneeId, dueDate }
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return bad("Chưa đăng nhập.", 401);

    const { id } = await params;
    const task = await findTask(id);
    if (!task) return bad("Task không tồn tại.", 404);

    // Project mentor, ADMIN, or an active member of the task's project
    if (!canManageProject(authUser, task.project) && !(await isActiveMember(task.projectId, authUser.id))) {
      return bad("Không có quyền cập nhật task này.", 403);
    }

    const body = await readJson(req);
    const data: Prisma.TaskUncheckedUpdateInput = {};

    if ("title" in body) {
      if (typeof body.title !== "string" || !body.title.trim()) return bad("Tiêu đề task không được để trống.");
      data.title = body.title.trim();
    }
    if ("description" in body) {
      if (body.description !== null && typeof body.description !== "string") return bad("Mô tả không hợp lệ.");
      data.description = body.description?.trim() || null;
    }
    if ("status" in body) {
      if (!isOneOf(TaskStatus, body.status)) return bad("Trạng thái không hợp lệ.");
      data.status = body.status;
      // completedAt follows the status: set once on entering DONE, cleared on leaving it
      if (body.status !== "DONE") data.completedAt = null;
      else if (task.status !== "DONE") data.completedAt = new Date();
    }
    if ("priority" in body) {
      if (!isOneOf(TaskPriority, body.priority)) return bad("Độ ưu tiên không hợp lệ.");
      data.priority = body.priority;
    }
    if ("position" in body) {
      if (typeof body.position !== "number" || !Number.isInteger(body.position) || body.position < 0) {
        return bad("Vị trí không hợp lệ.");
      }
      data.position = body.position;
    }
    if ("assigneeId" in body) {
      const assigneeId = body.assigneeId;
      if (assigneeId !== null) {
        if (typeof assigneeId !== "string" || !assigneeId) return bad("Người được giao không hợp lệ.");
        if (assigneeId !== task.project.mentorId && !(await isActiveMember(task.projectId, assigneeId))) {
          return bad("Người được giao phải là thành viên của dự án.");
        }
      }
      data.assigneeId = assigneeId;
    }
    if ("dueDate" in body) {
      const dueDate = body.dueDate === null ? null : parseDate(body.dueDate);
      if (body.dueDate !== null && !dueDate) return bad("Hạn chót không hợp lệ.");
      data.dueDate = dueDate;
    }

    if (Object.keys(data).length === 0) return bad("Không có dữ liệu cập nhật.");

    const updated = await prisma.task.update({ where: { id }, data });

    // Notify new assignee if changed
    if (updated.assigneeId && "assigneeId" in data && updated.assigneeId !== task.assigneeId && updated.assigneeId !== authUser.id) {
      await createNotification({
        userId:  updated.assigneeId,
        type:    "TASK_ASSIGNED",
        title:   "Bạn được giao task mới",
        message: `Task "${updated.title}" trong dự án "${task.project.title}"`,
        link:    `/dashboard/projects/${task.project.slug}/kanban`,
      });
    }

    return NextResponse.json(updated);
  } catch {
    return bad("Lỗi máy chủ.", 500);
  }
}

// DELETE /api/tasks/[id] — project mentor, ADMIN, or the task's creator
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return bad("Chưa đăng nhập.", 401);

    const { id } = await params;
    const task = await findTask(id);
    if (!task) return bad("Task không tồn tại.", 404);

    if (!canManageProject(authUser, task.project) && task.createdById !== authUser.id) {
      return bad("Không có quyền xoá task này.", 403);
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Lỗi máy chủ.", 500);
  }
}
