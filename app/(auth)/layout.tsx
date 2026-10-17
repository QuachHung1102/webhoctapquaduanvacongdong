import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 ink-surface">
      <aside className="relative isolate hidden lg:flex flex-col justify-end overflow-hidden p-12 xl:p-16">
        <Image
          src="/images/hero/study-group.jpg"
          alt="Một nhóm bạn trẻ đang cùng làm việc"
          fill
          priority
          sizes="50vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/60 to-ink/10" />
        <p className="max-w-md text-3xl xl:text-4xl font-extrabold leading-tight text-white">
          Một dự án thật dạy bạn nhiều hơn mười khoá học.
        </p>
        <p className="mt-4 max-w-md text-slate-300 leading-relaxed">
          Chọn vai trò, làm việc theo sprint cùng nhóm và mentor, rồi mang sản phẩm về portfolio của bạn.
        </p>
      </aside>

      <main id="main" className="flex items-center justify-center px-4 py-10 sm:px-8">
        {children}
      </main>
    </div>
  );
}
