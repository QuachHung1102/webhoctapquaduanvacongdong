"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import SidebarShell from "@/components/dashboard/SidebarShell";
import { NOTIFICATIONS_CHANGED_EVENT, USER_ROLE_LABELS } from "@/constants/app";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  mentorOnly?: boolean;
}

const LayoutIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

const TaskIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LEARNER_NAV: NavItem[] = [
  { label: "Tổng quan",       href: "/dashboard/overview",        icon: <LayoutIcon /> },
  { label: "Dự án của tôi",   href: "/dashboard/projects",        icon: <FolderIcon /> },
  { label: "Tasks của tôi",   href: "/dashboard/tasks",           icon: <TaskIcon /> },
  { label: "Đơn đăng ký",     href: "/dashboard/applications",   icon: <ClipboardIcon /> },
  { label: "Thông báo",       href: "/dashboard/notifications",  icon: <BellIcon /> },
  { label: "Hồ sơ",           href: "/dashboard/profile",        icon: <UserIcon /> },
  { label: "Portfolio",        href: "/dashboard/profile/portfolio", icon: <UsersIcon /> },
];

const MENTOR_NAV: NavItem[] = [
  { label: "Tổng quan",       href: "/dashboard/overview",        icon: <LayoutIcon /> },
  { label: "Dự án của tôi",   href: "/dashboard/projects",        icon: <FolderIcon /> },
  { label: "Đơn đăng ký",     href: "/dashboard/applications",   icon: <ClipboardIcon />, mentorOnly: true },
  { label: "Thông báo",       href: "/dashboard/notifications",  icon: <BellIcon /> },
  { label: "Hồ sơ",           href: "/dashboard/profile",        icon: <UserIcon /> },
  { label: "Portfolio",        href: "/dashboard/profile/portfolio", icon: <UsersIcon /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const role = session?.user?.role;
  const isMentor = role === "MENTOR" || role === "ADMIN";
  const navItems = isMentor ? MENTOR_NAV : LEARNER_NAV;

  // Fetch unread count, refresh every 60s
  useEffect(() => {
    if (!session?.user) return;
    const fetchUnread = () =>
      fetch("/api/notifications?limit=1")
        .then((r) => r.json())
        .then((data) => setUnreadCount(data.unreadCount ?? 0))
        .catch(() => {});
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    // Pages that mark notifications read fire this so the badge does not wait for the next poll.
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, fetchUnread);
    };
  }, [session?.user]);

  const brand = (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg">
      <span className="text-indigo-400">Project</span>
      <span className="text-white">Hub</span>
    </Link>
  );

  return (
    <SidebarShell brand={brand}>
      {/* Logo */}
      <div className="h-16 shrink-0 flex items-center px-6 border-b border-slate-700">{brand}</div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Avatar name={session?.user?.name} src={session?.user?.avatarUrl} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name ?? "Đang tải..."}</p>
            <p className="text-xs text-slate-400 truncate">
              {role ? USER_ROLE_LABELS[role] ?? role : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard/profile");
          const isNotif  = item.href === "/dashboard/notifications";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {isNotif && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-slate-700 space-y-1">
        {role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ShieldIcon />
            Quản trị
          </Link>
        )}
        <Link
          href="/projects"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          Khám phá dự án
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-900/40 hover:text-red-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Đăng xuất
        </button>
      </div>
    </SidebarShell>
  );
}
