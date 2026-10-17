"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/constants/app";
import Icon, { type IconName } from "@/components/ui/Icon";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, { icon: IconName; tone: string }> = {
  APPLICATION_ACCEPTED:  { icon: "check",     tone: "bg-emerald-100 text-emerald-700" },
  APPLICATION_REJECTED:  { icon: "x",         tone: "bg-red-100 text-red-600" },
  TASK_ASSIGNED:         { icon: "clipboard", tone: "bg-indigo-100 text-indigo-700" },
  TASK_COMPLETED:        { icon: "check",     tone: "bg-emerald-100 text-emerald-700" },
  SPRINT_STARTED:        { icon: "bolt",      tone: "bg-amber-100 text-amber-700" },
  PROJECT_COMPLETED:     { icon: "badge",     tone: "bg-emerald-100 text-emerald-700" },
  REVIEW_RECEIVED:       { icon: "star",      tone: "bg-amber-100 text-amber-700" },
  MEMBER_JOINED:         { icon: "users",     tone: "bg-indigo-100 text-indigo-700" },
  MENTION:               { icon: "chat",      tone: "bg-slate-100 text-slate-600" },
};
const DEFAULT_ICON = { icon: "bell" as IconName, tone: "bg-slate-100 text-slate-600" };

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

interface Props {
  notifications: Notification[];
}

/** Tells the Sidebar to refetch its unread badge now instead of at the next poll. */
const notifyChanged = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));

export function MarkAllReadButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={async () => {
        await action();
        notifyChanged();
      }}
    >
      <button type="submit" className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline py-2">
        Đánh dấu tất cả đã đọc
      </button>
    </form>
  );
}

export default function NotificationsList({ notifications }: Props) {
  // The list itself comes from props (so "mark all read" and refreshes show up);
  // this only remembers clicks until the server copy catches up.
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const router = useRouter();
  const items = notifications.map((n) => (readIds.has(n.id) ? { ...n, isRead: true } : n));

  async function markRead(notif: Notification) {
    if (notif.isRead) return;
    setReadIds((prev) => new Set(prev).add(notif.id));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      });
    } catch {
      // Not marked on the server: the next refresh shows it unread again.
    }
    notifyChanged();
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white border border-slate-200 rounded-xl">
        <p className="text-slate-500 text-sm">Chưa có thông báo nào. Thông báo về đơn ứng tuyển, task và đánh giá sẽ hiện ở đây.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
      {items.map((notif) => (
        <div
          key={notif.id}
          onClick={() => {
            markRead(notif);
            if (notif.link) router.push(notif.link);
          }}
          className={`flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.isRead ? "bg-indigo-50/40" : ""}`}
        >
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${(TYPE_ICONS[notif.type] ?? DEFAULT_ICON).tone}`}>
            <Icon name={(TYPE_ICONS[notif.type] ?? DEFAULT_ICON).icon} className="w-4.5 h-4.5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${!notif.isRead ? "text-slate-900" : "text-slate-700"}`}>
              {notif.title}
            </p>
            {notif.message && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">{relativeTime(notif.createdAt)}</p>
          </div>
          {!notif.isRead && (
            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
