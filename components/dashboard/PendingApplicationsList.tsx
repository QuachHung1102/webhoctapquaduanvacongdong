"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { MEMBER_ROLE_LABELS } from "@/constants/app";

interface Application {
  id: string;
  status: string;
  role: string;
  message: string | null;
  createdAt: string;
  user: { id: string; name: string | null; avatarUrl: string | null; bio: string | null };
  project: { id: string; slug: string; title: string };
}

interface Props {
  applications: Application[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Chờ duyệt",
  ACCEPTED:  "Đã chấp nhận",
  REJECTED:  "Đã từ chối",
  WITHDRAWN: "Đã rút",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-50 text-yellow-700",
  ACCEPTED:  "bg-green-50 text-green-700",
  REJECTED:  "bg-red-50 text-red-700",
  WITHDRAWN: "bg-slate-100 text-slate-500",
};

export default function PendingApplicationsList({ applications }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [processing, setProcessing] = useState<string | null>(null);
  const [localApps, setLocalApps] = useState(applications);
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);

  async function handleDecision(id: string, status: "ACCEPTED" | "REJECTED") {
    setProcessing(id);
    setFailure(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/applications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          setLocalApps((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status } : a))
          );
          router.refresh();
        } else {
          const json = await res.json().catch(() => ({}));
          setFailure({ id, message: json.error ?? "Không thể xử lý đơn này." });
        }
      } catch {
        setFailure({ id, message: "Không thể kết nối tới máy chủ." });
      }
      setProcessing(null);
    });
  }

  const pendingApps  = localApps.filter((a) => a.status === "PENDING");
  const decidedApps  = localApps.filter((a) => a.status !== "PENDING");

  return (
    <div className="space-y-6">
      {/* Pending */}
      {pendingApps.length === 0 && (
        <div className="text-center py-10 bg-white border border-slate-200 rounded-xl text-slate-500">
          Không có đơn nào đang chờ duyệt.
        </div>
      )}
      {pendingApps.map((app) => (
        <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex gap-3 sm:gap-4">
          <Avatar name={app.user.name} src={app.user.avatarUrl} size="md" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-semibold text-slate-800">{app.user.name}</p>
                <p className="text-sm text-slate-500">
                  Đăng ký vai trò <span className="font-medium text-slate-700">{MEMBER_ROLE_LABELS[app.role] ?? app.role}</span>{" "}
                  trong dự án <span className="font-medium text-slate-700">{app.project.title}</span>
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(app.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            {app.user.bio && (
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">{app.user.bio}</p>
            )}
            {app.message && (
              <blockquote className="mt-2 border-l-2 border-indigo-200 pl-3 text-sm text-slate-600 italic line-clamp-3">
                {app.message}
              </blockquote>
            )}
            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleDecision(app.id, "ACCEPTED")}
                disabled={pending && processing === app.id}
                className="text-sm font-medium bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {processing === app.id ? "Đang xử lý..." : "Chấp nhận"}
              </button>
              <button
                onClick={() => handleDecision(app.id, "REJECTED")}
                disabled={pending && processing === app.id}
                className="text-sm font-medium bg-white border border-red-300 text-red-600 px-4 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Từ chối
              </button>
            </div>
            {failure?.id === app.id && (
              <p role="alert" className="mt-2 text-sm text-red-600">{failure.message}</p>
            )}
          </div>
        </div>
      ))}

      {/* Decided */}
      {decidedApps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Đã xử lý ({decidedApps.length})
          </h3>
          <div className="space-y-2">
            {decidedApps.map((app) => (
              <div key={app.id} className="bg-white border border-slate-100 rounded-lg px-4 py-3 flex items-center gap-3">
                <Avatar name={app.user.name} src={app.user.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-700">{app.user.name}</span>
                  <span className="text-sm text-slate-400"> — {app.project.title}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[app.status]}`}>
                  {STATUS_LABELS[app.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
