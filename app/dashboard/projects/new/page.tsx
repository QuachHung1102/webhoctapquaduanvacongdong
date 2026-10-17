import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/db";
import NewProjectForm from "@/components/dashboard/NewProjectForm";

export const metadata: Metadata = { title: "Tạo dự án mới — ProjectHub" };

export default async function NewProjectPage() {
  const authUser = await requireAuth();

  // Chỉ MENTOR hoặc ADMIN mới được tạo dự án
  if (authUser.role !== "MENTOR" && authUser.role !== "ADMIN") {
    redirect("/dashboard/overview");
  }

  // Lấy tất cả skills có sẵn để suggest
  const allSkills = await prisma.skill.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true },
  });

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tạo dự án mới</h1>
        <p className="text-slate-500 text-sm mt-1">
          Điền thông tin để tạo dự án và bắt đầu tuyển thành viên.
        </p>
      </div>
      <NewProjectForm
        allSkills={allSkills.map((s) => ({ id: s.id, name: s.name, category: s.category ?? "Khác" }))}
      />
    </div>
  );
}
