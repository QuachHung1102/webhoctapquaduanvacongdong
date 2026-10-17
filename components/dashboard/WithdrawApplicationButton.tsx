"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Learner: withdraw one's own PENDING application, with an inline confirm step. */
export default function WithdrawApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function withdraw() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Không thể rút đơn.");
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-xs font-medium text-slate-600 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:text-red-600 hover:border-red-300 transition-colors"
        >
          Rút đơn
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-600">Rút đơn này?</span>
          <button
            type="button"
            onClick={withdraw}
            disabled={busy}
            className="text-xs font-medium bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Đang rút..." : "Xác nhận"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="text-xs text-slate-500 border border-slate-200 bg-white px-3 py-1.5 rounded-lg hover:bg-slate-50"
          >
            Huỷ
          </button>
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
