/**
 * lib/queries/community.ts
 * Queries cho trang Cộng đồng.
 */
import { prisma } from "@/lib/db";

/** Shape mà components/projects/ProjectCard cần */
const CARD_SELECT = {
  id:            true,
  slug:          true,
  title:         true,
  description:   true,
  category:      true,
  status:        true,
  difficulty:    true,
  timeline:      true,
  maxMembers:    true,
  coverImageUrl: true,
  mentor: { select: { id: true, name: true, avatarUrl: true } },
  skills: { select: { skill: { select: { name: true } } }, take: 4 },
  _count: { select: { members: true } },
} as const;

/** Các dự án đã COMPLETED để showcase */
export async function getCompletedProjects(limit = 6) {
  return prisma.project.findMany({
    where:   { status: "COMPLETED" },
    select:  CARD_SELECT,
    orderBy: { updatedAt: "desc" },
    take:    limit,
  });
}

/** Thống kê toàn hệ thống */
export async function getCommunityStats() {
  const [users, projects, completedProjects, skills] = await Promise.all([
    prisma.user.count({ where: { role: { in: ["LEARNER", "MENTOR"] } } }),
    prisma.project.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.project.count({ where: { status: "COMPLETED" } }),
    prisma.skill.count(),
  ]);
  return { users, projects, completedProjects, skills };
}

/** Top mentors (nhiều dự án nhất), kèm điểm đánh giá trung bình từ học viên */
export async function getTopMentors(limit = 6) {
  const mentors = await prisma.user.findMany({
    where: { role: "MENTOR" },
    select: {
      id:        true,
      name:      true,
      username:  true,
      avatarUrl: true,
      bio:       true,
      skillsTagged: {
        select: { skill: { select: { name: true } } },
        take: 3,
        orderBy: { level: "desc" },
      },
      mentorReviews: { select: { rating: true } },
      _count: { select: { projectsMentoring: true } },
    },
    orderBy: { projectsMentoring: { _count: "desc" } },
    take: limit,
  });

  return mentors.map(({ mentorReviews, ...m }) => ({
    ...m,
    reviewCount: mentorReviews.length,
    avgRating: mentorReviews.length
      ? Math.round((mentorReviews.reduce((sum, r) => sum + r.rating, 0) / mentorReviews.length) * 10) / 10
      : null,
  }));
}

/** Dự án đang mở tuyển thành viên */
export async function getOpenProjects(limit = 3) {
  return prisma.project.findMany({
    where:   { status: "RECRUITING" },
    select:  CARD_SELECT,
    orderBy: { createdAt: "desc" },
    take:    limit,
  });
}

/** Tìm kiếm user theo tên/username */
export async function searchUsers(query: string, limit = 20) {
  if (!query.trim()) return [];
  return prisma.user.findMany({
    where: {
      username: { not: null },
      OR: [
        { name:     { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id:        true,
      name:      true,
      username:  true,
      avatarUrl: true,
      role:      true,
      _count: { select: { memberships: true, projectsMentoring: true } },
    },
    take: limit,
    orderBy: { name: "asc" },
  });
}

/** Thành viên mới nhất có trang hồ sơ công khai */
export async function getRecentMembers(limit = 8) {
  return prisma.user.findMany({
    where: { role: "LEARNER", username: { not: null } },
    select: {
      id:        true,
      name:      true,
      username:  true,
      avatarUrl: true,
      skillsTagged: {
        select: { skill: { select: { name: true } } },
        take: 2,
        orderBy: { level: "desc" },
      },
      _count: { select: { memberships: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Điểm đánh giá công khai của một user.
 * Đánh giá chéo giữa thành viên chỉ lộ điểm trung bình; nhận xét dành cho mentor thì hiển thị đầy đủ.
 */
export async function getUserRatings(userId: string) {
  const [peer, mentorReviews] = await Promise.all([
    prisma.review.aggregate({ where: { revieweeId: userId }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.mentorReview.findMany({
      where: { mentorId: userId },
      select: {
        id:       true,
        rating:   true,
        comment:  true,
        createdAt: true,
        reviewer: { select: { name: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const count = peer._count._all + mentorReviews.length;
  const sum = (peer._avg.rating ?? 0) * peer._count._all + mentorReviews.reduce((t, r) => t + r.rating, 0);
  return {
    count,
    avg: count > 0 ? Math.round((sum / count) * 10) / 10 : null,
    mentorReviews,
  };
}
