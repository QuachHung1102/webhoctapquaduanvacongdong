import Link from "next/link";

const footerLinks = {
  platform: [
    { label: "Dự án", href: "/projects" },
    { label: "Cộng đồng", href: "/community" },
    { label: "Bảng xếp hạng", href: "/leaderboard" },
    { label: "Cách hoạt động", href: "/#how-it-works" },
  ],
  support: [
    { label: "Trợ giúp & liên hệ", href: "/help" },
    { label: "Điều khoản sử dụng", href: "/terms" },
    { label: "Chính sách bảo mật", href: "/privacy" },
  ],
};

export default function Footer() {
  return (
    <footer className="ink-surface text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 w-fit">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                Project<span className="text-indigo-400">Hub</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              Nền tảng học tập qua dự án thực tế: làm việc nhóm theo sprint, có mentor phụ trách và
              có sản phẩm để đưa vào portfolio.
            </p>
          </div>

          <nav aria-label="Nền tảng">
            <h2 className="font-semibold text-white text-sm mb-4">Nền tảng</h2>
            <ul className="space-y-2.5">
              {footerLinks.platform.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Hỗ trợ">
            <h2 className="font-semibold text-white text-sm mb-4">Hỗ trợ</h2>
            <ul className="space-y-2.5">
              {footerLinks.support.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="section-divider my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} ProjectHub. Dự án học tập.</span>
          <span>
            Ảnh minh hoạ từ{" "}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
              Unsplash
            </a>
            , avatar từ{" "}
            <a href="https://www.dicebear.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white transition-colors">
              DiceBear
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
