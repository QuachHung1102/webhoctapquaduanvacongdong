import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifySprintStarted } from "@/lib/notifications";
import { canManageProject } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";
import { parseDate, readJson, text } from "@/lib/validation";

// POST /api/sprints — mentor creates a sprint for a project
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

    const body = await readJson(req);
    const projectId = text(body.projectId);
    const name      = text(body.name);
    const startDate = parseDate(body.startDate);
    const endDate   = parseDate(body.endDate);
    const isActive  = body.isActive === true;

    if (!projectId || !name || !body.startDate || !body.endDate) {
      return NextResponse.json({ error: "projectId, name, startDate, endDate là bắt buộc." }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ." }, { status: 400 });
    }
    if (endDate < startDate) {
      return NextResponse.json({ error: "Ngày kết thúc phải sau ngày bắt đầu." }, { status: 400 });
    }

    // Only project mentor or admin can create sprints
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { mentorId: true } });
    if (!project) return NextResponse.json({ error: "Dự án không tồn tại." }, { status: 404 });
    if (!canManageProject(user, project)) {
      return NextResponse.json({ error: "Chỉ mentor của dự án mới được tạo sprint." }, { status: 403 });
    }

    // If marking new sprint as active, deactivate others
    if (isActive) {
      await prisma.sprint.updateMany({ where: { projectId, isActive: true }, data: { isActive: false } });
    }

    const sprint = await prisma.sprint.create({
      data: { projectId, name, goal: text(body.goal) || null, startDate, endDate, isActive },
      include: { _count: { select: { tasks: true } } },
    });

    // Notify all active members when sprint is activated
    if (isActive) await notifySprintStarted(projectId, sprint.name, user.id);

    return NextResponse.json(sprint, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
