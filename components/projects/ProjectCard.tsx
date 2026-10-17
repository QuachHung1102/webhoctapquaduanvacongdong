import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  DIFFICULTY_LABELS,
  projectCover,
} from "@/constants/app";

export interface ProjectCardData {
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  difficulty: string;
  timeline: number;
  maxMembers: number;
  coverImageUrl?: string | null;
  mentor: { name: string; avatarUrl?: string | null };
  skills: { skill: { name: string } }[];
  _count: { members: number };
}

export default function ProjectCard({ project }: { project: ProjectCardData }) {
  const openSlots = project.maxMembers - project._count.members;
  const recruiting = project.status === "RECRUITING";

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/80 card-hover"
    >
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {/* Cover may be a Cloudinary upload or a local stock photo, so no next/image here */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={projectCover(project)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-slate-950/70 to-transparent" />
        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm">
          {CATEGORY_LABELS[project.category] ?? project.category}
        </span>
        <span
          className={`absolute right-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold shadow-sm ${STATUS_COLORS[project.status] ?? "bg-slate-100 text-slate-600"}`}
        >
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-white">
          <Avatar name={project.mentor.name} src={project.mentor.avatarUrl} size="xs" className="ring-2 ring-white/80" />
          <span className="truncate text-xs font-medium">Mentor {project.mentor.name}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-indigo-700 line-clamp-2">
          {project.title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-500 line-clamp-2">{project.description}</p>

        {project.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.skills.slice(0, 4).map((s) => (
              <span key={s.skill.name} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {s.skill.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span className="tabular">
            {DIFFICULTY_LABELS[project.difficulty] ?? project.difficulty} · {project.timeline} tuần ·{" "}
            {project._count.members}/{project.maxMembers} thành viên
          </span>
          {recruiting &&
            (openSlots > 0 ? (
              <span className="shrink-0 font-semibold text-emerald-700">Còn {openSlots} chỗ</span>
            ) : (
              <span className="shrink-0 text-slate-400">Đã đủ người</span>
            ))}
        </div>
      </div>
    </Link>
  );
}
