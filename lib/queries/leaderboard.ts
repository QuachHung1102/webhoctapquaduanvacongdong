/**
 * lib/queries/leaderboard.ts
 * Top users sorted by: completed projects, average review score, badge count.
 */
import { prisma } from "@/lib/db";

export async function getLeaderboard(limit = 50) {
  // Prisma can't ORDER BY a computed score, so score in JS.
  // shortcut: ranks only the 500 earliest accounts; move the score into SQL past that.
  const users = await prisma.user.findMany({
    where: { role: { in: ["LEARNER", "MENTOR"] } },
    select: {
      id:        true,
      name:      true,
      username:  true,
      avatarUrl: true,
      role:      true,
      _count: { select: { badgesEarned: true } },
      // Learners finish projects as members, mentors as the project's mentor
      memberships:       { where: { project: { status: "COMPLETED" } }, select: { id: true } },
      projectsMentoring: { where: { status: "COMPLETED" }, select: { id: true } },
      // Peer reviews for members, learner-written reviews for mentors
      reviewsReceived: { select: { rating: true } },
      mentorReviews:   { select: { rating: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  return users
    .map((u) => {
      const ratings           = [...u.reviewsReceived, ...u.mentorReviews].map((r) => r.rating);
      const completedProjects = u.memberships.length + u.projectsMentoring.length;
      const reviewCount       = ratings.length;
      const avgRating         = reviewCount > 0 ? ratings.reduce((s, r) => s + r, 0) / reviewCount : 0;
      const badgeCount        = u._count.badgesEarned;
      // Score: completed projects × 3 + avgRating × 10 + badges × 5
      const score             = completedProjects * 3 + avgRating * 10 + badgeCount * 5;
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        avatarUrl: u.avatarUrl,
        role: u.role,
        completedProjects,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount,
        badgeCount,
        score: Math.round(score * 10) / 10,
      };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "vi"))
    .slice(0, limit);
}
