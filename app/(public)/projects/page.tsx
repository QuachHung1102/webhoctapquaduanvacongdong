import Link from "next/link";
import type { Metadata } from "next";
import { getProjects } from "@/lib/queries/project";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, STATUS_LABELS } from "@/constants/app";
import PageHero from "@/components/ui/PageHero";
import Icon, { CATEGORY_ICONS } from "@/components/ui/Icon";
import ProjectCard from "@/components/projects/ProjectCard";
import type { ProjectCategory, ProjectStatus, Difficulty } from "@/app/generated/prisma/client";

export const metadata: Metadata = {
  title: "Dự án — ProjectHub",
  description:
    "Khám phá các dự án thực tế đang tuyển thành viên. Lập trình app, thiết kế website, video marketing và sản phẩm số.",
};

const STATUS_FILTERS: ProjectStatus[] = ["RECRUITING", "IN_PROGRESS", "COMPLETED"];

interface PageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    difficulty?: string;
    q?: string;
    page?: string;
  }>;
}

/** Query params are user input: anything outside the enum is ignored instead of reaching Prisma. */
function pick<T extends string>(value: string | undefined, allowed: Record<string, string>) {
  return value && value in allowed ? (value as T) : undefined;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page       = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const category   = pick<ProjectCategory>(params.category, CATEGORY_LABELS);
  const status     = pick<ProjectStatus>(params.status, STATUS_LABELS);
  const difficulty = pick<Difficulty>(params.difficulty, DIFFICULTY_LABELS);
  const search     = params.q?.trim().slice(0, 100) || undefined;

  const { projects, total, totalPages } = await getProjects({
    category,
    status,
    difficulty,
    search,
    page,
    pageSize: 9,
  });

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = {
      category,
      status,
      difficulty,
      q: search,
      page: String(page),
      ...overrides,
    };
    const qs = Object.entries(merged)
      .filter(([k, v]) => v !== undefined && v !== "" && !(k === "page" && v === "1"))
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/projects${qs ? `?${qs}` : ""}`;
  }

  const hasFilter = Boolean(category || status || difficulty || search);
  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
      active
        ? "bg-slate-900 text-white"
        : "bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-indigo-300 hover:text-indigo-700"
    }`;

  return (
    <main id="main" className="min-h-screen bg-slate-50">
      <PageHero
        image="/images/hero/team-desk.jpg"
        eyebrow="Dự án"
        title="Khám phá dự án thực tế"
        description="Chọn dự án hợp với kỹ năng và mục tiêu của bạn, đăng ký một vai trò và bắt đầu làm việc cùng nhóm."
      >
        <form method="GET" action="/projects" className="max-w-lg">
          <div className="relative">
            <label htmlFor="project-search" className="sr-only">Tìm kiếm dự án</label>
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="project-search"
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Tìm theo tên hoặc mô tả dự án"
              className="w-full pl-11 pr-28 py-3.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-lg"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 bottom-1.5 px-5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Tìm
            </button>
            {category   && <input type="hidden" name="category"   value={category} />}
            {status     && <input type="hidden" name="status"     value={status} />}
            {difficulty && <input type="hidden" name="difficulty" value={difficulty} />}
          </div>
        </form>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="space-y-3 mb-8">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc theo lĩnh vực">
            <Link href={buildUrl({ category: undefined, page: "1" })} className={chip(!category)}>
              Tất cả lĩnh vực
            </Link>
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
              <Link key={id} href={buildUrl({ category: id, page: "1" })} className={chip(category === id)}>
                <Icon name={CATEGORY_ICONS[id]} className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo trạng thái">
              <span className="text-slate-400 mr-1">Trạng thái</span>
              {[undefined, ...STATUS_FILTERS].map((s) => (
                <Link
                  key={s ?? "all"}
                  href={buildUrl({ status: s, page: "1" })}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    status === s ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {s ? STATUS_LABELS[s] : "Tất cả"}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo cấp độ">
              <span className="text-slate-400 mr-1">Cấp độ</span>
              {[undefined, ...Object.keys(DIFFICULTY_LABELS)].map((d) => (
                <Link
                  key={d ?? "all"}
                  href={buildUrl({ difficulty: d, page: "1" })}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    difficulty === d ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {d ? DIFFICULTY_LABELS[d] : "Tất cả"}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5 text-sm text-slate-500">
          <p>
            <span className="font-semibold text-slate-900 tabular">{total}</span> dự án
            {search && <> cho “{search}”</>}
          </p>
          {hasFilter && (
            <Link href="/projects" className="font-medium text-indigo-700 hover:underline">
              Xoá bộ lọc
            </Link>
          )}
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl ring-1 ring-slate-200/80">
            <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Icon name="search" className="w-6 h-6" />
            </span>
            <p className="text-slate-900 font-semibold text-lg">Không có dự án nào khớp bộ lọc</p>
            <p className="text-slate-500 text-sm mt-1">Thử bỏ bớt điều kiện hoặc đổi từ khoá tìm kiếm.</p>
            <Link href="/projects" className="mt-5 inline-block text-sm font-semibold text-indigo-700 hover:underline">
              Xem tất cả dự án
            </Link>
          </div>
        )}

        {/* Projects grid */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Phân trang" className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-4 py-2 text-sm font-medium bg-white ring-1 ring-slate-200 rounded-lg hover:ring-indigo-300 text-slate-600 transition-colors"
              >
                Trước
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                aria-current={p === page ? "page" : undefined}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors tabular ${
                  p === page
                    ? "bg-slate-900 text-white"
                    : "bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-indigo-300"
                }`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-4 py-2 text-sm font-medium bg-white ring-1 ring-slate-200 rounded-lg hover:ring-indigo-300 text-slate-600 transition-colors"
              >
                Tiếp
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
