import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { canReviewIn } from "@/lib/permissions";
import { isActiveMember } from "@/lib/queries/project";
import { readJson, text } from "@/lib/validation";

// POST /api/mentor-reviews — learner reviews the mentor of a project they are in
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    const reviewerId = session.user.id;

    const body = await readJson(req);
    const mentorId  = text(body.mentorId);
    const projectId = text(body.projectId);
    const rating    = body.rating;
    const comment   = text(body.comment) || null;
    if (!mentorId || !projectId || rating === undefined) {
      return NextResponse.json({ error: "mentorId, projectId và rating là bắt buộc." }, { status: 400 });
    }
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating phải là số nguyên từ 1 đến 5." }, { status: 400 });
    }
    if (mentorId === reviewerId) {
      return NextResponse.json({ error: "Không thể tự đánh giá bản thân." }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { mentorId: true, status: true } });
    if (!project) return NextResponse.json({ error: "Dự án không tồn tại." }, { status: 404 });
    if (project.mentorId !== mentorId) {
      return NextResponse.json({ error: "Người này không phải mentor của dự án." }, { status: 400 });
    }
    if (!canReviewIn(project.status)) {
      return NextResponse.json({ error: "Chỉ có thể đánh giá khi dự án đang ở giai đoạn review hoặc đã hoàn thành." }, { status: 400 });
    }
    if (!(await isActiveMember(projectId, reviewerId))) {
      return NextResponse.json({ error: "Bạn không tham gia dự án này." }, { status: 403 });
    }

    const review = await prisma.mentorReview.upsert({
      where: { mentorId_reviewerId_projectId: { mentorId, reviewerId, projectId } },
      update: { rating, comment },
      create: { mentorId, reviewerId, projectId, rating, comment },
      include: { mentor: { select: { id: true, name: true, avatarUrl: true, username: true } } },
    });

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
