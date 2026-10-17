import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="min-h-screen ink-surface flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <p className="text-8xl sm:text-9xl font-extrabold text-indigo-400 tabular leading-none">404</p>
        <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-white">Không tìm thấy trang này</h1>
        <p className="mt-3 text-slate-400 leading-relaxed">
          Đường dẫn có thể đã đổi hoặc dự án đã bị gỡ. Bạn có thể quay về trang chủ hoặc xem các dự án đang mở.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
            Về trang chủ
          </Link>
          <Link href="/projects" className="px-6 py-3 rounded-xl font-semibold text-white ring-1 ring-white/30 hover:bg-white/10 transition-colors">
            Xem dự án
          </Link>
        </div>
      </div>
    </main>
  );
}
