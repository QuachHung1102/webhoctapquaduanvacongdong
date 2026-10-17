import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectCategory, ProjectStatus, Difficulty } from "@/app/generated/prisma/client";
import { getCurrentUser } from "@/lib/session";
import { parseDate, parseOptionalUrl } from "@/lib/validation";

// GET /api/projects — list projects with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as ProjectCategory | null;
    const status   = searchParams.get("status")   as ProjectStatus | null;
    const difficulty = searchParams.get("difficulty") as Difficulty | null;
    const rawPage  = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") ?? "12", 10);
    const page  = Number.isInteger(rawPage) ? Math.max(1, rawPage) : 1;
    const limit = Number.isInteger(rawLimit) ? Math.min(50, Math.max(1, rawLimit)) : 12;

    if (
      (category && !Object.values(ProjectCategory).includes(category)) ||
      (status && !Object.values(ProjectStatus).includes(status)) ||
      (difficulty && !Object.values(Difficulty).includes(difficulty))
    ) {
      return NextResponse.json({ error: "Bộ lọc không hợp lệ." }, { status: 400 });
    }

    const where = {
      ...(category   ? { category }   : {}),
      ...(status     ? { status }     : {}),
      ...(difficulty ? { difficulty } : {}),
    };

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          mentor: { select: { id: true, name: true, avatarUrl: true } },
          skills: { include: { skill: true } },
          members: { select: { id: true, role: true, userId: true } },
          _count: { select: { applications: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({ projects, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

// POST /api/projects — create a new project (mentor/admin only, auth skipped for now)
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }
    if (currentUser.role !== "MENTOR" && currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }

    const body = await req.json().catch(() => null) ?? {};
    const {
      title, description, category, difficulty, timeline,
      maxMembers, outputGoal, skillNames, startDate, slug, coverImageUrl,
    } = body;

    if (
      typeof title !== "string" || !title.trim() ||
      typeof description !== "string" || !description.trim() ||
      typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      !Object.values(ProjectCategory).includes(category) ||
      (difficulty !== undefined && !Object.values(Difficulty).includes(difficulty)) ||
      (timeline !== undefined && (!Number.isInteger(timeline) || timeline < 1)) ||
      (maxMembers !== undefined && (!Number.isInteger(maxMembers) || maxMembers < 1)) ||
      (outputGoal !== undefined && typeof outputGoal !== "string") ||
      (skillNames !== undefined && (!Array.isArray(skillNames) || skillNames.some((name) => typeof name !== "string")))
    ) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
    }

    const parsedStartDate = startDate ? parseDate(startDate) : null;
    if (startDate && !parsedStartDate) {
      return NextResponse.json({ error: "Ngày bắt đầu không hợp lệ." }, { status: 400 });
    }

    const coverUrl = parseOptionalUrl(coverImageUrl);
    if (coverUrl === undefined) {
      return NextResponse.json({ error: "Ảnh bìa không hợp lệ." }, { status: 400 });
    }

    // Upsert skills
    const normalizedSkillNames = [...new Set((skillNames as string[] ?? []).map((name) => name.trim()).filter(Boolean))];
    const skillOps = normalizedSkillNames.map((name) =>
      prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    );
    const skills = await prisma.$transaction(skillOps);

    const project = await prisma.project.create({
      data: {
        slug,
        title,
        description,
        category,
        difficulty: difficulty ?? "INTERMEDIATE",
        timeline: timeline ?? 4,
        maxMembers: maxMembers ?? 4,
        outputGoal: outputGoal ?? "",
        coverImageUrl: coverUrl,
        startDate: parsedStartDate,
        mentor: { connect: { id: currentUser.id } },
        skills: {
          create: skills.map((s) => ({ skill: { connect: { id: s.id } } })),
        },
      },
      include: {
        mentor: { select: { id: true, name: true } },
        skills: { include: { skill: true } },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    // Slug là unique — trùng thì báo 409 để người dùng đổi slug
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Slug này đã được dùng cho dự án khác. Vui lòng chọn slug khác." }, { status: 409 });
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
