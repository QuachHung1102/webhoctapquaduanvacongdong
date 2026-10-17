/**
 * lib/queries/home.ts
 * Queries cho trang chủ — số liệu, dự án nổi bật và đánh giá đều lấy từ DB thật.
 */
import { cache } from "react";
import { prisma } from "@/lib/db";

/** Số liệu toàn hệ thống. `cache` gộp các lần gọi từ nhiều section trong cùng một request. */
export const getHomeStats = cache(async () => {
  const [projects, learners, mentors, completed, skills, byCategory, peer, mentor, faces] =
    await Promise.all([
      prisma.project.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.user.count({ where: { role: "LEARNER" } }),
      prisma.user.count({ where: { role: "MENTOR" } }),
      prisma.project.count({ where: { status: "COMPLETED" } }),
      prisma.skill.count(),
      prisma.project.groupBy({
        by: ["category"],
        where: { status: { not: "CANCELLED" } },
        _count: { _all: true },
      }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
      prisma.mentorReview.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
      prisma.user.findMany({
        where: { role: "LEARNER", avatarUrl: { not: null } },
        select: { id: true, name: true, avatarUrl: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const reviewCount = peer._count._all + mentor._count._all;
  const ratingSum =
    (peer._avg.rating ?? 0) * peer._count._all + (mentor._avg.rating ?? 0) * mentor._count._all;

  return {
    projects,
    learners,
    mentors,
    completed,
    skills,
    categoryCounts: Object.fromEntries(byCategory.map((c) => [c.category, c._count._all])) as Record<string, number>,
    reviewCount,
    avgRating: reviewCount > 0 ? Math.round((ratingSum / reviewCount) * 10) / 10 : null,
    faces,
  };
});

const STATUS_ORDER = ["RECRUITING", "UPCOMING", "IN_PROGRESS", "REVIEWING", "COMPLETED"];

/** Dự án cho mục nổi bật — ưu tiên dự án đang tuyển. */
export async function getFeaturedProjects(limit = 3) {
  const projects = await prisma.project.findMany({
    where: { status: { not: "CANCELLED" } },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      status: true,
      difficulty: true,
      timeline: true,
      maxMembers: true,
      coverImageUrl: true,
      mentor: { select: { name: true, avatarUrl: true } },
      skills: { select: { skill: { select: { name: true } } }, take: 4 },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return projects
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    .slice(0, limit);
}

/** Đánh giá học viên viết cho mentor sau dự án — mỗi người viết chỉ xuất hiện một lần. */
export async function getTestimonials(limit = 3) {
  const reviews = await prisma.mentorReview.findMany({
    where: { rating: { gte: 4 }, comment: { not: null }, projectId: { not: null } },
    select: {
      id: true,
      rating: true,
      comment: true,
      projectId: true,
      reviewer: { select: { id: true, name: true, username: true, avatarUrl: true } },
      mentor: { select: { name: true } },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit * 4,
  });

  const seen = new Set<string>();
  const picked = reviews.filter((r) => !seen.has(r.reviewer.id) && seen.add(r.reviewer.id)).slice(0, limit);
  if (picked.length === 0) return [];

  const projectIds = picked.map((r) => r.projectId!);
  const [projects, memberships] = await Promise.all([
    prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, title: true, slug: true } }),
    prisma.projectMember.findMany({
      where: { projectId: { in: projectIds }, userId: { in: picked.map((r) => r.reviewer.id) } },
      select: { projectId: true, userId: true, role: true },
    }),
  ]);

  return picked.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment!,
    reviewer: r.reviewer,
    mentorName: r.mentor.name,
    project: projects.find((p) => p.id === r.projectId) ?? null,
    memberRole: memberships.find((m) => m.projectId === r.projectId && m.userId === r.reviewer.id)?.role ?? null,
  }));
}
