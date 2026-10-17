import type { Metadata } from "next";
import Link from "next/link";
import {
  getCompletedProjects,
  getCommunityStats,
  getTopMentors,
  getOpenProjects,
  getRecentMembers,
  searchUsers,
} from "@/lib/queries/community";
import CommunityUserSearch from "@/components/public/CommunityUserSearch";
import PageHero from "@/components/ui/PageHero";
import Avatar from "@/components/ui/Avatar";
import Icon, { Stars } from "@/components/ui/Icon";
import ProjectCard from "@/components/projects/ProjectCard";

export const metadata: Metadata = {
  title: "Cộng đồng — ProjectHub",
  description: "Khám phá cộng đồng học tập qua dự án thực tế của ProjectHub.",
};

function SectionTitle({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900 whitespace-nowrap">
          {linkLabel}
          <Icon name="arrowRight" className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 60);
  const [stats, completedProjects, topMentors, openProjects, recentMembers, userResults] = await Promise.all([
    getCommunityStats(),
    getCompletedProjects(6),
    getTopMentors(6),
    getOpenProjects(3),
    getRecentMembers(8),
    q ? searchUsers(q) : Promise.resolve([]),
  ]);

  const statItems = [
    { value: stats.users, label: "Thành viên" },
    { value: stats.projects, label: "Dự án" },
    { value: stats.completedProjects, label: "Đã hoàn thành" },
    { value: stats.skills, label: "Kỹ năng" },
  ];

  return (
    <main id="main" className="min-h-screen bg-slate-50">
      <PageHero
        image="/images/hero/meetup.jpg"
        eyebrow="Cộng đồng"
        title="Học cùng nhau, lớn lên cùng nhau"
        description="Những người đang làm dự án thật trên ProjectHub: học viên, mentor và sản phẩm họ đã hoàn thành."
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-10 gap-y-6 max-w-2xl">
          {statItems.map((s) => (
            <div key={s.label}>
              <dd className="text-3xl font-extrabold text-white tabular">{s.value}</dd>
              <dt className="text-sm text-slate-400 mt-1">{s.label}</dt>
            </div>
          ))}
        </dl>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Member search */}
        <section aria-label="Tìm thành viên" className="max-w-3xl">
          <CommunityUserSearch initialQ={q} users={userResults} />
        </section>

        {/* Mentors */}
        {topMentors.length > 0 && (
          <section>
            <SectionTitle title="Mentor" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {topMentors.map((m) => {
                const card = (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar name={m.name} src={m.avatarUrl} size="lg" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{m.name}</p>
                        <p className="text-sm text-slate-500 tabular">{m._count.projectsMentoring} dự án phụ trách</p>
                      </div>
                    </div>
                    {m.bio && <p className="mt-4 text-sm text-slate-600 leading-relaxed line-clamp-3">{m.bio}</p>}
                    {m.skillsTagged.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {m.skillsTagged.map((s) => (
                          <span key={s.skill.name} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            {s.skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.avgRating !== null && (
                      <p className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-600">
                        <Stars rating={m.avgRating} />
                        <span className="tabular">
                          {m.avgRating}/5 · {m.reviewCount} đánh giá
                        </span>
                      </p>
                    )}
                  </>
                );
                const cls = "block bg-white rounded-2xl ring-1 ring-slate-200/80 p-6";
                return m.username ? (
                  <Link key={m.id} href={`/u/${m.username}`} className={`${cls} card-hover`}>
                    {card}
                  </Link>
                ) : (
                  <div key={m.id} className={cls}>
                    {card}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Open projects */}
        {openProjects.length > 0 && (
          <section>
            <SectionTitle title="Dự án đang tuyển thành viên" href="/projects?status=RECRUITING" linkLabel="Xem tất cả" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        )}

        {/* Completed projects */}
        {completedProjects.length > 0 && (
          <section>
            <SectionTitle title="Dự án đã hoàn thành" href="/projects?status=COMPLETED" linkLabel="Xem tất cả" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </section>
        )}

        {/* Recent members */}
        {recentMembers.length > 0 && (
          <section>
            <SectionTitle title="Học viên" href="/leaderboard" linkLabel="Bảng xếp hạng" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentMembers.map((u) => (
                <Link
                  key={u.id}
                  href={`/u/${u.username}`}
                  className="bg-white rounded-2xl ring-1 ring-slate-200/80 p-5 text-center card-hover"
                >
                  <Avatar name={u.name} src={u.avatarUrl} size="lg" className="mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 text-sm truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular">{u._count.memberships} dự án</p>
                  {u.skillsTagged.length > 0 && (
                    <p className="text-xs text-slate-400 mt-2 truncate">
                      {u.skillsTagged.map((s) => s.skill.name).join(" · ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
