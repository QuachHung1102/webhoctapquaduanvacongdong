import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboard } from "@/lib/queries/leaderboard";
import { USER_ROLE_LABELS } from "@/constants/app";
import PageHero from "@/components/ui/PageHero";
import Avatar from "@/components/ui/Avatar";

export const metadata: Metadata = {
  title: "Bảng xếp hạng — ProjectHub",
  description: "Top thành viên tích cực nhất trên ProjectHub.",
};

// No request-time input on this page, so without this it would be frozen at build time.
export const revalidate = 60;

type Entry = Awaited<ReturnType<typeof getLeaderboard>>[number];

const PODIUM_STYLE = [
  { ring: "ring-amber-300", chip: "bg-amber-400 text-amber-950", order: "sm:order-2 sm:-mt-6" },
  { ring: "ring-slate-300", chip: "bg-slate-300 text-slate-800", order: "sm:order-1" },
  { ring: "ring-orange-300", chip: "bg-orange-300 text-orange-950", order: "sm:order-3" },
];

/** Links to the public profile when the user has one. */
function ProfileLink({ user, className, children }: { user: Entry; className: string; children: React.ReactNode }) {
  return user.username ? (
    <Link href={`/u/${user.username}`} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

export default async function LeaderboardPage() {
  const users = await getLeaderboard(50);
  const podium = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <main id="main" className="min-h-screen bg-slate-50">
      <PageHero
        image="/images/hero/highfive.jpg"
        eyebrow="Bảng xếp hạng"
        title="Những thành viên đóng góp nhiều nhất"
        description="Điểm = dự án hoàn thành × 3 + điểm đánh giá trung bình × 10 + huy hiệu × 5."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {users.length === 0 && (
          <p className="text-center text-slate-500 py-16 bg-white rounded-2xl ring-1 ring-slate-200/80">
            Chưa có ai trên bảng xếp hạng. Hoàn thành một dự án để ghi tên đầu tiên.
          </p>
        )}

        {/* Podium */}
        {podium.length > 0 && (
          <ol className="grid sm:grid-cols-3 gap-4 sm:items-end mb-10 sm:pt-6">
            {podium.map((u, i) => (
              <li key={u.id} className={PODIUM_STYLE[i].order}>
                <ProfileLink
                  user={u}
                  className="block bg-white rounded-2xl ring-1 ring-slate-200/80 p-6 text-center card-hover"
                >
                  <div className="relative w-fit mx-auto mb-4">
                    <Avatar name={u.name} src={u.avatarUrl} size="xl" className={`ring-4 ${PODIUM_STYLE[i].ring}`} />
                    <span
                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold px-2.5 py-0.5 rounded-full tabular ${PODIUM_STYLE[i].chip}`}
                    >
                      #{i + 1}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{USER_ROLE_LABELS[u.role] ?? u.role}</p>
                  <p className="mt-4 text-3xl font-extrabold text-indigo-600 tabular">{u.score}</p>
                  <p className="text-xs text-slate-500">điểm</p>
                  <p className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 tabular">
                    {u.completedProjects} dự án · {u.reviewCount > 0 ? `${u.avgRating}/5` : "chưa có đánh giá"} ·{" "}
                    {u.badgeCount} huy hiệu
                  </p>
                </ProfileLink>
              </li>
            ))}
          </ol>
        )}

        {/* Remaining ranks */}
        {rest.length > 0 && (
          <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_5rem_5rem_4.5rem] gap-3 px-5 py-3 text-xs font-semibold text-slate-500 border-b border-slate-100">
              <span>Hạng</span>
              <span>Thành viên</span>
              <span className="text-right">Dự án</span>
              <span className="text-right">Đánh giá</span>
              <span className="text-right">Huy hiệu</span>
              <span className="text-right">Điểm</span>
            </div>
            <ol className="divide-y divide-slate-100">
              {rest.map((u, i) => (
                <li key={u.id}>
                  <ProfileLink
                    user={u}
                    className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_5rem_5rem_5rem_4.5rem] items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-400 tabular">#{i + 4}</span>
                    <span className="flex items-center gap-3 min-w-0">
                      <Avatar name={u.name} src={u.avatarUrl} />
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-900 truncate">{u.name}</span>
                        <span className="block text-xs text-slate-500 truncate">{USER_ROLE_LABELS[u.role] ?? u.role}</span>
                      </span>
                    </span>
                    <span className="hidden sm:block text-right text-sm text-slate-700 tabular">{u.completedProjects}</span>
                    <span className="hidden sm:block text-right text-sm text-slate-700 tabular">
                      {u.reviewCount > 0 ? u.avgRating : "—"}
                    </span>
                    <span className="hidden sm:block text-right text-sm text-slate-700 tabular">{u.badgeCount}</span>
                    <span className="text-right font-bold text-indigo-600 tabular">{u.score}</span>
                  </ProfileLink>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </main>
  );
}
