import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { getMyActiveTasks } from "@/lib/queries/dashboard";
import {
  TASK_PRIORITY_COLORS as PRIORITY_COLORS,
  TASK_PRIORITY_LABELS as PRIORITY_LABELS,
  TASK_STATUS_LABELS as STATUS_LABELS,
} from "@/constants/app";

export const metadata: Metadata = { title: "Công việc của tôi — ProjectHub" };

const STATUS_COLORS: Record<string, string> = {
  TODO:        "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-indigo-50 text-indigo-600",
  IN_REVIEW:   "bg-purple-50 text-purple-600",
  DONE:        "bg-green-50 text-green-600",
};

export default async function TasksPage() {
  const authUser = await requireAuth();
  const tasks = await getMyActiveTasks(authUser.id, 30);

  // Group tasks by project
  const grouped = tasks.reduce<Record<string, { title: string; slug: string; tasks: typeof tasks }>>((acc, task) => {
    const key = task.project.id;
    if (!acc[key]) {
      acc[key] = { title: task.project.title, slug: task.project.slug, tasks: [] };
    }
    acc[key].tasks.push(task);
    return acc;
  }, {});

  const groups = Object.values(grouped);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Công việc của tôi</h1>
        <p className="text-slate-500 text-sm mt-1">
          Các task đang được giao trong sprint hiện tại
        </p>
      </div>

      {/* Summary bar */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(["TODO", "IN_PROGRESS", "IN_REVIEW"] as const).map((status) => {
            const count = tasks.filter((t) => t.status === status).length;
            return (
              <div key={status} className={`rounded-xl px-4 py-3 text-center ${STATUS_COLORS[status]}`}>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs font-medium mt-0.5">{STATUS_LABELS[status]}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-slate-600 font-medium">Không có task nào đang chờ.</p>
          <p className="text-slate-400 text-sm mt-1">
            Bạn chưa được giao task nào trong sprint đang chạy, hoặc đã làm xong hết.
          </p>
          <Link href="/dashboard/projects" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
            Xem dự án của tôi
          </Link>
        </div>
      )}

      {/* Task groups */}
      {groups.map((group) => (
        <div key={group.slug} className="space-y-2">
          {/* Project title */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              {group.title}
            </h2>
            <Link
              href={`/dashboard/projects/${group.slug}/kanban`}
              className="text-xs text-indigo-600 hover:underline"
            >
              Xem Kanban →
            </Link>
          </div>

          {/* Tasks */}
          {group.tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              {/* Priority dot */}
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                task.priority === "URGENT" ? "bg-red-500"
                : task.priority === "HIGH"     ? "bg-orange-400"
                : task.priority === "MEDIUM"   ? "bg-indigo-400"
                : "bg-slate-300"
              }`} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 line-clamp-2">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  {task.sprint && (
                    <span className="text-xs text-slate-400">
                      Sprint: {task.sprint.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
