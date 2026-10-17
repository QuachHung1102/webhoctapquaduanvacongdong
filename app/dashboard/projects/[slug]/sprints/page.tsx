import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { getProjectBySlug } from "@/lib/queries/project";
import { getProjectSprints, getProjectMembersForAssign } from "@/lib/queries/task";
import SprintManager from "@/components/dashboard/SprintManager";

export const metadata: Metadata = { title: "Quản lý Sprint — ProjectHub" };

export default async function SprintsPage({ params }: { params: Promise<{ slug: string }> }) {
  const authUser = await requireAuth();
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const isMentor = project.mentorId === authUser.id;
  if (!isMentor && authUser.role !== "ADMIN") redirect(`/dashboard/projects/${slug}`);

  const sprints = await getProjectSprints(project.id);
  const members = await getProjectMembersForAssign(project.id);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-1">
          <a href={`/dashboard/projects/${slug}`} className="hover:text-slate-600">{project.title}</a>
          {" / "}Quản lý Sprint
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Sprints & Tasks</h1>
        <p className="text-slate-500 text-sm mt-1">Tạo sprint và phân công task cho thành viên.</p>
      </div>
      <SprintManager
        projectId={project.id}
        projectSlug={slug}
        initialSprints={sprints.map((s) => ({
          id: s.id,
          name: s.name,
          goal: s.goal ?? "",
          startDate: s.startDate.toISOString().split("T")[0],
          endDate: s.endDate.toISOString().split("T")[0],
          isActive: s.isActive,
          taskCount: s._count.tasks,
        }))}
        members={members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl ?? null,
        }))}
      />
    </div>
  );
}
