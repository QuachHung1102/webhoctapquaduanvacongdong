import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/db";
import PortfolioManager from "@/components/dashboard/PortfolioManager";

export const metadata: Metadata = { title: "Portfolio của tôi — ProjectHub" };

export default async function PortfolioPage() {
  const authUser = await requireAuth();

  // Load current user's portfolio items (all, incl. private)
  const items = await prisma.portfolio.findMany({
    where: { userId: authUser.id },
    include: { project: { select: { id: true, slug: true, title: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Load projects the user is a member of (as source for portfolio)
  const memberships = await prisma.projectMember.findMany({
    where: { userId: authUser.id, isActive: true },
    include: { project: { select: { id: true, slug: true, title: true, category: true, status: true } } },
    orderBy: { joinedAt: "desc" },
  });

  // Also include projects mentor is managing (for mentors)
  const mentorProjects = authUser.role === "MENTOR" || authUser.role === "ADMIN"
    ? await prisma.project.findMany({
        where: { mentorId: authUser.id },
        select: { id: true, slug: true, title: true, category: true, status: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // De-duplicate projects available as portfolio sources
  const portfolioProjectIds = new Set(items.map((i) => i.projectId));
  const allProjects = [
    ...memberships.map((m) => m.project),
    ...mentorProjects,
  ].filter((p, idx, arr) => arr.findIndex((q) => q.id === p.id) === idx);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Portfolio của tôi</h1>
        <p className="text-slate-500 text-sm mt-1">
          Lưu lại các dự án nổi bật để hiển thị trên trang hồ sơ công khai.
        </p>
      </div>
      <PortfolioManager
        initialItems={items.map((i) => ({
          id: i.id,
          projectId: i.projectId,
          title: i.title,
          summary: i.summary,
          demoUrl: i.demoUrl ?? "",
          repoUrl: i.repoUrl ?? "",
          coverUrl: i.coverUrl ?? "",
          isPublic: i.isPublic,
          createdAt: i.createdAt.toISOString(),
          project: i.project,
        }))}
        availableProjects={allProjects}
        portfolioProjectIds={[...portfolioProjectIds]}
      />
    </div>
  );
}
