"use client";

/**
 * components/admin/BadgeManager.tsx
 * Client component để:
 *  - Tạo badge mới
 *  - Trao badge cho user
 *  - Thu hồi badge
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  _count: { userBadges: number };
}

interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  badgesEarned: { badgeId: string; earnedAt: string; badge: { name: string } }[];
}

interface Props {
  initialBadges: Badge[];
  users: User[];
}

// Lists come straight from props: every mutation ends in router.refresh(), which re-renders the server page.
export default function BadgeManager({ initialBadges: badges, users }: Props) {
  const router                  = useRouter();
  const [isPending, start]      = useTransition();
  const [tab, setTab]           = useState<"badges" | "award">("badges");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // Create badge form
  const [newName, setNewName]         = useState("");
  const [newDesc, setNewDesc]         = useState("");
  const [newIcon, setNewIcon]         = useState("");

  // Award form
  const [selectedBadge, setSelectedBadge] = useState("");
  const [selectedUser,  setSelectedUser]  = useState("");

  function notify(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess(""); }
    else         { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 3000);
  }

  async function createBadge(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await fetch("/api/admin/badges", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newName, description: newDesc, iconUrl: newIcon || undefined }),
      });
      if (res.ok) {
        setNewName(""); setNewDesc(""); setNewIcon("");
        notify("Tạo badge thành công!");
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        notify(json.error ?? "Có lỗi xảy ra.", true);
      }
    });
  }

  async function awardBadge(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBadge || !selectedUser) { notify("Vui lòng chọn badge và user.", true); return; }
    start(async () => {
      const res = await fetch("/api/admin/badges/award", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ badgeId: selectedBadge, userId: selectedUser }),
      });
      if (res.ok) {
        notify("Trao badge thành công!");
        setSelectedBadge(""); setSelectedUser("");
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        notify(json.error ?? "Có lỗi xảy ra.", true);
      }
    });
  }

  async function revokeBadge(badgeId: string, userId: string, badgeName: string, userName: string) {
    if (!confirm(`Thu hồi badge "${badgeName}" của "${userName}"?`)) return;
    start(async () => {
      const res = await fetch("/api/admin/badges/award", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ badgeId, userId }),
      });
      if (res.ok) {
        notify("Thu hồi badge thành công!");
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        notify(json.error ?? "Có lỗi xảy ra.", true);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {(error || success) && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${error ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {error || success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit max-w-full">
        {(["badges", "award"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 sm:px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "badges" ? "Quản lý Badge" : "Trao Badge"}
          </button>
        ))}
      </div>

      {/* Tab: manage badges */}
      {tab === "badges" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create form */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Tạo Badge mới</h2>
            <form onSubmit={createBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên badge *</label>
                <input
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Hoàn thành dự án đầu tiên"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả *</label>
                <textarea
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Mô tả điều kiện đạt được badge này..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL icon (tuỳ chọn)</label>
                <input
                  value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Đang tạo..." : "Tạo Badge"}
              </button>
            </form>
          </div>

          {/* Badge list */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Badge hiện có ({badges.length})</h2>
            {badges.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có badge nào.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {badges.map((b) => (
                  <div key={b.id} className="flex items-start gap-3 border border-slate-100 rounded-xl p-3">
                    {b.iconUrl ? (
                      <img src={b.iconUrl} alt={b.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Icon name="badge" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{b.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{b.description}</p>
                    </div>
                    <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full shrink-0">
                      {b._count.userBadges} người
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: award */}
      {tab === "award" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Award form */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Trao Badge cho User</h2>
            <form onSubmit={awardBadge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Badge</label>
                <select
                  value={selectedBadge} onChange={(e) => setSelectedBadge(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Chọn badge --</option>
                  {badges.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn User</label>
                <select
                  value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Chọn user --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{`${u.name ?? u.email}${u.username ? ` (@${u.username})` : ""}`}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-amber-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Đang trao..." : "Trao Badge"}
              </button>
            </form>
          </div>

          {/* Users with badges */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Badges đã trao</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {users.filter((u) => u.badgesEarned.length > 0).map((u) => (
                <div key={u.id} className="border border-slate-100 rounded-xl p-3">
                  <p className="text-sm font-semibold text-slate-800 mb-2">
                    {u.name ?? u.email}
                    {u.username && <span className="text-xs font-normal text-slate-400 ml-1">@{u.username}</span>}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {u.badgesEarned.map((ub) => (
                      <button
                        key={ub.badgeId}
                        onClick={() => revokeBadge(ub.badgeId, u.id, ub.badge.name, u.name ?? u.username ?? u.id)}
                        disabled={isPending}
                        title="Nhấn để thu hồi"
                        className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                      >
                        {ub.badge.name} ×
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {users.every((u) => u.badgesEarned.length === 0) && (
                <p className="text-sm text-slate-400">Chưa có badge nào được trao.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
