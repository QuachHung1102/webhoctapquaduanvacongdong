import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getMyRecentApplications } from "@/lib/queries/dashboard";
import { CATEGORY_LABELS, MEMBER_ROLE_LABELS, projectCover } from "@/constants/app";
import PendingApplicationsList from "@/components/dashboard/PendingApplicationsList";
import WithdrawApplicationButton from "@/components/dashboard/WithdrawApplicationButton";

export const metadata: Metadata = { title: "Đơn ứng tuyển — ProjectHub" };

const LEARNER_STATUS_LABELS: Record<string, string> = {
  PENDING:   "Chờ duyệt",
  ACCEPTED:  "Đã chấp nhận",
  REJECTED:  "Đã từ chối",
  WITHDRAWN: "Đã rút",
};
const LEARNER_STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  ACCEPTED:  "bg-green-50 text-green-700 border-green-200",
  REJECTED:  "bg-red-50 text-red-700 border-red-200",
  WITHDRAWN: "bg-slate-50 text-slate-500 border-slate-200",
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const authUser = await requireAuth();
  const { project: projectSlug } = await searchParams;
  // Same rule as the Sidebar: admins get the mentor view.
  const isMentor = authUser.role === "MENTOR" || authUser.role === "ADMIN";

  if (isMentor) {
    // Without a filter: the projects this user mentors. With ?project=<slug>: that project,
    // which an admin may review even when someone else mentors it.
    const applications = await prisma.application.findMany({
      where: {
        status: "PENDING",
        project: projectSlug
          ? { slug: projectSlug, ...(authUser.role !== "ADMIN" && { mentorId: authUser.id }) }
          : { mentorId: authUser.id },
      },
      include: {
        user:    { select: { id: true, name: true, avatarUrl: true, bio: true } },
        project: { select: { id: true, slug: true, title: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });
    // Serialize dates for client component
    const serialized = applications.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    }));

    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Duyệt đơn ứng tuyển</h1>
          <p className="text-slate-500 text-sm mt-1">
            Xem xét và phê duyệt đơn đăng ký tham gia dự án của bạn
          </p>
        </div>

        {projectSlug && (
          <p className="text-sm text-slate-600">
            Đang lọc theo dự án{" "}
            <span className="font-medium text-slate-800">{applications[0]?.project.title ?? projectSlug}</span>.{" "}
            <Link href="/dashboard/applications" className="text-indigo-600 hover:underline">Xem tất cả đơn</Link>
          </p>
        )}

        {/* Stats */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-2xl font-bold text-orange-600">{applications.length}</span>
          <span className="text-orange-700">đơn đang chờ bạn duyệt</span>
        </div>

        {/* key: the list keeps decided rows in local state, so a different filter must start fresh */}
        <PendingApplicationsList key={projectSlug ?? ""} applications={serialized} />
      </div>
    );
  }

  // Learner view
  const applications = await getMyRecentApplications(authUser.id, 20);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Đơn ứng tuyển của tôi</h1>
        <p className="text-slate-500 text-sm mt-1">
          Theo dõi trạng thái các đơn đăng ký tham gia dự án
        </p>
      </div>

      {applications.length === 0 && (
        <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-xl">
          <p className="text-slate-600 font-medium">Bạn chưa nộp đơn ứng tuyển nào.</p>
          <p className="text-slate-400 text-sm mt-1">Khám phá các dự án và bắt đầu đăng ký.</p>
          <Link
            href="/projects"
            className="mt-4 inline-block bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Khám phá dự án
          </Link>
        </div>
      )}

      {applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className={`bg-white border rounded-xl p-4 flex items-start gap-3 sm:gap-4 ${LEARNER_STATUS_COLORS[app.status] ?? "border-slate-200"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={projectCover(app.project)}
                alt=""
                className="w-14 aspect-square rounded-lg object-cover bg-slate-100 shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <Link
                      href={`/projects/${app.project.slug}`}
                      className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors"
                    >
                      {app.project.title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {CATEGORY_LABELS[app.project.category] ?? app.project.category} · Vai trò:{" "}
                      <span className="font-medium">{MEMBER_ROLE_LABELS[app.role] ?? app.role}</span>
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${LEARNER_STATUS_COLORS[app.status]}`}>
                    {LEARNER_STATUS_LABELS[app.status] ?? app.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Nộp ngày {new Date(app.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                </p>
                {app.status === "PENDING" && <WithdrawApplicationButton applicationId={app.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
