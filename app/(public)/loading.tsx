/** Skeleton shared by the public pages: dark header band + a grid of cards. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50" aria-busy="true" aria-label="Đang tải">
      <div className="ink-surface pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 animate-pulse">
          <div className="h-4 w-24 rounded bg-white/15" />
          <div className="mt-4 h-10 w-full max-w-xl rounded-lg bg-white/15" />
          <div className="mt-4 h-5 w-full max-w-md rounded bg-white/10" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-2xl bg-white ring-1 ring-slate-200/80 overflow-hidden">
            <div className="aspect-video bg-slate-200" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-2/3 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
