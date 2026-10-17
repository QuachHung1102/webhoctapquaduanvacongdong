"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  slug: string;
  currentOutputUrl?: string | null;
  canSubmit: boolean; // isMentor || isMember && status in [REVIEWING, COMPLETED]
}

export default function ProjectOutputForm({ slug, currentOutputUrl, canSubmit }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState(currentOutputUrl ?? "");
  const [isPending, start] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit() {
    setError("");
    setSuccess(false);
    start(async () => {
      const res = await fetch(`/api/projects/${slug}/output`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ outputUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lỗi không xác định."); return; }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Link sản phẩm / demo</h3>

      {currentOutputUrl && !canSubmit && (
        <a
          href={currentOutputUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-indigo-600 hover:underline break-all"
        >
          {currentOutputUrl}
        </a>
      )}

      {canSubmit && (
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setSuccess(false); }}
            placeholder="https://github.com/... hoặc https://your-demo.vercel.app"
            className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={submit}
            disabled={isPending || !url.trim()}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "..." : "Lưu"}
          </button>
        </div>
      )}

      {error   && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">Đã lưu link output thành công!</p>}
    </div>
  );
}
