import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import BadgeManager from "@/components/admin/BadgeManager";

export const metadata: Metadata = {
  title: "Quản lý Badge — Admin",
};

export default async function AdminBadgesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const [badges, users] = await Promise.all([
    prisma.badge.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { userBadges: true } } },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id:       true,
        name:     true,
        username: true,
        email:    true,
        badgesEarned: {
          select: {
            badgeId:  true,
            earnedAt: true,
            badge:    { select: { name: true } },
          },
        },
      },
    }),
  ]);

  // earnedAt là Date từ Prisma — serialize trước khi pass
  const serializedUsers = users.map((u) => ({
    ...u,
    badgesEarned: u.badgesEarned.map((ub) => ({
      ...ub,
      earnedAt: ub.earnedAt.toISOString(),
    })),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Badge</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tạo huy hiệu thành tích và trao cho người dùng. Badge sẽ hiển thị trên hồ sơ public.
          </p>
        </div>

        <BadgeManager initialBadges={badges} users={serializedUsers} />
      </div>
    </div>
  );
}
