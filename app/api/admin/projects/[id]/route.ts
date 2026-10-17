import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ProjectStatus } from "@/app/generated/prisma/client";
import { statusDates } from "@/lib/queries/project";
import { isOneOf, readJson } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/projects/[id] — update project status
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await readJson(req);

    if (!isOneOf(ProjectStatus, status)) {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id }, select: { status: true, startDate: true } });
    if (!project) {
      return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { status, ...statusDates(status, project) },
      select: { id: true, status: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
