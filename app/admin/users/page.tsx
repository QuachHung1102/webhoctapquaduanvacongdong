import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { UserRole } from "@/app/generated/prisma/client";
import AdminUsersTable from "@/components/admin/AdminUsersTable";

export const metadata: Metadata = { title: "Quản lý người dùng — Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; role?: string }>;
}) {
  const { page = "1", search = "", role: rawRole } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  // Ignore anything that is not a real UserRole instead of handing it to Prisma.
  const role = Object.values(UserRole).find((r) => r === rawRole);
  const pageSize = 20;

  const where = {
    ...(search && {
      OR: [
        { name:  { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(role && { role }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id:         true,
        name:       true,
        email:      true,
        avatarUrl:  true,
        role:       true,
        isVerified: true,
        createdAt:  true,
        _count: { select: { projectsMentoring: true, memberships: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const serialized = users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý người dùng</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tổng cộng {total} người dùng</p>
        </div>
      </div>
      <AdminUsersTable
        users={serialized}
        total={total}
        page={pageNum}
        pageSize={pageSize}
        search={search}
        role={role ?? "ALL"}
      />
    </div>
  );
}
