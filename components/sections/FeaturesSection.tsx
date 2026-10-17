import Image from "next/image";
import SectionHeading from "@/components/sections/SectionHeading";
import Icon, { type IconName } from "@/components/ui/Icon";

const features: { icon: IconName; title: string; description: string }[] = [
  {
    icon: "users",
    title: "Nhóm có phân vai rõ ràng",
    description: "Trưởng nhóm, developer, designer, content — mỗi người một phần việc như ở công ty thật.",
  },
  {
    icon: "clipboard",
    title: "Kanban và sprint",
    description: "Task chia theo sprint, kéo thả qua các cột để cả nhóm luôn thấy việc đang ở đâu.",
  },
  {
    icon: "chart",
    title: "Theo dõi tiến độ cá nhân",
    description: "Trang tổng quan gom các task bạn đang làm và đơn đăng ký đang chờ vào một chỗ.",
  },
  {
    icon: "star",
    title: "Đánh giá hai chiều",
    description: "Cuối dự án, thành viên đánh giá lẫn nhau và đánh giá cả mentor bằng thang 5 sao.",
  },
  {
    icon: "badge",
    title: "Huy hiệu và bảng xếp hạng",
    description: "Dự án hoàn thành, điểm đánh giá và huy hiệu cộng lại thành thứ hạng của bạn.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Tính năng"
          title="Một nơi để làm việc nhóm, không chỉ để xem bài giảng"
          className="mb-12"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Lead card with photo */}
          <article className="relative isolate overflow-hidden rounded-3xl md:col-span-2 lg:col-span-1 lg:row-span-3 min-h-80 flex flex-col justify-end p-7 text-white">
            <Image
              src="/images/hero/mentor.jpg"
              alt="Mentor và học viên cùng xem code trên màn hình"
              fill
              sizes="(min-width: 1024px) 800px, 100vw"
              className="-z-10 object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/60 to-transparent" />
            <h3 className="text-2xl font-bold mb-2">Mentor đi cùng từng dự án</h3>
            <p className="text-slate-200 leading-relaxed">
              Mỗi dự án do một mentor đang làm nghề phụ trách: duyệt đơn, lập sprint, giao task và đánh giá
              từng thành viên khi kết thúc.
            </p>
          </article>

          {features.map((feat) => (
            <article key={feat.title} className="rounded-3xl bg-slate-50 p-7">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 ring-1 ring-slate-200">
                <Icon name={feat.icon} />
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
            </article>
          ))}

          <article className="rounded-3xl bg-indigo-600 p-7 text-white">
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Icon name="folder" />
            </span>
            <h3 className="text-lg font-bold mb-2">Portfolio từ dự án thật</h3>
            <p className="text-sm text-indigo-100 leading-relaxed">
              Thêm sản phẩm đã hoàn thành vào hồ sơ và gửi đường dẫn trang cá nhân công khai cho nhà tuyển dụng.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
