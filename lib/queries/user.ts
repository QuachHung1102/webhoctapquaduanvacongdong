/**
 * lib/queries/user.ts
 * Các query cho user profile, skills, portfolio.
 */
import { prisma } from "@/lib/db";

// -- Profile ----------------------------------------------------------------

/**
 * Lấy public profile của một user theo username (slug URL).
 * Dùng cho trang /u/[username].
 */
export async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id:         true,
      name:       true,
      username:   true,
      bio:        true,
      avatarUrl:  true,
      role:       true,
      isVerified: true,
      createdAt:  true,
      skillsTagged: {
        include: { skill: true },
        orderBy: { level: "desc" },
      },
      badgesEarned: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
      portfolio: {
        where:   { isPublic: true },
        include: { project: { select: { slug: true, title: true, category: true } } },
        orderBy: { createdAt: "desc" },
      },
      projectsMentoring: {
        select: { id: true, slug: true, title: true, category: true, status: true, difficulty: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      memberships: {
        where: { isActive: true },
        include: { project: { select: { id: true, slug: true, title: true, category: true, status: true } } },
        orderBy: { joinedAt: "desc" },
        take: 6,
      },
      _count: {
        select: {
          memberships:     true,
          portfolio:       true,
          reviewsReceived: true,
        },
      },
    },
  });
}

/**
 * Lấy public profile của một user theo ID.
 * Dùng cho trang /profile/[id] (đọc công khai).
 */
export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:         true,
      name:       true,
      bio:        true,
      avatarUrl:  true,
      role:       true,
      isVerified: true,
      createdAt:  true,
      skillsTagged: {
        include: { skill: true },
        orderBy: { level: "desc" },
      },
      badgesEarned: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
      portfolio: {
        where:   { isPublic: true },
        include: { project: { select: { title: true, category: true } } },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          memberships:        true,
          portfolio:          true,
          reviewsReceived:    true,
        },
      },
    },
  });
}

/**
 * Lấy thông tin đầy đủ của current user (cho dashboard sidebar, settings).
 */
export async function getFullCurrentUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:               true,
      email:            true,
      name:             true,
      bio:              true,
      avatarUrl:        true,
      role:             true,
      isVerified:       true,
      createdAt:        true,
      securityQuestion: true,
      skillsTagged: {
        include: { skill: true },
        orderBy: { level: "desc" },
      },
    },
  });
}

/** Shape returned by GET/PATCH /api/users/me. */
const ME_SELECT = {
  id: true, name: true, email: true, username: true, bio: true, avatarUrl: true, role: true,
} as const;

/**
 * Thông tin tài khoản của current user (cho /api/users/me).
 */
export async function getMe(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: ME_SELECT });
}

/**
 * Cập nhật profile (name, bio, avatarUrl). Chỉ ghi các key có mặt; null = xoá giá trị.
 */
export async function updateUserProfile(
  userId: string,
  data: { name?: string; bio?: string | null; avatarUrl?: string | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: ME_SELECT,
  });
}

// -- Skills -----------------------------------------------------------------

/**
 * Thêm skill (theo id) cho user. Nếu đã có thì cập nhật level.
 * Trả về null nếu skill không tồn tại — không bao giờ tạo Skill mới.
 */
export async function upsertUserSkill(userId: string, skillId: string, level: number) {
  const skill = await prisma.skill.findUnique({ where: { id: skillId }, select: { id: true } });
  if (!skill) return null;

  return prisma.userSkill.upsert({
    where:  { userId_skillId: { userId, skillId } },
    update: { level },
    create: { userId, skillId, level },
  });
}

/**
 * Xóa skill của user (không lỗi nếu user chưa có skill đó).
 */
export async function removeUserSkill(userId: string, skillId: string) {
  return prisma.userSkill.deleteMany({ where: { userId, skillId } });
}

// -- Portfolio --------------------------------------------------------------

/**
 * Lấy portfolio của user (bao gồm private nếu là chủ sở hữu).
 */
export async function getUserPortfolio(userId: string, isOwner = false) {
  return prisma.portfolio.findMany({
    where: {
      userId,
      ...(!isOwner && { isPublic: true }),
    },
    include: {
      project: { select: { id: true, slug: true, title: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
