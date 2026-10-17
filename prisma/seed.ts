import "dotenv/config";
import {
  PrismaClient,
  type ProjectCategory,
  type ProjectStatus,
  type Difficulty,
  type TaskStatus,
  type TaskPriority,
  type ApplicationStatus,
  type MemberRole,
  type NotificationType,
} from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// -- Helpers ------------------------------------------------------------------

function loadJson<T>(filename: string): T {
  return JSON.parse(
    readFileSync(join(__dirname, "seedData", filename), "utf-8"),
  ) as T;
}

// -- Types matching JSON shape ------------------------------------------------

interface SkillSeed {
  name: string;
  category?: string;
}
interface BadgeSeed {
  name: string;
  description: string;
}
interface UserSeed {
  email: string;
  password: string;
  name: string;
  bio: string;
  role: string;
  isVerified: boolean;
}
interface ProjectSeed {
  id: string;
  slug: string;
  title: string;
  description: string;
  outputGoal: string;
  category: ProjectCategory;
  status: ProjectStatus;
  difficulty: Difficulty;
  timeline: number;
  maxMembers: number;
  mentorEmail: string;
  skills: string[];
}
interface ApplicationSeed {
  projectId: string;
  userEmail: string;
  role: MemberRole;
  message?: string;
  status: ApplicationStatus;
}
interface TaskSeed {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  assigneeEmail: string;
  createdByEmail: string;
}
interface SprintSeed {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDaysOffset: number; // ngày bắt đầu tính từ now()
  durationDays: number;
  isActive: boolean;
  tasks: TaskSeed[];
}

interface ActivitySeed {
  userSkills: { userEmail: string; skill: string; level: number }[];
  reviews: { projectId: string; reviewerEmail: string; revieweeEmail: string; rating: number; comment: string }[];
  mentorReviews: { projectId: string; mentorEmail: string; reviewerEmail: string; rating: number; comment: string }[];
  portfolios: { projectId: string; userEmail: string; title: string; summary: string }[];
  userBadges: { userEmail: string; badge: string }[];
  notifications: { userEmail: string; type: NotificationType; title: string; message: string; link: string; isRead: boolean }[];
}

// Demo accounts can walk through "Quên mật khẩu" with this pair. Admin is left without one on purpose.
const DEMO_SECURITY_QUESTION = "Tên nền tảng bạn đang dùng là gì?";
const DEMO_SECURITY_ANSWER = "projecthub";

const publicFileExists = (path: string) => existsSync(join(__dirname, "..", "public", path));

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("🌱 Seeding database...\n");

  // -- Load JSON seed data -----------------------------------------------------
  const skillsData = loadJson<SkillSeed[]>("skills.json");
  const badgesData = loadJson<BadgeSeed[]>("badges.json");
  const usersData = loadJson<UserSeed[]>("users.json");
  const projectsData = loadJson<ProjectSeed[]>("projects.json");
  const applicationsData = loadJson<ApplicationSeed[]>("applications.json");
  const sprintsData = loadJson<SprintSeed[]>("tasks.json");
  const activity = loadJson<ActivitySeed>("activity.json");

  // -- Skills ------------------------------------------------------------------
  const skills = await Promise.all(
    skillsData.map((s) =>
      prisma.skill.upsert({
        where: { name: s.name },
        update: { category: s.category },
        create: { name: s.name, category: s.category },
      }),
    ),
  );
  const skillMap = Object.fromEntries(skills.map((s) => [s.name, s.id]));
  console.log(`  ✓ ${skills.length} skills`);

  // -- Badges ------------------------------------------------------------------
  await Promise.all(
    badgesData.map((b) =>
      prisma.badge.upsert({ where: { name: b.name }, update: {}, create: b }),
    ),
  );
  console.log(`  ✓ ${badgesData.length} badges`);

  // -- Users -------------------------------------------------------------------
  const userRecords = await Promise.all(
    usersData.map(async ({ password, ...rest }) => {
      const passwordHash = await bcrypt.hash(password, 12);
      // Derive username from email prefix (e.g. "mentor.hung@..." -> "mentor-hung")
      const username = rest.email.split("@")[0].replace(/\./g, "-");
      return prisma.user.upsert({
        where: { email: rest.email },
        update: { name: rest.name, bio: rest.bio, username },
        create: {
          ...rest,
          username,
          role: rest.role as "LEARNER" | "MENTOR" | "ADMIN",
          passwordHash,
        },
      });
    }),
  );
  const userMap = Object.fromEntries(userRecords.map((u) => [u.email, u.id]));
  // Avatar + security question: filled only where still empty, so re-seeding never clobbers edits
  const demoAnswerHash = await bcrypt.hash(DEMO_SECURITY_ANSWER, 12);
  for (const u of userRecords) {
    const avatar = `/images/avatars/${u.username}.svg`;
    if (publicFileExists(avatar)) {
      await prisma.user.updateMany({ where: { id: u.id, avatarUrl: null }, data: { avatarUrl: avatar } });
    }
    if (u.role !== "ADMIN") {
      await prisma.user.updateMany({
        where: { id: u.id, securityQuestion: null },
        data: { securityQuestion: DEMO_SECURITY_QUESTION, securityAnswerHash: demoAnswerHash },
      });
    }
  }
  console.log(`  ✓ ${userRecords.length} users (with usernames)`);

  // -- Projects ----------------------------------------------------------------
  for (const proj of projectsData) {
    const { mentorEmail, skills: skillNames, ...rest } = proj;
    await prisma.project.upsert({
      where: { id: rest.id },
      update: { status: rest.status, updatedAt: new Date() },
      create: {
        ...rest,
        mentor: { connect: { id: userMap[mentorEmail] } },
        skills: {
          create: skillNames
            .filter((name) => skillMap[name])
            .map((name) => ({ skill: { connect: { id: skillMap[name] } } })),
        },
      },
    });
  }
  for (const proj of projectsData) {
    const cover = `/images/projects/${proj.slug}.jpg`;
    if (publicFileExists(cover)) {
      await prisma.project.updateMany({ where: { id: proj.id, coverImageUrl: null }, data: { coverImageUrl: cover } });
    }
  }
  console.log(`  ✓ ${projectsData.length} projects`);

  // -- Applications + auto-create Memberships for ACCEPTED --------------------
  let memberCount = 0;
  for (const app of applicationsData) {
    const userId = userMap[app.userEmail];
    const projectId = app.projectId;
    if (!userId) continue;

    await prisma.application.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: { status: app.status },
      create: {
        projectId,
        userId,
        role: app.role,
        message: app.message,
        status: app.status,
      },
    });

    // Accepted -> also create/ensure ProjectMember entry
    if (app.status === "ACCEPTED") {
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId } },
        update: {},
        create: {
          projectId,
          userId,
          role: app.role,
          isActive: true,
        },
      });
      memberCount++;
    }
  }

  // Mentor không phải ProjectMember — khớp với dự án tạo qua app, để số "x/max thành viên" đúng.
  // Dọn các dòng mentor-là-thành-viên mà bản seed cũ đã tạo.
  for (const proj of projectsData) {
    await prisma.projectMember.deleteMany({
      where: { projectId: proj.id, userId: userMap[proj.mentorEmail] },
    });
  }
  console.log(
    `  ✓ ${applicationsData.length} applications  (${memberCount} members auto-created)`,
  );

  // -- Sprints & Tasks ---------------------------------------------------------
  let totalTasks = 0;
  for (const sprintSeed of sprintsData) {
    const now = new Date();
    const startDate = new Date(
      now.getTime() + sprintSeed.startDaysOffset * 86_400_000,
    );
    const endDate = new Date(
      startDate.getTime() + sprintSeed.durationDays * 86_400_000,
    );

    const sprint = await prisma.sprint.upsert({
      where: { id: sprintSeed.id },
      update: { isActive: sprintSeed.isActive },
      create: {
        id: sprintSeed.id,
        projectId: sprintSeed.projectId,
        name: sprintSeed.name,
        goal: sprintSeed.goal,
        startDate,
        endDate,
        isActive: sprintSeed.isActive,
      },
    });

    for (const task of sprintSeed.tasks) {
      await prisma.task.upsert({
        where: { id: task.id },
        update: { status: task.status },
        create: {
          id: task.id,
          projectId: sprintSeed.projectId,
          sprintId: sprint.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          position: task.position,
          assigneeId: userMap[task.assigneeEmail],
          createdById: userMap[task.createdByEmail],
        },
      });
      totalTasks++;
    }
  }
  console.log(`  ✓ ${sprintsData.length} sprint(s) + ${totalTasks} tasks`);

  // -- Activity: skills, reviews, portfolio, badges, notifications --------------
  for (const us of activity.userSkills) {
    const userId = userMap[us.userEmail];
    const skillId = skillMap[us.skill];
    if (!userId || !skillId) continue;
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId, skillId } },
      update: {},
      create: { userId, skillId, level: us.level },
    });
  }

  for (const r of activity.reviews) {
    const reviewerId = userMap[r.reviewerEmail];
    const revieweeId = userMap[r.revieweeEmail];
    if (!reviewerId || !revieweeId) continue;
    await prisma.review.upsert({
      where: { projectId_reviewerId_revieweeId: { projectId: r.projectId, reviewerId, revieweeId } },
      update: {},
      create: { projectId: r.projectId, reviewerId, revieweeId, rating: r.rating, comment: r.comment },
    });
  }

  for (const r of activity.mentorReviews) {
    const mentorId = userMap[r.mentorEmail];
    const reviewerId = userMap[r.reviewerEmail];
    if (!mentorId || !reviewerId) continue;
    await prisma.mentorReview.upsert({
      where: { mentorId_reviewerId_projectId: { mentorId, reviewerId, projectId: r.projectId } },
      update: {},
      create: { mentorId, reviewerId, projectId: r.projectId, rating: r.rating, comment: r.comment },
    });
  }

  const projectById = Object.fromEntries(projectsData.map((p) => [p.id, p]));
  for (const p of activity.portfolios) {
    const userId = userMap[p.userEmail];
    if (!userId) continue;
    const cover = `/images/projects/${projectById[p.projectId].slug}.jpg`;
    await prisma.portfolio.upsert({
      where: { userId_projectId: { userId, projectId: p.projectId } },
      update: {},
      create: {
        userId,
        projectId: p.projectId,
        title: p.title,
        summary: p.summary,
        coverUrl: publicFileExists(cover) ? cover : null,
      },
    });
  }

  const badges = await prisma.badge.findMany({ select: { id: true, name: true } });
  const badgeMap = Object.fromEntries(badges.map((bd) => [bd.name, bd.id]));
  for (const ub of activity.userBadges) {
    const userId = userMap[ub.userEmail];
    const badgeId = badgeMap[ub.badge];
    if (!userId || !badgeId) continue;
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId } },
      update: {},
      create: { userId, badgeId },
    });
  }

  // Notifications have no natural key: seed them only for users who have none yet.
  let notifCount = 0;
  for (const email of new Set(activity.notifications.map((n) => n.userEmail))) {
    const userId = userMap[email];
    if (!userId || (await prisma.notification.count({ where: { userId } })) > 0) continue;
    const rows = activity.notifications
      .filter((n) => n.userEmail === email)
      .map((n) => ({ userId, type: n.type, title: n.title, message: n.message, link: n.link, isRead: n.isRead }));
    await prisma.notification.createMany({ data: rows });
    notifCount += rows.length;
  }
  console.log(
    `  ✓ ${activity.userSkills.length} user skills, ${activity.reviews.length} reviews, ${activity.mentorReviews.length} mentor reviews, ${activity.portfolios.length} portfolio items, ${activity.userBadges.length} badges, ${notifCount} new notifications`,
  );

  // Done
  console.log("\n✅ Seed hoàn thành!");
  console.log("   📇 Demo accounts (pw: Demo@1234):");
  usersData
    .filter((u) => u.role !== "ADMIN")
    .forEach((u) => console.log(`      ${u.email.padEnd(38)} [${u.role}]`));
  console.log(
    `      admin@projecthub.vn                    [ADMIN] (pw: Admin@1234)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
