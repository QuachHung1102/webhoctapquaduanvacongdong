interface Section {
  heading: string;
  body: string[];
}

interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Section[];
  children?: React.ReactNode;
}

/** Plain long-form page (help, terms, privacy): headings on the left, text on the right. */
export default function DocPage({ eyebrow, title, intro, sections, children }: Props) {
  return (
    <main id="main" className="min-h-screen bg-white">
      <header className="ink-surface pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <p className="text-sm font-semibold text-indigo-300 mb-3">{eyebrow}</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white">{title}</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">{intro}</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <dl className="divide-y divide-slate-200">
          {sections.map((s) => (
            <div key={s.heading} className="grid md:grid-cols-[1fr_2fr] gap-3 md:gap-10 py-8 first:pt-0">
              <dt className="text-lg font-bold text-slate-900">{s.heading}</dt>
              <dd className="space-y-3 text-slate-600 leading-relaxed">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        {children}
      </div>
    </main>
  );
}
