import { getHomeStats } from "@/lib/queries/home";

export default async function StatsSection() {
  const s = await getHomeStats();
  const stats = [
    { number: s.projects, label: "Dự án thực tế" },
    { number: s.learners, label: "Học viên tham gia" },
    { number: s.mentors, label: "Mentor đồng hành" },
    { number: s.skills, label: "Kỹ năng được rèn luyện" },
  ];

  return (
    <section className="ink-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 lg:grid-cols-4 divide-white/10 lg:divide-x">
          {stats.map((stat) => (
            <div key={stat.label} className="py-10 lg:px-10 first:lg:pl-0">
              <dd className="text-4xl lg:text-5xl font-extrabold text-white tabular">{stat.number}</dd>
              <dt className="mt-2 text-sm text-slate-400">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
