import type { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { getFullCurrentUser, getUserPortfolio } from "@/lib/queries/user";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { USER_ROLE_LABELS } from "@/constants/app";

export const metadata: Metadata = { title: "Hồ sơ — ProjectHub" };

const SKILL_LEVEL_LABEL: Record<number, string> = {
  1: "Mới bắt đầu",
  2: "Cơ bản",
  3: "Trung bình",
  4: "Khá",
  5: "Thành thạo",
};

const SKILL_LEVEL_COLOR: Record<number, string> = {
  1: "bg-slate-100 text-slate-600",
  2: "bg-indigo-50 text-indigo-600",
  3: "bg-yellow-50 text-yellow-600",
  4: "bg-orange-50 text-orange-600",
  5: "bg-green-50 text-green-700",
};

export default async function ProfilePage() {
  const authUser = await requireAuth();
  const [user, portfolio] = await Promise.all([
    getFullCurrentUser(authUser.id),
    getUserPortfolio(authUser.id, true),
  ]);

  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ của tôi</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/profile/change-password"
            className="text-sm font-medium border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Đổi mật khẩu
          </Link>
          <Link
            href="/dashboard/profile/edit"
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Chỉnh sửa
          </Link>
        </div>
      </div>

      {/* Avatar + Basic info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 flex gap-4 sm:gap-5">
        <Avatar name={user.name} src={user.avatarUrl} size="lg" className="sm:w-20 sm:h-20 sm:text-3xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            {user.isVerified && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                ✓ Đã xác minh
              </span>
            )}
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {USER_ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5 break-all">{user.email}</p>
          {user.bio ? (
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">{user.bio}</p>
          ) : (
            <p className="text-sm text-slate-400 mt-2 italic">Chưa có giới thiệu. <Link href="/dashboard/profile/edit" className="text-indigo-500 hover:underline">Thêm ngay</Link></p>
          )}
          <p className="text-xs text-slate-400 mt-3">
            Tham gia từ {new Date(user.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Kỹ năng</h3>
          <Link href="/dashboard/profile/skills" className="text-xs text-indigo-600 hover:underline">Cập nhật →</Link>
        </div>
        {user.skillsTagged.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.skillsTagged.map((us) => (
              <span
                key={us.skillId}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  SKILL_LEVEL_COLOR[us.level] ?? "bg-slate-100 text-slate-600"
                }`}
                title={SKILL_LEVEL_LABEL[us.level]}
              >
                {us.skill.name}
                <span className="ml-1 opacity-60">· Lv{us.level}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Chưa có kỹ năng nào.{" "}
            <Link href="/dashboard/profile/skills" className="text-indigo-500 hover:underline not-italic">Thêm kỹ năng</Link>
          </p>
        )}
      </div>

      {/* Portfolio */}
      {portfolio.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <h3 className="font-semibold text-slate-800 mb-2">Portfolio</h3>
          <p className="text-sm text-slate-400 italic">
            Chưa có mục portfolio nào.{" "}
            <Link href="/dashboard/profile/portfolio" className="text-indigo-500 hover:underline not-italic">Thêm sản phẩm</Link>
          </p>
        </div>
      )}
      {portfolio.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Portfolio ({portfolio.length})</h3>
          <div className="space-y-3">
            {portfolio.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.project.title}</p>
                  {p.summary && <p className="text-xs text-slate-500 mt-0.5">{p.summary}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!p.isPublic && (
                    <span className="text-xs text-slate-400">Riêng tư</span>
                  )}
                  {p.demoUrl && (
                    <a
                      href={p.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Xem →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
