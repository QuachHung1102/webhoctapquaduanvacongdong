import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import SidebarShell from "@/components/dashboard/SidebarShell";

const icon = (d: string) => (
  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

const NAV = [
  {
    href: "/admin",
    label: "Tổng quan",
    icon: icon("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"),
  },
  {
    href: "/admin/users",
    label: "Người dùng",
    icon: icon("M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"),
  },
  {
    href: "/admin/projects",
    label: "Dự án",
    icon: icon("M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"),
  },
  {
    href: "/admin/badges",
    label: "Badge",
    icon: icon("M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"),
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") redirect("/dashboard/overview");

  const brand = (
    <Link href="/admin" className="flex items-center gap-2 font-bold text-base">
      <span className="text-orange-400">Admin</span>
      <span>Panel</span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <SidebarShell brand={brand} widthClass="w-56">
        <div className="h-14 shrink-0 flex items-center px-5 border-b border-slate-700">{brand}</div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-700">
          <Link
            href="/dashboard/overview"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {icon("M10 19l-7-7m0 0l7-7m-7 7h18")}
            Về Dashboard
          </Link>
        </div>
      </SidebarShell>

      {/* Content */}
      <main id="main" className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
