import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ProjectStatus } from "@/app/generated/prisma/client";
import AdminProjectsTable from "@/components/admin/AdminProjectsTable";

export const metadata: Metadata = { title: "Quản lý dự án — Admin" };

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const { page = "1", search = "", status: rawStatus } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  // Ignore anything that is not a real ProjectStatus instead of handing it to Prisma.
  const status = Object.values(ProjectStatus).find((s) => s === rawStatus);
  const pageSize = 20;

  const where = {
    ...(search && {
      OR: [
        { title:       { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && { status }),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      select: {
        id:         true,
        slug:       true,
        title:      true,
        status:     true,
        category:   true,
        difficulty: true,
        createdAt:  true,
        mentor: { select: { id: true, name: true } },
        _count: { select: { members: true, applications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  const serialized = projects.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý dự án</h1>
          <p className="text-sm text-slate-500 mt-0.5">Tổng cộng {total} dự án</p>
        </div>
      </div>
      <AdminProjectsTable
        projects={serialized}
        total={total}
        page={pageNum}
        pageSize={pageSize}
        search={search}
        status={status ?? "ALL"}
      />
    </div>
  );
}
