import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifySprintStarted } from "@/lib/notifications";
import { canManageProject } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { parseDate, readJson } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Loads the sprint and checks the caller is the project mentor or an admin. */
async function loadManagedSprint(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: bad("Chưa đăng nhập.", 401) };

  const sprint = await prisma.sprint.findUnique({ where: { id }, include: { project: { select: { mentorId: true } } } });
  if (!sprint) return { error: bad("Sprint không tồn tại.", 404) };
  if (!canManageProject(user, sprint.project)) return { error: bad("Không có quyền.", 403) };

  return { user, sprint };
}

// PATCH /api/sprints/[id] — update sprint (name, goal, dates, isActive)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { user, sprint, error } = await loadManagedSprint(id);
    if (error) return error;

    const { name, goal, startDate, endDate, isActive } = await readJson(req);

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return bad("Tên sprint không được để trống.");
    }
    if (goal !== undefined && goal !== null && typeof goal !== "string") return bad("Mục tiêu sprint không hợp lệ.");
    if (isActive !== undefined && typeof isActive !== "boolean") return bad("isActive không hợp lệ.");

    const start = startDate === undefined ? sprint.startDate : parseDate(startDate);
    const end   = endDate   === undefined ? sprint.endDate   : parseDate(endDate);
    if (!start || !end) return bad("Ngày bắt đầu hoặc ngày kết thúc không hợp lệ.");
    if (end < start) return bad("Ngày kết thúc phải sau ngày bắt đầu.");

    // Deactivate others if activating this sprint
    if (isActive === true) {
      await prisma.sprint.updateMany({ where: { projectId: sprint.projectId, isActive: true }, data: { isActive: false } });
    }

    const updated = await prisma.sprint.update({
      where: { id },
      data: {
        ...(name      !== undefined && { name: name.trim() }),
        ...(goal      !== undefined && { goal: goal?.trim() || null }),
        ...(startDate !== undefined && { startDate: start }),
        ...(endDate   !== undefined && { endDate: end }),
        ...(isActive  !== undefined && { isActive }),
      },
      include: { _count: { select: { tasks: true } } },
    });

    // Notify members only on the inactive → active transition
    if (isActive === true && !sprint.isActive) {
      await notifySprintStarted(sprint.projectId, updated.name, user.id);
    }

    return NextResponse.json(updated);
  } catch {
    return bad("Lỗi máy chủ.", 500);
  }
}

// DELETE /api/sprints/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { error } = await loadManagedSprint(id);
    if (error) return error;

    await prisma.sprint.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return bad("Lỗi máy chủ.", 500);
  }
}
