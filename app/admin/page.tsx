import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import Avatar from "@/components/ui/Avatar";
import { STATUS_COLORS, STATUS_LABELS, USER_ROLE_LABELS } from "@/constants/app";

export const metadata: Metadata = { title: "Tổng quan — Admin" };

function Stat({ label, value, sub, href }: { label: string; value: number | string; sub?: string; href?: string }) {
  const body = (
    <>
      <span className="text-3xl font-bold text-slate-900">{value}</span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </>
  );
  const cls = "bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-1";
  return href ? (
    <Link href={href} className={`${cls} hover:border-indigo-300 transition-colors`}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function AdminOverviewPage() {
  const [usersByRole, projectsByStatus, pendingApplications, tasksTotal, tasksDone, badgesAwarded, newestUsers, newestProjects] =
    await Promise.all([
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.project.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.application.count({ where: { status: "PENDING" } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: "DONE" } }),
      prisma.userBadge.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, avatarUrl: true, role: true, createdAt: true },
      }),
      prisma.project.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, slug: true, title: true, status: true, createdAt: true, mentor: { select: { name: true } } },
      }),
    ]);

  const roleCount = Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all]));
  const statusCount = Object.fromEntries(projectsByStatus.map((s) => [s.status, s._count._all]));
  const totalUsers = usersByRole.reduce((sum, r) => sum + r._count._all, 0);
  const totalProjects = projectsByStatus.reduce((sum, s) => sum + s._count._all, 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Tổng quan hệ thống</h1>
        <p className="text-sm text-slate-500 mt-0.5">Số liệu toàn nền tảng tại thời điểm hiện tại.</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Người dùng ({totalUsers})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.keys(USER_ROLE_LABELS).map((role) => (
            <Stat key={role} label={USER_ROLE_LABELS[role]} value={roleCount[role] ?? 0} href={`/admin/users?role=${role}`} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Dự án ({totalProjects})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.keys(STATUS_LABELS).map((status) => (
            <Stat key={status} label={STATUS_LABELS[status]} value={statusCount[status] ?? 0} href={`/admin/projects?status=${status}`} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Hoạt động</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat label="Đơn chờ duyệt" value={pendingApplications} sub="trên toàn hệ thống" />
          <Stat label="Task đã xong" value={`${tasksDone}/${tasksTotal}`} sub="hoàn thành / tổng số" />
          <Stat label="Badge đã trao" value={badgesAwarded} href="/admin/badges" />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Người dùng mới nhất</h2>
            <Link href="/admin/users" className="text-xs text-indigo-600 hover:underline">Xem tất cả</Link>
          </div>
          {newestUsers.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400">Chưa có người dùng nào.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {newestUsers.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/admin/users?search=${encodeURIComponent(u.email)}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-slate-600">{USER_ROLE_LABELS[u.role] ?? u.role}</p>
                      <p className="text-xs text-slate-400">{u.createdAt.toLocaleDateString("vi-VN")}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Dự án mới nhất</h2>
            <Link href="/admin/projects" className="text-xs text-indigo-600 hover:underline">Xem tất cả</Link>
          </div>
          {newestProjects.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400">Chưa có dự án nào.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {newestProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/projects?search=${encodeURIComponent(p.title)}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {p.mentor.name} · {p.createdAt.toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
