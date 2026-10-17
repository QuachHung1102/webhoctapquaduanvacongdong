import Link from "next/link";
import SectionHeading from "@/components/sections/SectionHeading";
import ProjectCard from "@/components/projects/ProjectCard";
import Icon from "@/components/ui/Icon";
import { getFeaturedProjects } from "@/lib/queries/home";

export default async function ProjectsShowcase() {
  const projects = await getFeaturedProjects(3);
  if (projects.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <SectionHeading eyebrow="Dự án nổi bật" title="Các nhóm đang tìm thành viên" />
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900 transition-colors whitespace-nowrap"
          >
            Xem tất cả dự án
            <Icon name="arrowRight" className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
