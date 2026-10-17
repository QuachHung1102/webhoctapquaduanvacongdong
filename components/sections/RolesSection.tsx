import SectionHeading from "@/components/sections/SectionHeading";
import Icon, { type IconName } from "@/components/ui/Icon";

const roles: { icon: IconName; title: string; description: string; skills: string[] }[] = [
  {
    icon: "flag",
    title: "Trưởng nhóm",
    description: "Lên kế hoạch sprint, phân công task và giữ cho cả nhóm về đích đúng hạn.",
    skills: ["Lập kế hoạch", "Scrum", "Giao tiếp"],
  },
  {
    icon: "code",
    title: "Developer",
    description: "Xây dựng tính năng, viết code sạch và review code cho đồng đội.",
    skills: ["Frontend", "Backend", "Mobile"],
  },
  {
    icon: "pencil",
    title: "Designer",
    description: "Thiết kế giao diện, dựng prototype và giữ trải nghiệm nhất quán.",
    skills: ["Figma", "UI/UX", "Design System"],
  },
  {
    icon: "video",
    title: "Content & Video",
    description: "Viết nội dung, kịch bản, dựng video và lo phần truyền thông cho sản phẩm.",
    skills: ["Copywriting", "Dựng phim", "SEO"],
  },
  {
    icon: "shield",
    title: "QA / Tester",
    description: "Kiểm thử theo kế hoạch, ghi nhận lỗi và bảo đảm chất lượng trước khi bàn giao.",
    skills: ["Test case", "Báo cáo lỗi", "Kiểm thử người dùng"],
  },
];

export default function RolesSection() {
  return (
    <section id="roles" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-20">
        <SectionHeading
          eyebrow="Vai trò trong nhóm"
          title="Mỗi người một vai, cùng ra một sản phẩm"
          description="Khi đăng ký dự án bạn chọn luôn vai trò mình muốn đảm nhận. Mentor duyệt đơn dựa trên kỹ năng trong hồ sơ."
          className="lg:sticky lg:top-28 self-start"
        />

        <ul className="divide-y divide-slate-200 border-y border-slate-200">
          {roles.map((role) => (
            <li key={role.title} className="flex gap-5 py-6">
              <span className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon name={role.icon} />
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900">{role.title}</h3>
                <p className="mt-1 text-slate-600 leading-relaxed">{role.description}</p>
                <p className="mt-3 text-sm text-slate-500">{role.skills.join(" · ")}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
