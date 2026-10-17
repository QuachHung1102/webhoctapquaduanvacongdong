"use client";

/**
 * components/dashboard/MemberActions.tsx
 * Nút kick (mentor) hoặc rời dự án (member).
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  slug: string;
  userId: string;
  userName: string;
  isSelf: boolean;   // true → đây là nút "Rời dự án" của chính mình
  isMentor: boolean; // true → người dùng hiện tại là mentor (có quyền kick)
}

export default function MemberActions({ slug, userId, userName, isSelf, isMentor }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  if (!isSelf && !isMentor) return null;

  async function remove() {
    setError("");
    start(async () => {
      try {
        const res = await fetch(`/api/projects/${slug}/members`, {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ userId }),
        });
        if (res.ok) {
          if (isSelf) router.push("/dashboard/projects");
          else        router.refresh();
        } else {
          const json = await res.json().catch(() => ({}));
          setError(json.error ?? "Không thể thực hiện.");
        }
      } catch {
        setError("Không thể kết nối tới máy chủ.");
      }
    });
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className={`text-xs px-2 py-0.5 rounded-lg border transition-colors ${
          isSelf
            ? "text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-300"
            : "text-red-400 border-red-200 hover:bg-red-50"
        }`}
      >
        {isSelf ? "Rời" : "Loại"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap justify-end">
      <button
        onClick={remove}
        disabled={isPending}
        aria-label={isSelf ? "Xác nhận rời dự án" : `Xác nhận loại ${userName} khỏi dự án`}
        className="text-xs px-2 py-0.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
      >
        {isPending ? "..." : "Xác nhận"}
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-xs px-2 py-0.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
      >
        Huỷ
      </button>
      {error && <p role="alert" className="basis-full text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
