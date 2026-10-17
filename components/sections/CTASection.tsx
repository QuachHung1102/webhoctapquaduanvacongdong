import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

const highlights = [
  "Đăng ký miễn phí",
  "Chọn vai trò theo kỹ năng của bạn",
  "Mentor phụ trách từng dự án",
  "Có sản phẩm cho portfolio",
];

export default function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl ink-surface px-8 py-16 lg:px-20 lg:py-24">
          <Image
            src="/images/hero/team-desk.jpg"
            alt=""
            fill
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="-z-10 object-cover opacity-45"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-ink via-ink/85 to-ink/40" />

          <div className="max-w-2xl">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1]">
              Dự án đầu tiên của bạn đang chờ một thành viên nữa
            </h2>
            <p className="mt-5 text-lg text-slate-300 leading-relaxed">
              Tạo tài khoản, khai báo kỹ năng và gửi đơn vào vai trò bạn muốn thử.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="bg-white text-slate-900 px-7 py-3.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors inline-flex items-center gap-2"
              >
                Tạo tài khoản miễn phí
                <Icon name="arrowRight" className="w-4 h-4" />
              </Link>
              <Link
                href="/projects"
                className="px-7 py-3.5 rounded-xl font-semibold text-white ring-1 ring-white/30 hover:bg-white/10 transition-colors"
              >
                Xem dự án đang tuyển
              </Link>
            </div>

            <ul className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <Icon name="check" className="w-4 h-4 text-emerald-400 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
