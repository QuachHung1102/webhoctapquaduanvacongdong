import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { getProjectBySlug } from "@/lib/queries/project";
import { getActiveSprint, getProjectSprints } from "@/lib/queries/task";
import { canManageProject } from "@/lib/permissions";
import KanbanBoard from "@/components/dashboard/KanbanBoard";

export const metadata: Metadata = { title: "Kanban Board — ProjectHub" };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sprint?: string }>;
}

export default async function KanbanPage({ params, searchParams }: PageProps) {
  const authUser = await requireAuth();
  const { slug } = await params;
  const { sprint: sprintId } = await searchParams;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  // Members, the mentor and admins may open the board
  const canManage = canManageProject(authUser, project);
  const isMember = project.members.some((m) => m.user.id === authUser.id);
  if (!isMember && !canManage) notFound();

  const [allSprints, activeSprint] = await Promise.all([
    getProjectSprints(project.id),
    !sprintId ? getActiveSprint(project.id) : null,
  ]);

  // Determine which sprint to show
  // A ?sprint= that is not one of this project's sprints is ignored (tasks would be created against it).
  let currentSprintId = project.sprints.some((s) => s.id === sprintId) ? sprintId : undefined;
  if (!currentSprintId && activeSprint) currentSprintId = activeSprint.id;
  if (!currentSprintId && allSprints.length > 0) currentSprintId = allSprints[0].id;

  // Get tasks for selected sprint
  const selectedSprintData = currentSprintId
    ? project.sprints.find((s) => s.id === currentSprintId) ?? null
    : null;

  const tasks = (selectedSprintData?.tasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    position: t.position,
    assignee: t.assignee,
    dueDate: t.dueDate?.toISOString() ?? null,
    createdById: t.createdById,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Link href="/dashboard/projects" className="hover:text-slate-600">Dự án</Link>
            <span>/</span>
            <Link href={`/dashboard/projects/${slug}`} className="hover:text-slate-600">{project.title}</Link>
            <span>/</span>
            <span>Kanban</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{project.title} — Kanban Board</h1>
        </div>
        <Link
          href={`/dashboard/projects/${slug}`}
          className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          ← Workspace
        </Link>
      </div>

      {/* Sprint selector */}
      {allSprints.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500">Sprint:</span>
          {allSprints.map((sprint) => (
            <Link
              key={sprint.id}
              href={`/dashboard/projects/${slug}/kanban?sprint=${sprint.id}`}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                sprint.id === currentSprintId
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
              }`}
            >
              {sprint.name}
              {sprint.isActive && <span className="ml-1 text-green-400">•</span>}
            </Link>
          ))}
        </div>
      )}

      {/* No sprint */}
      {allSprints.length === 0 && (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-xl text-slate-500">
          <p>Chưa có sprint nào. {canManage ? "Hãy tạo sprint đầu tiên để bắt đầu thêm task." : "Mentor cần tạo sprint đầu tiên."}</p>
          {canManage && (
            <Link
              href={`/dashboard/projects/${slug}/sprints`}
              className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Tạo sprint đầu tiên
            </Link>
          )}
        </div>
      )}

      {/* Kanban */}
      {currentSprintId && (
        <KanbanBoard
          key={currentSprintId}
          initialTasks={tasks}
          projectId={project.id}
          sprintId={currentSprintId}
          members={project.members.map((m) => ({ id: m.user.id, name: m.user.name, avatarUrl: m.user.avatarUrl }))}
          currentUserId={authUser.id}
          canManage={canManage}
        />
      )}
    </div>
  );
}
