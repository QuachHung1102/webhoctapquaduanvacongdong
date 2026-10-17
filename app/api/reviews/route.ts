import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { canReviewIn } from "@/lib/permissions";
import { isActiveMember } from "@/lib/queries/project";
import { readJson, text } from "@/lib/validation";

// GET /api/reviews?projectId=xxx — get reviews for a project (reviewer's perspective)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId là bắt buộc." }, { status: 400 });

  // Reviews given BY the current user in this project
  const myReviews = await prisma.review.findMany({
    where: { projectId, reviewerId: session.user.id },
    include: { reviewee: { select: { id: true, name: true, avatarUrl: true, username: true } } },
  });

  // Reviews received BY the current user
  const receivedReviews = await prisma.review.findMany({
    where: { projectId, revieweeId: session.user.id },
    include: { reviewer: { select: { id: true, name: true, avatarUrl: true, username: true } } },
  });

  return NextResponse.json({ myReviews, receivedReviews });
}

// POST /api/reviews — create or update a peer review
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    const reviewerId = session.user.id;

    const body = await readJson(req);
    const projectId  = text(body.projectId);
    const revieweeId = text(body.revieweeId);
    const rating     = body.rating;
    const comment    = text(body.comment) || null;
    if (!projectId || !revieweeId || rating === undefined) {
      return NextResponse.json({ error: "projectId, revieweeId và rating là bắt buộc." }, { status: 400 });
    }
    if (revieweeId === reviewerId) {
      return NextResponse.json({ error: "Không thể tự đánh giá bản thân." }, { status: 400 });
    }
    if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating phải là số nguyên từ 1 đến 5." }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { mentorId: true, status: true, slug: true } });
    if (!project) return NextResponse.json({ error: "Dự án không tồn tại." }, { status: 404 });
    if (!canReviewIn(project.status)) {
      return NextResponse.json({ error: "Chỉ có thể đánh giá khi dự án đang ở giai đoạn review hoặc đã hoàn thành." }, { status: 400 });
    }

    // Verify reviewer is a member or mentor of the project
    if (project.mentorId !== reviewerId && !(await isActiveMember(projectId, reviewerId))) {
      return NextResponse.json({ error: "Bạn không thuộc dự án này." }, { status: 403 });
    }

    // Verify reviewee is also part of the project
    if (project.mentorId !== revieweeId && !(await isActiveMember(projectId, revieweeId))) {
      return NextResponse.json({ error: "Người được đánh giá không thuộc dự án này." }, { status: 403 });
    }

    const where = { projectId_reviewerId_revieweeId: { projectId, reviewerId, revieweeId } };
    const isNew = !(await prisma.review.findUnique({ where, select: { id: true } }));

    const review = await prisma.review.upsert({
      where,
      update: { rating, comment },
      create: { projectId, reviewerId, revieweeId, rating, comment },
      include: {
        reviewer: { select: { id: true, name: true } },
        reviewee: { select: { id: true, name: true, avatarUrl: true, username: true } },
      },
    });

    // Notify reviewee — only for a new review, not when an existing one is edited
    if (isNew) {
      await createNotification({
        userId:  revieweeId,
        type:    "REVIEW_RECEIVED",
        title:   "Bạn vừa nhận được đánh giá mới",
        message: `${review.reviewer.name ?? "Ai đó"} đã đánh giá bạn ${rating}/5 sao`,
        link:    `/dashboard/projects/${project.slug}/reviews`,
      });
    }

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
