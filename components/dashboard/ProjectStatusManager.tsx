"use client";

/**
 * components/dashboard/ProjectStatusManager.tsx
 * Cho mentor quản lý trạng thái dự án: chuyển bước tiến độ,
 * kết thúc dự án, huỷ dự án.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Status = "RECRUITING" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED" | "UPCOMING" | "CANCELLED";

interface Props {
  slug: string;
  currentStatus: Status;
}

const STATUS_FLOW: Status[] = ["UPCOMING", "RECRUITING", "IN_PROGRESS", "REVIEWING", "COMPLETED"];

const STATUS_INFO: Record<Status, { label: string; color: string }> = {
  UPCOMING:    { label: "Sắp mở",      color: "text-slate-600  bg-slate-50  border-slate-200" },
  RECRUITING:  { label: "Đang tuyển",  color: "text-indigo-600   bg-indigo-50   border-indigo-200" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  REVIEWING:   { label: "Đang review", color: "text-amber-600  bg-amber-50  border-amber-200" },
  COMPLETED:   { label: "Hoàn thành",  color: "text-green-600  bg-green-50  border-green-200" },
  CANCELLED:   { label: "Đã huỷ",      color: "text-red-600    bg-red-50    border-red-200" },
};

const NEXT_STEP: Partial<Record<Status, Status>> = {
  UPCOMING:    "RECRUITING",
  RECRUITING:  "IN_PROGRESS",
  IN_PROGRESS: "REVIEWING",
  REVIEWING:   "COMPLETED",
};

const NEXT_LABEL: Partial<Record<Status, string>> = {
  UPCOMING:    "Mở tuyển thành viên",
  RECRUITING:  "Bắt đầu dự án",
  IN_PROGRESS: "Chuyển sang Review",
  REVIEWING:   "Đánh dấu Hoàn thành",
};

export default function ProjectStatusManager({ slug, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState("");

  const nextStep    = NEXT_STEP[currentStatus];
  const info        = STATUS_INFO[currentStatus];
  const isTerminal  = currentStatus === "COMPLETED" || currentStatus === "CANCELLED";
  const currentIdx  = STATUS_FLOW.indexOf(currentStatus);

  async function updateStatus(newStatus: Status) {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/projects/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Có lỗi xảy ra.");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-slate-800">Quản lý tiến độ dự án</h2>

      {/* Progress stepper */}
      {currentStatus !== "CANCELLED" && (
        <div className="flex items-center gap-0">
          {STATUS_FLOW.map((s, idx) => {
            const isPast    = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 shrink-0 transition-colors
                  ${isCurrent ? "border-indigo-500 bg-indigo-500 text-white"
                  : isPast    ? "border-green-400 bg-green-400 text-white"
                  : "border-slate-200 bg-white text-slate-400"}`}
                >
                  {isPast ? "✓" : idx + 1}
                </div>
                {idx < STATUS_FLOW.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-0.5 ${isPast ? "bg-green-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Current badge */}
      <div className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border ${info.color}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        {info.label}
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Actions */}
      {!isTerminal && (
        <div className="flex flex-col gap-2">
          {nextStep && (
            <button
              onClick={() => updateStatus(nextStep)}
              disabled={isPending}
              className="w-full text-sm font-semibold bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Đang cập nhật..." : `→ ${NEXT_LABEL[currentStatus]}`}
            </button>
          )}

          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={isPending}
              className="w-full text-xs text-red-500 hover:text-red-600 py-1"
            >
              Huỷ dự án
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-2">
              <p className="text-xs text-red-700 font-medium">Xác nhận huỷ dự án? Thao tác này không thể hoàn tác.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCancelConfirm(false); updateStatus("CANCELLED"); }}
                  disabled={isPending}
                  className="flex-1 text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Xác nhận huỷ
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50"
                >
                  Không
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {currentStatus === "COMPLETED" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-sm text-green-700 font-medium">Dự án đã hoàn thành</p>
          <p className="text-xs text-green-600 mt-1">Thành viên có thể để lại đánh giá nhau trong phần Review.</p>
        </div>
      )}

      {currentStatus === "CANCELLED" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-sm text-red-600 font-medium">Dự án đã bị huỷ.</p>
          <button
            onClick={() => updateStatus("RECRUITING")}
            disabled={isPending}
            className="text-xs text-red-500 hover:underline mt-1"
          >
            Khôi phục dự án
          </button>
        </div>
      )}
    </div>
  );
}
