interface Props {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

/** Shared heading for landing sections: small indigo eyebrow, title, optional lead paragraph. */
export default function SectionHeading({ eyebrow, title, description, align = "left", className = "" }: Props) {
  const centered = align === "center";
  return (
    <div className={`${centered ? "text-center mx-auto" : ""} max-w-2xl ${className}`}>
      <p className="text-sm font-semibold text-indigo-600 mb-3">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">{title}</h2>
      {description && <p className="mt-4 text-lg text-slate-600 leading-relaxed">{description}</p>}
    </div>
  );
}
