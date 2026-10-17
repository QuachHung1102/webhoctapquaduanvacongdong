import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getProjectBySlug, getUserProjectStatus } from "@/lib/queries/project";
import { getSession } from "@/lib/session";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  DIFFICULTY_LABELS,
  MEMBER_ROLE_LABELS,
  projectCover,
} from "@/constants/app";
import ApplyButton from "@/components/projects/ApplyButton";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Không tìm thấy — ProjectHub" };
  return {
    title: `${project.title} — ProjectHub`,
    description: project.description,
    openGraph: { images: [projectCover(project)] },
  };
}

const cardLink = "w-full block text-center font-semibold py-3 rounded-xl transition-colors text-sm";
const notice = "w-full text-center font-medium py-3 px-3 rounded-xl text-sm";

export default async function ProjectDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, session] = await Promise.all([getProjectBySlug(slug), getSession()]);

  if (!project) notFound();

  const user = session?.user;
  const canManage = user?.id === project.mentorId || user?.role === "ADMIN";
  const isMember = project.members.some((m) => m.user.id === user?.id);
  const openSlots = project.maxMembers - project._count.members;
  const application =
    user && !canManage && !isMember ? (await getUserProjectStatus(user.id, project.id)).application : null;

  const allTasks = project.sprints.flatMap((s) => s.tasks);
  const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const facts = [
    { label: "Lĩnh vực", value: CATEGORY_LABELS[project.category] ?? project.category },
    { label: "Cấp độ", value: DIFFICULTY_LABELS[project.difficulty] ?? project.difficulty },
    { label: "Thời lượng", value: `${project.timeline} tuần` },
    { label: "Thành viên", value: `${project._count.members}/${project.maxMembers}` },
  ];

  let action: React.ReactNode;
  if (canManage) {
    action = (
      <Link href={`/dashboard/projects/${project.slug}`} className={`${cardLink} bg-indigo-600 text-white hover:bg-indigo-700`}>
        Quản lý dự án
      </Link>
    );
  } else if (isMember) {
    action = (
      <Link href={`/dashboard/projects/${project.slug}`} className={`${cardLink} bg-emerald-600 text-white hover:bg-emerald-700`}>
        Vào workspace
      </Link>
    );
  } else if (application?.status === "PENDING") {
    action = (
      <>
        <p className={`${notice} bg-amber-50 text-amber-800`}>
          Đơn của bạn ({MEMBER_ROLE_LABELS[application.role] ?? application.role}) đang chờ mentor duyệt
        </p>
        <Link href="/dashboard/applications" className="mt-3 block text-center text-sm font-medium text-indigo-700 hover:underline">
          Xem đơn đăng ký của tôi
        </Link>
      </>
    );
  } else if (user && user.role !== "LEARNER") {
    action = <p className={`${notice} bg-slate-100 text-slate-500`}>Chỉ tài khoản học viên mới đăng ký tham gia dự án</p>;
  } else if (project.status === "RECRUITING" && openSlots > 0) {
    action = (
      <>
        {application?.status === "REJECTED" && (
          <p className="mb-3 text-xs text-slate-500">Đơn trước của bạn chưa được chấp nhận. Bạn có thể gửi lại với vai trò khác.</p>
        )}
        <ApplyButton projectId={project.id} projectSlug={project.slug} projectTitle={project.title} />
      </>
    );
  } else {
    action = (
      <p className={`${notice} bg-slate-100 text-slate-500`}>
        {project.status === "RECRUITING" ? "Dự án đã đủ thành viên" : "Dự án hiện không tuyển thành viên"}
      </p>
    );
  }

  return (
    <main id="main" className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative isolate overflow-hidden ink-surface pt-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={projectCover(project)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink via-ink/85 to-ink/40" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 lg:pb-32">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-400 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link href="/projects" className="hover:text-white transition-colors">Dự án</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white truncate max-w-xs">{project.title}</span>
          </nav>

          <div className="max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${STATUS_COLORS[project.status] ?? "bg-slate-100 text-slate-600"}`}>
                {STATUS_LABELS[project.status] ?? project.status}
              </span>
              <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                {CATEGORY_LABELS[project.category] ?? project.category}
              </span>
              <span className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
                {DIFFICULTY_LABELS[project.difficulty] ?? project.difficulty}
              </span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-white leading-[1.12]">{project.title}</h1>
            <p className="mt-5 text-slate-300 text-lg leading-relaxed">{project.description}</p>
          </div>
        </div>
      </section>

      {/* Body — pulled up over the hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-6 lg:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Mục tiêu dự án</h2>
            <p className="text-slate-600 leading-relaxed">{project.outputGoal}</p>

            {project.outputUrl && (
              <a
                href={project.outputUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline break-all"
              >
                Xem sản phẩm đã bàn giao
                <Icon name="arrowRight" className="w-4 h-4 shrink-0" />
              </a>
            )}

            {project.skills.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-slate-900 mt-7 mb-3">Kỹ năng cần có</h3>
                <div className="flex flex-wrap gap-2">
                  {project.skills.map((ps) => (
                    <span key={ps.skill.id} className="bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-lg">
                      {ps.skill.name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-6 lg:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Thành viên{" "}
              <span className="text-slate-400 font-medium tabular">
                {project.members.length}/{project.maxMembers}
              </span>
            </h2>
            {project.members.length === 0 ? (
              <p className="text-sm text-slate-500 mt-3">Chưa có thành viên nào. Bạn có thể là người đầu tiên.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {project.members.map((member) => {
                  const row = (
                    <>
                      <Avatar name={member.user.name} src={member.user.avatarUrl} />
                      <span className="flex-1 min-w-0 text-sm font-medium text-slate-900 truncate">{member.user.name}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
                        {MEMBER_ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    </>
                  );
                  return (
                    <li key={member.user.id}>
                      {member.user.username ? (
                        <Link href={`/u/${member.user.username}`} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                          {row}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 py-3">{row}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {project.sprints.length > 0 && (
            <section className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-6 lg:p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Tiến độ theo sprint</h2>
              <ul className="space-y-5">
                {project.sprints.map((sprint) => {
                  const done = sprint.tasks.filter((t) => t.status === "DONE").length;
                  const pct = sprint.tasks.length > 0 ? Math.round((done / sprint.tasks.length) * 100) : 0;
                  return (
                    <li key={sprint.id}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="font-medium text-sm text-slate-900 flex items-center gap-2 min-w-0">
                          <span className="truncate">{sprint.name}</span>
                          {sprint.isActive && (
                            <span className="shrink-0 text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md">
                              Đang chạy
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-slate-500 tabular shrink-0">
                          {done}/{sprint.tasks.length} task
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-xl shadow-slate-900/5 p-6">
            <dl className="space-y-3 text-sm mb-5">
              {facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{f.label}</dt>
                  <dd className="font-semibold text-slate-900 tabular">{f.value}</dd>
                </div>
              ))}
              {project.status === "RECRUITING" && openSlots > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Còn trống</dt>
                  <dd className="font-semibold text-emerald-700 tabular">{openSlots} chỗ</dd>
                </div>
              )}
            </dl>

            {allTasks.length > 0 && (
              <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>Tiến độ chung</span>
                  <span className="tabular">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {action}
          </div>

          <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-6">
            <h2 className="text-sm font-semibold text-slate-500 mb-4">Mentor phụ trách</h2>
            <div className="flex items-center gap-3">
              <Avatar name={project.mentor.name} src={project.mentor.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{project.mentor.name}</p>
                {project.mentor.username && (
                  <Link href={`/u/${project.mentor.username}`} className="text-sm text-indigo-700 hover:underline">
                    Xem hồ sơ
                  </Link>
                )}
              </div>
            </div>
            {project.mentor.bio && <p className="mt-4 text-sm text-slate-600 leading-relaxed">{project.mentor.bio}</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
