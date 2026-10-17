import Image from "next/image";

interface Props {
  image: string;
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}

/** Dark, photo-backed header shared by the public pages. `pt-16` clears the fixed navbar. */
export default function PageHero({ image, eyebrow, title, description, children }: Props) {
  return (
    <section className="relative isolate overflow-hidden ink-surface pt-16">
      <Image src={image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink via-ink/85 to-ink/30" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        {eyebrow && <p className="text-sm font-semibold text-indigo-300 mb-3">{eyebrow}</p>}
        <h1 className="text-4xl lg:text-5xl font-bold text-white max-w-3xl leading-[1.15]">{title}</h1>
        {description && (
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
