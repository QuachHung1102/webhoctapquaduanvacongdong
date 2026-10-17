import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { getProjectBySlug } from "@/lib/queries/project";
import { prisma } from "@/lib/db";
import { canManageProject } from "@/lib/permissions";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  DIFFICULTY_LABELS,
  MEMBER_ROLE_LABELS,
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/constants/app";
import Avatar from "@/components/ui/Avatar";
import ProjectEditForm from "@/components/dashboard/ProjectEditForm";
import ProjectStatusManager from "@/components/dashboard/ProjectStatusManager";
import MemberActions from "@/components/dashboard/MemberActions";
import ProjectOutputForm from "@/components/dashboard/ProjectOutputForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return { title: project ? `${project.title} — Workspace` : "Workspace — ProjectHub" };
}

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const authUser = await requireAuth();
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  // "Mentor" here means whoever may manage the project: its mentor, or any admin.
  const isMentor = canManageProject(authUser, project);
  const isMember = project.members.some((m) => m.user.id === authUser.id);
  if (!isMentor && !isMember) notFound();

  const activeSprint = project.sprints.find((s) => s.isActive) ?? project.sprints[0] ?? null;
  const myTasks = activeSprint?.tasks.filter((t) => t.assignee?.id === authUser.id) ?? [];
  const allTasks = activeSprint?.tasks ?? [];
  const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  // Pending applications for THIS project only
  const pendingApplications = isMentor
    ? await prisma.application.findMany({
        where:   { projectId: project.id, status: "PENDING" },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
        take:    3,
      })
    : [];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb + header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Link href="/dashboard/projects" className="hover:text-slate-600">Dự án của tôi</Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">{project.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-slate-500">{CATEGORY_LABELS[project.category]}</span>
            <span className="text-slate-300">•</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[project.status] ?? ""}`}>
              {STATUS_LABELS[project.status]}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">{DIFFICULTY_LABELS[project.difficulty]}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">{project.timeline} tuần</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isMentor && (
            <Link
              href={`/dashboard/projects/${slug}/sprints`}
              className="bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Quản lý Sprint
            </Link>
          )}
          <Link
            href={`/dashboard/projects/${slug}/kanban`}
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Mở Kanban Board
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {isMentor && (
            <ProjectEditForm
              slug={slug}
              project={{
                title: project.title,
                description: project.description,
                outputGoal: project.outputGoal,
                coverImageUrl: project.coverImageUrl,
              }}
            />
          )}

          {!activeSprint && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-500">
              Dự án chưa có sprint nào.{" "}
              {isMentor ? (
                <Link href={`/dashboard/projects/${slug}/sprints`} className="font-medium text-indigo-600 hover:underline">
                  Tạo sprint đầu tiên
                </Link>
              ) : (
                "Mentor sẽ tạo sprint và giao task khi dự án bắt đầu."
              )}
            </div>
          )}

          {/* Sprint progress */}
          {activeSprint && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-800">{activeSprint.name}</h2>
                <span className="text-xs bg-green-50 text-green-600 font-medium px-2 py-0.5 rounded-full">Đang chạy</span>
              </div>
              {activeSprint.goal && (
                <p className="text-sm text-slate-500 mb-4">{activeSprint.goal}</p>
              )}
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Tiến độ: {doneTasks}/{allTasks.length} tasks</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>

              {/* Task status breakdown */}
              {allTasks.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const).map((s) => {
                    const count = allTasks.filter((t) => t.status === s).length;
                    return (
                      <div key={s} className="bg-slate-50 rounded-lg py-2">
                        <div className="font-bold text-slate-700 text-base">{count}</div>
                        <div className="text-slate-400 mt-0.5">{TASK_STATUS_LABELS[s]}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* My tasks */}
          {!isMentor && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-800 mb-4">Task của tôi trong sprint này</h2>
              {myTasks.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Không có task nào được giao cho bạn.{" "}
                  <Link href={`/dashboard/projects/${slug}/kanban`} className="text-indigo-600 hover:underline">Mở Kanban</Link>
                </p>
              ) : (
                <div className="space-y-2">
                  {myTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 border border-slate-100 rounded-lg px-3 py-2.5">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        task.priority === "URGENT" ? "bg-red-500"
                        : task.priority === "HIGH" ? "bg-orange-400"
                        : task.priority === "MEDIUM" ? "bg-indigo-400"
                        : "bg-slate-300"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-slate-400">{TASK_STATUS_LABELS[task.status]}</span>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${TASK_PRIORITY_COLORS[task.priority] ?? ""}`}>
                            {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mentor: pending applications */}
          {isMentor && pendingApplications.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800">Đơn chờ duyệt</h2>
                <Link href={`/dashboard/applications?project=${slug}`} className="text-xs text-indigo-600 hover:underline">
                  Xem tất cả
                </Link>
              </div>
              <div className="space-y-2">
                {pendingApplications.map((app) => (
                  <div key={app.id} className="flex items-center gap-3 border border-slate-100 rounded-lg px-3 py-2.5">
                    <Avatar name={app.user.name} src={app.user.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{app.user.name}</p>
                      <p className="text-xs text-slate-400">Vai trò: {MEMBER_ROLE_LABELS[app.role] ?? app.role}</p>
                    </div>
                    <Link
                      href={`/dashboard/applications?project=${slug}`}
                      className="text-xs text-indigo-600 hover:underline shrink-0"
                    >
                      Duyệt
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Members */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-800 mb-4">
              Thành viên ({project.members.length}/{project.maxMembers})
            </h2>
            <div className="space-y-2.5">
              {/* Mentor */}
              <div className="flex items-center gap-2.5">
                <Avatar name={project.mentor.name} src={project.mentor.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{project.mentor.name}</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">Mentor</span>
              </div>
              {project.members.filter((m) => m.user.id !== project.mentorId).map((member) => (
                <div key={member.user.id} className="flex items-center gap-2.5">
                  <Avatar name={member.user.name} src={member.user.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{member.user.name}</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">{MEMBER_ROLE_LABELS[member.role] ?? member.role}</span>
                  {(isMentor || member.user.id === authUser.id) && (
                    <MemberActions
                      slug={slug}
                      userId={member.user.id}
                      userName={member.user.name ?? ""}
                      isSelf={member.user.id === authUser.id}
                      isMentor={isMentor}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status manager — mentor only */}
          {isMentor && (
            <ProjectStatusManager
              slug={slug}
              currentStatus={project.status as "RECRUITING" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED" | "UPCOMING" | "CANCELLED"}
            />
          )}

          {/* Output submission */}
          {(isMentor || (isMember && ["REVIEWING", "COMPLETED"].includes(project.status))) && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <ProjectOutputForm
                slug={slug}
                currentOutputUrl={(project as { outputUrl?: string | null }).outputUrl}
                canSubmit={isMentor || ["REVIEWING", "COMPLETED"].includes(project.status)}
              />
            </div>
          )}

          {/* Skills */}
          {project.skills.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-semibold text-slate-800 mb-3">Kỹ năng</h2>
              <div className="flex flex-wrap gap-1.5">
                {project.skills.map((ps) => (
                  <span key={ps.skill.id} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                    {ps.skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
            <h2 className="font-semibold text-slate-800 mb-3">Liên kết nhanh</h2>
            <Link
              href={`/dashboard/projects/${slug}/kanban`}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 transition-colors"
            >
              Kanban Board
            </Link>
            <Link
              href={`/projects/${slug}`}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 transition-colors"
            >
              Trang công khai
            </Link>
            {/* The reviews page is for participants; an admin who is neither mentor nor member has nothing to review. */}
            {(isMember || project.mentorId === authUser.id) && (
              <Link
                href={`/dashboard/projects/${slug}/reviews`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 transition-colors"
              >
                Đánh giá thành viên
              </Link>
            )}
            {isMentor && (
              <Link
                href={`/dashboard/projects/${slug}/sprints`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-3 py-2 transition-colors"
              >
                Quản lý Sprint
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
