import Image from "next/image";
import Link from "next/link";
import SectionHeading from "@/components/sections/SectionHeading";
import Icon, { CATEGORY_ICONS } from "@/components/ui/Icon";
import { CATEGORY_IMAGES, CATEGORY_LABELS } from "@/constants/app";
import { getHomeStats } from "@/lib/queries/home";

const projectTypes = [
  {
    category: "APP",
    description: "Mobile và web app, đi hết vòng đời sản phẩm từ thiết kế dữ liệu đến deploy.",
    tags: ["React Native", "Flutter", "Node.js"],
  },
  {
    category: "DESIGN",
    description: "UI/UX và front-end: từ wireframe đến website chạy thật, tối ưu trải nghiệm.",
    tags: ["Figma", "Next.js", "Tailwind CSS"],
  },
  {
    category: "VIDEO",
    description: "Lên concept, viết kịch bản và dựng video cho thương hiệu trên mạng xã hội.",
    tags: ["Premiere Pro", "After Effects", "Copywriting"],
  },
  {
    category: "PRODUCT",
    description: "SaaS, thương mại điện tử và công cụ số có thể triển khai cho người dùng thật.",
    tags: ["PostgreSQL", "Prisma", "Stripe"],
  },
];

export default async function ProjectTypesSection() {
  const { categoryCounts } = await getHomeStats();

  return (
    <section id="project-types" className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Lĩnh vực dự án"
          title="Bốn lĩnh vực, chọn nơi bạn muốn giỏi lên"
          description="Lập trình, thiết kế, nội dung hay sản phẩm — lĩnh vực nào cũng có dự án đang cần người."
          className="mb-12"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {projectTypes.map((type) => (
            <Link
              key={type.category}
              href={`/projects?category=${type.category}`}
              className="group relative isolate flex min-h-96 flex-col justify-end overflow-hidden rounded-3xl p-6 text-white card-hover"
            >
              <Image
                src={CATEGORY_IMAGES[type.category]}
                alt=""
                fill
                sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/70 to-ink/10" />

              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25">
                <Icon name={CATEGORY_ICONS[type.category]} />
              </span>
              <h3 className="text-xl font-bold">{CATEGORY_LABELS[type.category]}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{type.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {type.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-5 flex items-center justify-between border-t border-white/15 pt-4 text-sm font-semibold">
                <span className="tabular">{categoryCounts[type.category] ?? 0} dự án</span>
                <Icon name="arrowRight" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
