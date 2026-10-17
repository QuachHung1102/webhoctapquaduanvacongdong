"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/constants/app";

interface AdminProject {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string;
  difficulty: string;
  createdAt: string;
  mentor: { id: string; name: string | null };
  _count: { members: number; applications: number };
}

interface Props {
  projects: AdminProject[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  status: string;
}

const STATUSES = Object.keys(STATUS_LABELS);

export default function AdminProjectsTable({ projects, total, page, pageSize, search: initSearch, status: initStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initSearch);
  const [status, setStatus] = useState(initStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const totalPages = Math.ceil(total / pageSize);

  function applyFilter(newSearch = search, newStatus = status, newPage = 1) {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newStatus && newStatus !== "ALL") params.set("status", newStatus);
    if (newPage > 1) params.set("page", String(newPage));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function changeStatus(projectId: string, newStatus: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Không thể đổi trạng thái dự án.");
      }
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    }
    // Refresh either way: on failure it puts the <select> back on the stored status.
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap bg-white border border-slate-200 rounded-xl p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilter()}
          placeholder="Tìm tên dự án..."
          className="flex-1 min-w-48 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); applyFilter(search, e.target.value); }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dự án</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mentor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Thành viên</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Đơn ứng tuyển</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Không tìm thấy dự án nào.</td></tr>
            ) : projects.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/projects/${p.slug}`} className="font-medium text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1">
                    {p.title}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">{CATEGORY_LABELS[p.category] ?? p.category} · {DIFFICULTY_LABELS[p.difficulty] ?? p.difficulty}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{p.mentor.name}</td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={(e) => changeStatus(p.id, e.target.value)}
                    disabled={isPending}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[p.status] ?? ""}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-center text-slate-500 text-xs">{p._count.members}</td>
                <td className="px-4 py-3 text-center text-slate-500 text-xs">{p._count.applications}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Trang {page}/{totalPages} — {total} dự án</span>
          <div className="flex gap-2">
            <button
              onClick={() => applyFilter(search, status, page - 1)}
              disabled={page <= 1 || isPending}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              ← Trước
            </button>
            <button
              onClick={() => applyFilter(search, status, page + 1)}
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
