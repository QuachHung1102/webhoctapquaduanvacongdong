import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/session";
import { getFullCurrentUser } from "@/lib/queries/user";
import { prisma } from "@/lib/db";
import SkillsEditor from "@/components/dashboard/SkillsEditor";

export const metadata: Metadata = { title: "Kỹ năng — ProjectHub" };

export default async function SkillsPage() {
  const authUser = await requireAuth();
  const [user, allSkills] = await Promise.all([
    getFullCurrentUser(authUser.id),
    prisma.skill.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, category: true } }),
  ]);

  if (!user) return null;

  const mySkills = user.skillsTagged.map((us) => ({
    id: us.skill.id,
    name: us.skill.name,
    level: us.level,
    category: us.skill.category ?? "Other",
  }));

  const allSkillsSerialized = allSkills.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category ?? "Other",
  }));

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
        <Link href="/dashboard/profile" className="hover:text-slate-600">Hồ sơ</Link>
        <span>/</span>
        <span>Kỹ năng</span>
      </div>
      <h1 className="text-xl font-bold text-slate-900">Quản lý kỹ năng</h1>
      <SkillsEditor
        mySkills={mySkills}
        allSkills={allSkillsSerialized}
      />
    </div>
  );
}
