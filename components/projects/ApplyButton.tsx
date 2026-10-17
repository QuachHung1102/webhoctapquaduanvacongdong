"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { MemberRole } from "@/app/generated/prisma/client";
import { MEMBER_ROLE_LABELS } from "@/constants/app";

interface Props {
  projectId: string;
  projectSlug: string;
  projectTitle: string;
}

// Every team role a learner can ask for — the mentor decides on review.
const ROLES = Object.entries(MEMBER_ROLE_LABELS) as [MemberRole, string][];

export default function ApplyButton({ projectId, projectSlug, projectTitle }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<MemberRole>("DEVELOPER");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!session) {
    return (
      <a
        href={`/login?callbackUrl=${encodeURIComponent(`/projects/${projectSlug}`)}`}
        className="w-full block text-center bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
      >
        Đăng nhập để ứng tuyển
      </a>
    );
  }

  if (result === "success") {
    return (
      <div className="w-full text-center bg-green-50 text-green-700 font-semibold py-2.5 rounded-xl text-sm border border-green-200">
        Đã gửi đơn. Mentor sẽ phản hồi qua thông báo.
      </div>
    );
  }

  async function handleSubmit() {
    setErrorMsg("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            role,
            message: message.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error ?? "Có lỗi xảy ra.");
          setResult("error");
        } else {
          setResult("success");
          setOpen(false);
          router.refresh();
        }
      } catch {
        setErrorMsg("Không thể kết nối tới máy chủ.");
        setResult("error");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
      >
        Ứng tuyển ngay
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500 font-medium">Ứng tuyển: <span className="text-slate-700">{projectTitle}</span></p>

      {/* Role selector */}
      <div>
        <label htmlFor="apply-role" className="text-xs font-medium text-slate-600 mb-1 block">Vai trò mong muốn</label>
        <select
          id="apply-role"
          value={role}
          onChange={(e) => setRole(e.target.value as MemberRole)}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {ROLES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="apply-message" className="text-xs font-medium text-slate-600 mb-1 block">Lời nhắn (tuỳ chọn)</label>
        <textarea
          id="apply-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Giới thiệu bản thân và lý do muốn tham gia..."
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { setOpen(false); setResult(null); setErrorMsg(""); }}
          disabled={isPending}
          className="flex-1 text-sm border border-slate-200 text-slate-600 py-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Huỷ
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 text-sm bg-indigo-600 text-white font-semibold py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Đang gửi..." : "Gửi đơn"}
        </button>
      </div>
    </div>
  );
}
