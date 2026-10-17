import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TaskPriority } from "@/app/generated/prisma/client";
import { createNotification } from "@/lib/notifications";
import { canManageProject } from "@/lib/permissions";
import { isActiveMember } from "@/lib/queries/project";
import { getCurrentUser } from "@/lib/session";
import { isOneOf, parseDate, readJson, text } from "@/lib/validation";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// GET /api/tasks?sprintId=xxx — list tasks for a sprint (project mentor, ADMIN or active member)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad("Chưa đăng nhập.", 401);

    const sprintId = new URL(req.url).searchParams.get("sprintId");
    if (!sprintId) return bad("sprintId là bắt buộc.");

    const sprint = await prisma.sprint.findUnique({
      where:  { id: sprintId },
      select: { projectId: true, project: { select: { mentorId: true } } },
    });
    if (!sprint) return bad("Sprint không tồn tại.", 404);
    if (!canManageProject(user, sprint.project) && !(await isActiveMember(sprint.projectId, user.id))) {
      return bad("Bạn không phải thành viên của dự án này.", 403);
    }

    const tasks = await prisma.task.findMany({
      where: { sprintId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch {
    return bad("Lỗi máy chủ.", 500);
  }
}

// POST /api/tasks — create a task (mentor, ADMIN or active member)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return bad("Chưa đăng nhập.", 401);

    const body = await readJson(req);
    const projectId   = text(body.projectId);
    const title       = text(body.title);
    const sprintId    = text(body.sprintId) || null;
    const assigneeId  = text(body.assigneeId) || null;
    const priority    = body.priority || "MEDIUM";
    if (!projectId || !title) return bad("projectId và title là bắt buộc.");
    if (!isOneOf(TaskPriority, priority)) return bad("Độ ưu tiên không hợp lệ.");

    const dueDate = body.dueDate ? parseDate(body.dueDate) : null;
    if (body.dueDate && !dueDate) return bad("Hạn chót không hợp lệ.");

    // Verify user is mentor, admin or active member of the project
    const project = await prisma.project.findUnique({
      where:  { id: projectId },
      select: { mentorId: true, title: true, slug: true },
    });
    if (!project) return bad("Dự án không tồn tại.", 404);
    if (!canManageProject(user, project) && !(await isActiveMember(projectId, user.id))) {
      return bad("Bạn không phải thành viên của dự án này.", 403);
    }

    if (sprintId) {
      const sprint = await prisma.sprint.findUnique({ where: { id: sprintId }, select: { projectId: true } });
      if (sprint?.projectId !== projectId) return bad("Sprint không thuộc dự án này.");
    }
    if (assigneeId && assigneeId !== project.mentorId && !(await isActiveMember(projectId, assigneeId))) {
      return bad("Người được giao phải là thành viên của dự án.");
    }

    // Count existing tasks in same sprint/status for position
    const position = await prisma.task.count({ where: { projectId, sprintId, status: "TODO" } });

    const task = await prisma.task.create({
      data: {
        projectId,
        sprintId,
        title,
        description: text(body.description) || null,
        priority,
        assigneeId,
        dueDate,
        createdById: user.id,
        position,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Notify assignee if assigned to someone else
    if (assigneeId && assigneeId !== user.id) {
      await createNotification({
        userId:  assigneeId,
        type:    "TASK_ASSIGNED",
        title:   "Bạn được giao task mới",
        message: `Task "${task.title}" trong dự án "${project.title}"`,
        link:    `/dashboard/projects/${project.slug}/kanban`,
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch {
    return bad("Lỗi máy chủ.", 500);
  }
}
