"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { USER_ROLE_LABELS } from "@/constants/app";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  _count: { projectsMentoring: number; memberships: number };
}

interface Props {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  role: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN:   "bg-orange-50 text-orange-600",
  MENTOR:  "bg-indigo-50 text-indigo-600",
  LEARNER: "bg-green-50 text-green-600",
};

export default function AdminUsersTable({ users, total, page, pageSize, search: initSearch, role: initRole }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initSearch);
  const [role, setRole] = useState(initRole);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const totalPages = Math.ceil(total / pageSize);

  function applyFilter(newSearch = search, newRole = role, newPage = 1) {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newRole && newRole !== "ALL") params.set("role", newRole);
    if (newPage > 1) params.set("page", String(newPage));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function patchUser(userId: string, data: { isVerified?: boolean; role?: string }) {
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Không thể cập nhật người dùng.");
      }
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    }
    // Refresh either way: on failure it puts the controls back on the stored values.
    startTransition(() => router.refresh());
  }

  const toggleVerified = (userId: string, current: boolean) => patchUser(userId, { isVerified: !current });
  const changeRole = (userId: string, newRole: string) => patchUser(userId, { role: newRole });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap bg-white border border-slate-200 rounded-xl p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilter()}
          placeholder="Tìm tên hoặc email..."
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); applyFilter(search, e.target.value); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="ALL">Tất cả vai trò</option>
          {Object.keys(USER_ROLE_LABELS).map((r) => (
            <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>
          ))}
        </select>
        <button
          onClick={() => applyFilter()}
          disabled={isPending}
          className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          Tìm
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Người dùng</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vai trò</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Xác thực</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dự án</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-400">Không tìm thấy người dùng nào.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                    <div>
                      <p className="font-medium text-slate-800">{u.name ?? "(chưa đặt tên)"}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLORS[u.role] ?? ""}`}
                    disabled={isPending}
                  >
                    {Object.keys(USER_ROLE_LABELS).map((r) => (
                      <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleVerified(u.id, u.isVerified)}
                    disabled={isPending}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      u.isVerified
                        ? "bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-500"
                        : "bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600"
                    }`}
                  >
                    {u.isVerified ? "Đã xác thực" : "Chưa xác thực"}
                  </button>
                </td>
                <td className="px-4 py-3 text-center text-slate-500 text-xs">
                  {u._count.projectsMentoring > 0
                    ? `${u._count.projectsMentoring} (hướng dẫn)`
                    : `${u._count.memberships} (tham gia)`}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Trang {page}/{totalPages} — {total} người dùng</span>
          <div className="flex gap-2">
            <button
              onClick={() => applyFilter(search, role, page - 1)}
              disabled={page <= 1 || isPending}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              ← Trước
            </button>
            <button
              onClick={() => applyFilter(search, role, page + 1)}
              disabled={page >= totalPages || isPending}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
