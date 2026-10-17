import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import {
  getLearnerStats,
  getMentorStats,
  getMyActiveTasks,
  getMyRecentApplications,
  getPendingApplicationsForMentor,
  getNotifications,
} from "@/lib/queries/dashboard";
import { CATEGORY_LABELS, TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/constants/app";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";

export const metadata: Metadata = { title: "Tổng quan — ProjectHub" };

// -- Stat Card -------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1">
      <span className={`text-3xl font-bold ${accent}`}>{value}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </div>
  );
}

// -- Application status -----------------------------------------------------

const APP_STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-700",
  ACCEPTED:  "bg-green-100 text-green-700",
  REJECTED:  "bg-red-100 text-red-700",
  WITHDRAWN: "bg-slate-100 text-slate-500",
};

const APP_STATUS_LABELS: Record<string, string> = {
  PENDING:   "Chờ duyệt",
  ACCEPTED:  "Đã nhận",
  REJECTED:  "Từ chối",
  WITHDRAWN: "Đã rút",
};

// -- Page -------------------------------------------------------------------

export default async function OverviewPage() {
  const user = await requireAuth();
  const isMentor = user.role === "MENTOR" || user.role === "ADMIN";

  const [stats, activeTasks, recentApps, pendingApps, recentNotifs] = await Promise.all([
    isMentor ? getMentorStats(user.id) : getLearnerStats(user.id),
    isMentor ? Promise.resolve([]) : getMyActiveTasks(user.id, 8),
    isMentor ? Promise.resolve([]) : getMyRecentApplications(user.id, 5),
    isMentor ? getPendingApplicationsForMentor(user.id, 8) : Promise.resolve([]),
    getNotifications(user.id, { limit: 5 }),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Xin chào, {user.name ?? "bạn"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Thống kê</h2>
        {isMentor ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Tổng dự án"      value={(stats as Awaited<ReturnType<typeof getMentorStats>>).totalProjects}       accent="text-indigo-600" />
            <StatCard label="Dự án đang chạy"  value={(stats as Awaited<ReturnType<typeof getMentorStats>>).activeProjects}      accent="text-orange-500" />
            <StatCard label="Đơn chờ duyệt"    value={(stats as Awaited<ReturnType<typeof getMentorStats>>).pendingApplications} accent="text-yellow-600" sub="cần xử lý" />
            <StatCard label="Thành viên tích lũy" value={(stats as Awaited<ReturnType<typeof getMentorStats>>).totalMembers}     accent="text-green-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard label="Dự án đang tham gia" value={(stats as Awaited<ReturnType<typeof getLearnerStats>>).activeProjects}     accent="text-indigo-600" />
            <StatCard label="Tasks còn lại"        value={(stats as Awaited<ReturnType<typeof getLearnerStats>>).pendingTasks}      accent="text-orange-500" />
            <StatCard label="Tasks đã xong"        value={(stats as Awaited<ReturnType<typeof getLearnerStats>>).completedTasks}   accent="text-green-600" />
            <StatCard label="Đơn đang chờ"         value={(stats as Awaited<ReturnType<typeof getLearnerStats>>).pendingApplications} accent="text-yellow-600" />
            <StatCard label="Lần được review"      value={(stats as Awaited<ReturnType<typeof getLearnerStats>>).totalReviews}     accent="text-purple-600" />
          </div>
        )}
      </section>

      {/* Learner: Active Tasks */}
      {!isMentor && activeTasks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Tasks đang làm</h2>
            <Link href="/dashboard/tasks" className="text-sm text-indigo-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {activeTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {task.project.title}{task.sprint ? ` · ${task.sprint.name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_PRIORITY_COLORS[task.priority] ?? ""}`}>
                    {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                  </span>
                  <span className="text-xs text-slate-500 hidden sm:inline">{TASK_STATUS_LABELS[task.status]}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Learner: Recent Applications */}
      {!isMentor && recentApps.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Đơn đăng ký gần đây</h2>
            <Link href="/dashboard/applications" className="text-sm text-indigo-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {recentApps.map((app) => (
              <div key={app.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {app.project.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {CATEGORY_LABELS[app.project.category] ?? app.project.category} ·{" "}
                    {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    APP_STATUS_COLORS[app.status]
                  }`}
                >
                  {APP_STATUS_LABELS[app.status]}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mentor: Pending Applications */}
      {isMentor && pendingApps.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Đơn chờ duyệt</h2>
            <Link href="/dashboard/applications" className="text-sm text-indigo-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {pendingApps.map((app) => (
              <div key={app.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={app.user.name} src={app.user.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{app.user.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {app.project.title} · {new Date(app.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <Link
                  href={`/dashboard/applications?project=${app.project.slug}`}
                  className="text-xs text-indigo-600 hover:underline shrink-0"
                >
                  Xem →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {isMentor && pendingApps.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500 text-sm">Không có đơn ứng tuyển nào đang chờ duyệt.</p>
          <Link
            href="/dashboard/projects"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Xem dự án tôi quản lý →
          </Link>
        </div>
      )}
      {!isMentor && activeTasks.length === 0 && recentApps.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500 text-sm">Chưa có hoạt động nào.</p>
          <Link
            href="/projects"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Khám phá dự án ngay →
          </Link>
        </div>
      )}

      {/* Recent Notifications */}
      {recentNotifs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-700">Thông báo gần đây</h2>
            <Link href="/dashboard/notifications" className="text-sm text-indigo-600 hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {recentNotifs.map((n) => (
              <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.isRead ? "bg-indigo-50/40" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${!n.isRead ? "font-semibold text-slate-800" : "text-slate-700"}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-slate-400 mt-0.5 truncate">{n.message}</p>}
                </div>
                {n.link && (
                  <Link href={n.link} className="text-xs text-indigo-600 hover:underline shrink-0">Xem →</Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
