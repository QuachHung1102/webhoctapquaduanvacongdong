import Link from "next/link";
import SectionHeading from "@/components/sections/SectionHeading";
import Avatar from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Icon";
import { MEMBER_ROLE_LABELS } from "@/constants/app";
import { getTestimonials } from "@/lib/queries/home";

type Testimonial = Awaited<ReturnType<typeof getTestimonials>>[number];

function Author({ t, dark = false }: { t: Testimonial; dark?: boolean }) {
  const byline = [t.memberRole && (MEMBER_ROLE_LABELS[t.memberRole] ?? t.memberRole), t.project?.title]
    .filter(Boolean)
    .join(" · ");
  const inner = (
    <>
      <Avatar name={t.reviewer.name} src={t.reviewer.avatarUrl} size="md" />
      <span className="min-w-0">
        <span className={`block font-semibold truncate ${dark ? "text-white" : "text-slate-900"}`}>
          {t.reviewer.name}
        </span>
        <span className={`block text-sm truncate ${dark ? "text-slate-400" : "text-slate-500"}`}>{byline}</span>
      </span>
    </>
  );
  return t.reviewer.username ? (
    <Link href={`/u/${t.reviewer.username}`} className="flex items-center gap-3 w-fit max-w-full hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  ) : (
    <div className="flex items-center gap-3">{inner}</div>
  );
}

/** Real mentor reviews written by learners after a project — nothing here is hardcoded. */
export default async function TestimonialsSection() {
  const [lead, ...rest] = await getTestimonials(3);
  if (!lead) return null;

  return (
    <section className="py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Học viên nói gì"
          title="Đánh giá viết sau khi dự án kết thúc"
          description="Lấy trực tiếp từ phần đánh giá mentor mà học viên gửi trên nền tảng."
          className="mb-12"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5">
          <figure className="ink-surface rounded-3xl p-8 lg:p-12 flex flex-col justify-between gap-10">
            <div>
              <Stars rating={lead.rating} className="w-5 h-5" />
              <blockquote className="mt-6 text-2xl lg:text-3xl font-semibold text-white leading-snug">
                “{lead.comment}”
              </blockquote>
            </div>
            <figcaption>
              <Author t={lead} dark />
            </figcaption>
          </figure>

          <div className="grid grid-cols-1 gap-5">
            {rest.map((t) => (
              <figure key={t.id} className="bg-white rounded-3xl p-7 ring-1 ring-slate-200/80 flex flex-col justify-between gap-6">
                <div>
                  <Stars rating={t.rating} />
                  <blockquote className="mt-4 text-slate-700 leading-relaxed">“{t.comment}”</blockquote>
                </div>
                <figcaption>
                  <Author t={t} />
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
