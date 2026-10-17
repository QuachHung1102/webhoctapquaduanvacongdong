import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/session";
import { getNotifications, markAllNotificationsRead } from "@/lib/queries/dashboard";
import NotificationsList, { MarkAllReadButton } from "@/components/dashboard/NotificationsList";

export const metadata: Metadata = { title: "Thông báo — ProjectHub" };

export default async function NotificationsPage() {
  const authUser = await requireAuth();
  const notifications = await getNotifications(authUser.id);

  // Serialise dates for client
  const serialized = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  async function markAllRead() {
    "use server";
    await markAllNotificationsRead(authUser.id);
    revalidatePath("/dashboard/notifications");
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-slate-900">Thông báo</h1>
        <MarkAllReadButton action={markAllRead} />
      </div>
      <NotificationsList notifications={serialized} />
    </div>
  );
}
