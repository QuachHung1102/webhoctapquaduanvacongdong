import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUserByUsername } from "@/lib/queries/user";
import { getUserRatings } from "@/lib/queries/community";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  MEMBER_ROLE_LABELS,
  USER_ROLE_LABELS,
  CATEGORY_IMAGES,
} from "@/constants/app";
import Avatar from "@/components/ui/Avatar";
import Icon, { Stars } from "@/components/ui/Icon";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) return { title: "Người dùng không tồn tại — ProjectHub" };
  return {
    title: `${user.name} (@${user.username}) — ProjectHub`,
    description: user.bio ?? `Hồ sơ của ${user.name} trên ProjectHub.`,
  };
}

const card = "bg-white rounded-2xl ring-1 ring-slate-200/80 p-6";

/** Badge icons are stored as a URL (admin form); anything else falls back to the stock medal. */
function BadgeIcon({ iconUrl, name }: { iconUrl: string | null; name: string }) {
  if (iconUrl && /^(https?:\/\/|\/)/.test(iconUrl)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={iconUrl} alt={name} className="h-10 w-10 rounded-full object-cover shrink-0" />;
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
      <Icon name="badge" />
    </span>
  );
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();

  const ratings = await getUserRatings(user.id);
  const isMentor = user.role === "MENTOR";
  const projects = isMentor
    ? user.projectsMentoring.map((p) => ({ ...p, role: "Mentor" }))
    : user.memberships.map((m) => ({ ...m.project, role: MEMBER_ROLE_LABELS[m.role] ?? m.role }));

  const stats = [
    { value: isMentor ? user.projectsMentoring.length : user._count.memberships, label: isMentor ? "Dự án phụ trách" : "Dự án tham gia" },
    { value: user._count.portfolio, label: "Sản phẩm portfolio" },
    { value: user.badgesEarned.length, label: "Huy hiệu" },
    { value: ratings.avg !== null ? `${ratings.avg}/5` : "—", label: `${ratings.count} đánh giá` },
  ];

  return (
    <main id="main" className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="ink-surface pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24" />
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 pb-16">
        <div className={`${card} lg:p-8`}>
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
            <Avatar name={user.name} src={user.avatarUrl} size="xl" className="ring-4 ring-white shadow-lg sm:w-28! sm:h-28!" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{user.name}</h1>
                <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  {USER_ROLE_LABELS[user.role] ?? user.role}
                </span>
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Icon name="check" className="h-3.5 w-3.5" />
                    Đã xác minh
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                @{user.username} · Tham gia từ {new Date(user.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
              </p>
              {user.bio && <p className="mt-3 text-slate-600 leading-relaxed max-w-2xl">{user.bio}</p>}
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 pt-6">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="text-2xl font-extrabold text-slate-900 tabular">{s.value}</dd>
                <dt className="mt-0.5 text-sm text-slate-500">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left column */}
          <div className="space-y-6">
            <section className={card}>
              <h2 className="font-bold text-slate-900 mb-4">Kỹ năng</h2>
              {user.skillsTagged.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa khai báo kỹ năng.</p>
              ) : (
                <ul className="space-y-3.5">
                  {user.skillsTagged.map((us) => (
                    <li key={us.skillId}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">{us.skill.name}</span>
                        <span className="text-slate-400 tabular">{us.level}/5</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(us.level / 5) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={card}>
              <h2 className="font-bold text-slate-900 mb-4">Huy hiệu</h2>
              {user.badgesEarned.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có huy hiệu nào.</p>
              ) : (
                <ul className="space-y-4">
                  {user.badgesEarned.map((ub) => (
                    <li key={ub.badgeId} className="flex items-center gap-3">
                      <BadgeIcon iconUrl={ub.badge.iconUrl} name={ub.badge.name} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{ub.badge.name}</p>
                        <p className="text-xs text-slate-500 leading-snug">{ub.badge.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {user.portfolio.length > 0 && (
              <section className={card}>
                <h2 className="font-bold text-slate-900 mb-4">Portfolio</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {user.portfolio.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-xl ring-1 ring-slate-200/80">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.coverUrl || CATEGORY_IMAGES[item.project.category] || CATEGORY_IMAGES.APP}
                        alt=""
                        loading="lazy"
                        className="aspect-video w-full object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-slate-900 leading-snug">{item.title}</h3>
                        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-3">{item.summary}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                          <Link href={`/projects/${item.project.slug}`} className="text-indigo-700 hover:underline">
                            Xem dự án
                          </Link>
                          {item.demoUrl && (
                            <a href={item.demoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">
                              Demo
                            </a>
                          )}
                          {item.repoUrl && (
                            <a href={item.repoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-700 hover:underline">
                              Mã nguồn
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className={card}>
              <h2 className="font-bold text-slate-900 mb-2">{isMentor ? "Dự án đang phụ trách" : "Dự án đã tham gia"}</h2>
              {projects.length === 0 ? (
                <p className="text-sm text-slate-500 mt-2">Chưa tham gia dự án nào.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <Link href={`/projects/${p.slug}`} className="flex items-center justify-between gap-4 py-3.5 -mx-2 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-900 truncate">{p.title}</span>
                          <span className="block text-sm text-slate-500">
                            {CATEGORY_LABELS[p.category] ?? p.category} · {p.role}
                          </span>
                        </span>
                        <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {ratings.mentorReviews.length > 0 && (
              <section className={card}>
                <h2 className="font-bold text-slate-900 mb-4">Học viên nhận xét</h2>
                <ul className="space-y-5">
                  {ratings.mentorReviews.map((r) => (
                    <li key={r.id} className="flex gap-3">
                      <Avatar name={r.reviewer.name} src={r.reviewer.avatarUrl} />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 text-sm">
                          <span className="font-semibold text-slate-900">{r.reviewer.name}</span>
                          <Stars rating={r.rating} className="h-3.5 w-3.5" />
                        </p>
                        {r.comment && <p className="mt-1 text-sm text-slate-600 leading-relaxed">{r.comment}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
