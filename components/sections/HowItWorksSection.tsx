import Image from "next/image";
import SectionHeading from "@/components/sections/SectionHeading";

const steps = [
  {
    title: "Tạo hồ sơ và khai báo kỹ năng",
    description:
      "Đăng ký tài khoản, thêm các kỹ năng bạn đang có cùng mức độ thành thạo để mentor biết nên xếp bạn vào vai trò nào.",
  },
  {
    title: "Đăng ký vào một vai trò trong dự án",
    description:
      "Xem mục tiêu, thời lượng và kỹ năng yêu cầu của từng dự án đang tuyển, rồi gửi đơn cho vai trò phù hợp với bạn.",
  },
  {
    title: "Làm việc theo sprint cùng nhóm",
    description:
      "Nhận task trên bảng Kanban, cập nhật tiến độ mỗi sprint. Mentor theo dõi tiến độ và duyệt các task chờ review.",
  },
  {
    title: "Nhận đánh giá và lưu vào portfolio",
    description:
      "Khi dự án hoàn thành, các thành viên đánh giá lẫn nhau, bạn nhận huy hiệu và thêm sản phẩm vào trang hồ sơ công khai.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <div className="lg:sticky lg:top-28">
          <SectionHeading
            eyebrow="Cách hoạt động"
            title="Bốn bước từ đăng ký đến sản phẩm hoàn chỉnh"
            description="Quy trình giống cách một nhóm sản phẩm thật vận hành, chỉ khác là luôn có mentor đi cùng."
          />
          <div className="relative mt-10 aspect-16/10 rounded-3xl overflow-hidden ring-1 ring-slate-900/5">
            <Image
              src="/images/hero/workshop.jpg"
              alt="Một nhóm đang lên kế hoạch sprint bằng giấy ghi chú dán trên tường"
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <ol className="lg:pt-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative flex gap-6 pb-12 last:pb-0">
              {i < steps.length - 1 && (
                <span className="absolute left-6 top-14 bottom-2 w-px bg-slate-200" aria-hidden="true" />
              )}
              <span className="shrink-0 w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center tabular">
                {i + 1}
              </span>
              <div className="pt-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed max-w-md">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
