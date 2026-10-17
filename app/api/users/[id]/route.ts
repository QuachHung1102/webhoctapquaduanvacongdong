import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/users/[id] — public profile
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        skillsTagged: {
          include: { skill: true },
        },
        badgesEarned: {
          include: { badge: true },
        },
        memberships: {
          where: { isActive: true },
          include: {
            project: {
              select: {
                id: true, title: true, category: true, status: true,
              },
            },
          },
        },
        portfolio: {
          where: { isPublic: true },
          include: {
            project: { select: { id: true, title: true, category: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        // Chỉ lấy điểm để tính trung bình — nội dung peer review không công khai
        reviewsReceived: { select: { rating: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    // Route này public: chỉ trả về điểm trung bình + số lượt, không trả từng review
    const { reviewsReceived, ...profile } = user;
    const reviewCount = reviewsReceived.length;
    const avgRating =
      reviewCount > 0
        ? reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : null;

    return NextResponse.json({ ...profile, avgRating, reviewCount });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
