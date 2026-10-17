import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { getUserProjects, getMentorProjects } from "@/lib/queries/project";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  MEMBER_ROLE_LABELS,
  projectCover,
} from "@/constants/app";

export const metadata: Metadata = { title: "Dự án của tôi — ProjectHub" };

// ---- helpers ---------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[difficulty] ?? "bg-slate-100 text-slate-600"}`}>
      {DIFFICULTY_LABELS[difficulty] ?? difficulty}
    </span>
  );
}

// ---- page ------------------------------------------------------------------

export default async function DashboardProjectsPage() {
  const authUser = await requireAuth();
  // Same rule as the Sidebar: admins get the mentor view.
  const isMentor = authUser.role === "MENTOR" || authUser.role === "ADMIN";

  const projects = isMentor
    ? await getMentorProjects(authUser.id)
    : await getUserProjects(authUser.id);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isMentor ? "Dự án tôi quản lý" : "Dự án của tôi"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isMentor
              ? "Quản lý và theo dõi tiến độ các dự án bạn đang mentor"
              : "Các dự án bạn đang tham gia"}
          </p>
        </div>
        {isMentor && (
          <Link
            href="/dashboard/projects/new"
            className="shrink-0 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            + Tạo dự án mới
          </Link>
        )}
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-slate-600 font-medium">
            {isMentor ? "Bạn chưa tạo dự án nào." : "Bạn chưa tham gia dự án nào."}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {isMentor
              ? "Hãy tạo dự án đầu tiên để bắt đầu mentor."
              : "Khám phá và đăng ký tham gia dự án phù hợp với bạn."}
          </p>
          <Link
            href={isMentor ? "/dashboard/projects/new" : "/projects"}
            className="mt-4 inline-block bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {isMentor ? "Tạo dự án mới" : "Khám phá dự án"}
          </Link>
        </div>
      )}

      {/* Project grid */}
      {projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            // Pending application count (mentor view)
            const pendingCount =
              "applications" in project ? (project.applications as { id: string }[]).length : 0;
            // Member role (learner view)
            const myRole =
              "members" in project && (project.members as { role: string }[]).length > 0
                ? (project.members as { role: string }[])[0].role
                : null;

            return (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.slug}`}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all flex flex-col"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={projectCover(project)}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-video object-cover bg-slate-100"
                />
                <div className="p-5 flex flex-col gap-3 flex-1">
                  {/* Category + status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[project.category] ?? project.category}
                    </span>
                    <StatusBadge status={project.status} />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors line-clamp-2 leading-snug">
                    {project.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-500 line-clamp-2 flex-1">
                    {project.description}
                  </p>

                  {/* Skills */}
                  {project.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.skills.slice(0, 3).map((s) => (
                        <span key={s.skill.name} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                          {s.skill.name}
                        </span>
                      ))}
                      {project.skills.length > 3 && (
                        <span className="text-xs text-slate-400">+{project.skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <DifficultyBadge difficulty={project.difficulty} />
                      <span>{project.timeline} tuần</span>
                      <span>{project._count.members}/{project.maxMembers} TV</span>
                    </div>
                    {isMentor && pendingCount > 0 && (
                      <span className="bg-orange-100 text-orange-600 font-medium px-2 py-0.5 rounded-full">
                        {pendingCount} đơn mới
                      </span>
                    )}
                    {!isMentor && myRole && (
                      <span className="bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">
                        {MEMBER_ROLE_LABELS[myRole] ?? myRole}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Explore more (learner only) */}
      {!isMentor && projects.length > 0 && (
        <div className="text-center pt-2">
          <Link href="/projects" className="text-sm text-indigo-600 hover:underline">
            Khám phá thêm dự án →
          </Link>
        </div>
      )}
    </div>
  );
}
