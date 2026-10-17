"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { USER_ROLE_LABELS } from "@/constants/app";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  role: string;
  _count: { memberships: number; projectsMentoring: number };
}

interface Props {
  initialQ: string;
  users: User[];
}

export default function CommunityUserSearch({ initialQ, users }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQ);
  const [isPending, start] = useTransition();

  function submit(value: string) {
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    start(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="space-y-4">
      <form
        className="flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit(q);
        }}
      >
        <label htmlFor="community-user-search" className="sr-only">Tìm thành viên</label>
        <input
          id="community-user-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm thành viên theo tên hoặc username"
          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 bg-indigo-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Tìm
        </button>
      </form>

      {initialQ && (
        <div>
          <p className="text-sm text-slate-500 mb-3">
            {users.length > 0
              ? `Tìm thấy ${users.length} người dùng cho "${initialQ}"`
              : `Không tìm thấy người dùng nào cho "${initialQ}"`}
          </p>
          {users.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {users.map((u) => (
                <Link
                  key={u.id}
                  href={`/u/${u.username}`}
                  className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md transition-all text-center"
                >
                  <Avatar name={u.name} src={u.avatarUrl} size="lg" className="mx-auto mb-2" />
                  <p className="font-semibold text-slate-800 text-sm truncate">{u.name}</p>
                  {u.username && <p className="text-xs text-slate-400 truncate">@{u.username}</p>}
                  <p className="text-xs mt-1.5 px-2 py-0.5 rounded-full inline-block bg-indigo-50 text-indigo-600 font-medium">
                    {USER_ROLE_LABELS[u.role] ?? u.role}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {u.role === "MENTOR"
                      ? `${u._count.projectsMentoring} dự án phụ trách`
                      : `${u._count.memberships} dự án tham gia`}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
