import Image from "next/image";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Icon, { Stars } from "@/components/ui/Icon";
import { getHomeStats } from "@/lib/queries/home";

export default async function HeroSection() {
  const stats = await getHomeStats();

  return (
    <section className="hero-gradient pt-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left column */}
          <div className="flex flex-col gap-7 animate-fade-in-up">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {stats.projects} dự án thực tế trên nền tảng
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.08]">
              Học bằng cách <span className="gradient-text">làm dự án thật</span>, có mentor đồng hành
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl">
              Chọn một vai trò trong nhóm, làm việc theo sprint và ra sản phẩm hoàn chỉnh.
              Mỗi dự án xong là một mục trong portfolio của bạn.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="gradient-bg text-white px-7 py-3.5 rounded-xl font-semibold text-base hover:brightness-110 transition shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
              >
                Khám phá dự án
                <Icon name="arrowRight" className="w-4 h-4" />
              </Link>
              <Link
                href="/#how-it-works"
                className="bg-white ring-1 ring-slate-200 text-slate-700 px-7 py-3.5 rounded-xl font-semibold text-base hover:ring-indigo-300 hover:text-indigo-700 transition"
              >
                Xem cách hoạt động
              </Link>
            </div>

            {/* Social proof — real members and real review average */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2.5">
                {stats.faces.map((u) => (
                  <Avatar key={u.id} name={u.name} src={u.avatarUrl} size="md" className="ring-2 ring-white" />
                ))}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-900">
                  {stats.learners} học viên · {stats.mentors} mentor
                </p>
                {stats.avgRating !== null && (
                  <p className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                    <Stars rating={stats.avgRating} className="w-3.5 h-3.5" />
                    <span className="tabular">
                      {stats.avgRating}/5 từ {stats.reviewCount} đánh giá
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column — photo with product UI overlays */}
          <div className="relative">
            <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-950/20 ring-1 ring-slate-900/5">
              <Image
                src="/images/hero/learners.jpg"
                alt="Ba học viên cùng làm việc trên laptop"
                fill
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="absolute -bottom-6 -left-3 sm:-left-8 w-60 bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 p-4 animate-float">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-900">Sprint 2 đang chạy</p>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  3/5 task
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Thiết kế UI", w: "w-[85%]" },
                  { label: "Frontend", w: "w-[60%]" },
                  { label: "API", w: "w-[40%]" },
                ].map((row) => (
                  <div key={row.label}>
                    <p className="text-[11px] text-slate-500 mb-1">{row.label}</p>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div className={`h-full ${row.w} bg-indigo-500 rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -top-4 right-2 sm:-right-5 bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 px-4 py-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Icon name="chat" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-900">Mentor review</p>
                <p className="text-[11px] text-slate-500">sau mỗi sprint</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
