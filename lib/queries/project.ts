/**
 * lib/queries/project.ts
 * Các query tái sử dụng cho dự án — dùng trong Server Components và API routes.
 */
import { prisma } from "@/lib/db";
import type { ProjectCategory, ProjectStatus, Difficulty } from "@/app/generated/prisma/client";

// -- Types ------------------------------------------------------------------

export interface ProjectFilter {
  category?:   ProjectCategory;
  status?:     ProjectStatus;
  difficulty?: Difficulty;
  search?:     string;      // Tìm theo title / description
  mentorId?:   string;
  page?:       number;
  pageSize?:   number;
}

const PROJECT_CARD_SELECT = {
  id:           true,
  slug:         true,
  title:        true,
  description:  true,
  category:     true,
  status:       true,
  difficulty:   true,
  timeline:     true,
  maxMembers:   true,
  coverImageUrl: true,
  createdAt:    true,
  mentor: {
    select: { id: true, name: true, avatarUrl: true },
  },
  skills: {
    select: { skill: { select: { name: true } } },
    take: 5,
  },
  _count: {
    select: { members: true, applications: true },
  },
} as const;

// -- Queries ----------------------------------------------------------------

/**
 * Lấy danh sách dự án với filter + pagination.
 * Dùng cho trang /projects listing và dashboard/explore.
 */
export async function getProjects(filter: ProjectFilter = {}) {
  const { category, status, difficulty, search, mentorId, page = 1, pageSize = 12 } = filter;

  const where = {
    ...(category   && { category }),
    ...(status     && { status }),
    ...(difficulty && { difficulty }),
    ...(mentorId   && { mentorId }),
    ...(search && {
      OR: [
        { title:       { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select:  PROJECT_CARD_SELECT,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Lấy chi tiết một dự án theo slug.
 * Trả về null nếu không tìm thấy.
 */
export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      mentor: {
        select: { id: true, name: true, avatarUrl: true, bio: true, username: true },
      },
      skills: {
        include: { skill: true },
      },
      members: {
        where:   { isActive: true },
        include: { user: { select: { id: true, name: true, avatarUrl: true, username: true } } },
        orderBy: { joinedAt: "asc" },
      },
      sprints: {
        orderBy: { startDate: "asc" },
        include: {
          tasks: {
            orderBy: [{ status: "asc" }, { position: "asc" }],
            include: {
              assignee: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      },
      _count: {
        select: { members: true, applications: true },
      },
    },
  });
}

/**
 * Dự án mà user đang tham gia (active memberships).
 */
export async function getUserProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      members: { some: { userId, isActive: true } },
    },
    select: {
      ...PROJECT_CARD_SELECT,
      members: {
        where:  { userId },
        select: { role: true, joinedAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/**
 * Dự án mentor đang quản lý.
 */
export async function getMentorProjects(mentorId: string) {
  return prisma.project.findMany({
    where: { mentorId },
    select: {
      ...PROJECT_CARD_SELECT,
      applications: {
        where:  { status: "PENDING" },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Kiểm tra user đã apply / đã là member của dự án chưa.
 */
export async function getUserProjectStatus(userId: string, projectId: string) {
  const [application, membership] = await Promise.all([
    prisma.application.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { status: true, role: true },
    }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true, isActive: true },
    }),
  ]);
  return { application, membership };
}

/**
 * True nếu user là thành viên đang hoạt động của dự án.
 */
export async function isActiveMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where:  { projectId_userId: { projectId, userId } },
    select: { isActive: true },
  });
  return !!member?.isActive;
}

/**
 * Các mốc ngày đi kèm khi đổi trạng thái: endDate khi hoàn thành,
 * startDate khi bắt đầu lần đầu (chưa có startDate).
 */
export function statusDates(
  next: ProjectStatus,
  current: { status: ProjectStatus; startDate: Date | null },
) {
  return {
    ...(next === "COMPLETED" && current.status !== "COMPLETED" && { endDate: new Date() }),
    ...(next === "IN_PROGRESS" && !current.startDate && { startDate: new Date() }),
  };
}
