import type { Metadata } from "next";
import Link from "next/link";
import DocPage from "@/components/public/DocPage";

export const metadata: Metadata = {
  title: "Trợ giúp — ProjectHub",
  description: "Câu hỏi thường gặp khi tham gia dự án trên ProjectHub.",
};

const faqs = [
  {
    heading: "Làm sao để tham gia một dự án?",
    body: [
      "Tạo tài khoản học viên, mở trang Dự án và chọn một dự án có trạng thái Đang tuyển. Trong trang chi tiết, bấm Ứng tuyển ngay, chọn vai trò bạn muốn và viết vài dòng giới thiệu.",
      "Mentor của dự án sẽ duyệt đơn. Kết quả được gửi về mục Thông báo trong dashboard.",
    ],
  },
  {
    heading: "Tôi có thể rút đơn đã gửi không?",
    body: ["Có. Vào Dashboard, mục Đơn đăng ký: đơn nào còn ở trạng thái chờ duyệt đều có nút Rút đơn."],
  },
  {
    heading: "Công việc trong dự án được giao thế nào?",
    body: [
      "Mentor chia dự án thành các sprint. Mỗi sprint có một bảng Kanban gồm bốn cột: Cần làm, Đang làm, Đang review và Hoàn thành.",
      "Bạn chuyển thẻ task của mình sang cột tương ứng khi tiến độ thay đổi. Trang Tasks của tôi gom mọi task đang mở ở tất cả dự án.",
    ],
  },
  {
    heading: "Đánh giá và huy hiệu hoạt động ra sao?",
    body: [
      "Khi dự án chuyển sang Đang review hoặc Hoàn thành, các thành viên chấm điểm lẫn nhau theo thang 5 sao và học viên đánh giá mentor.",
      "Điểm trung bình, số dự án hoàn thành và huy hiệu do quản trị viên trao cộng lại thành thứ hạng trên Bảng xếp hạng.",
    ],
  },
  {
    heading: "Portfolio lấy dữ liệu từ đâu?",
    body: [
      "Bạn tự thêm sản phẩm từ những dự án mình đã tham gia tại mục Portfolio trong dashboard, kèm mô tả, ảnh bìa, link demo và mã nguồn.",
      "Mục nào đặt ở chế độ công khai sẽ hiện trên trang hồ sơ của bạn tại địa chỉ /u/tên-người-dùng.",
    ],
  },
  {
    heading: "Tôi quên mật khẩu",
    body: [
      "Ở trang đăng nhập chọn Quên mật khẩu, nhập email rồi trả lời câu hỏi bảo mật bạn đã đặt khi đăng ký để tạo mật khẩu mới.",
    ],
  },
  {
    heading: "Làm sao để trở thành mentor?",
    body: [
      "Tài khoản mới mặc định là học viên. Quyền mentor do quản trị viên cấp sau khi xem hồ sơ và kinh nghiệm của bạn.",
    ],
  },
];

export default function HelpPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <DocPage
      eyebrow="Trợ giúp"
      title="Câu hỏi thường gặp"
      intro="Những điều học viên hay hỏi nhất khi bắt đầu dự án đầu tiên."
      sections={faqs}
    >
      <section id="contact" className="mt-6 rounded-2xl bg-slate-50 p-8">
        <h2 className="text-lg font-bold text-slate-900">Vẫn chưa tìm thấy câu trả lời?</h2>
        <p className="mt-2 text-slate-600 leading-relaxed max-w-2xl">
          Nếu câu hỏi liên quan tới một dự án cụ thể, mentor phụ trách dự án đó là người trả lời nhanh nhất.{" "}
          {email
            ? "Các vấn đề về tài khoản, hãy gửi email cho quản trị viên."
            : "Các vấn đề về tài khoản do quản trị viên của nền tảng xử lý."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {email && (
            <a
              href={`mailto:${email}`}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              {email}
            </a>
          )}
          <Link
            href="/community"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white ring-1 ring-slate-200 hover:ring-indigo-300 transition-colors"
          >
            Xem danh sách mentor
          </Link>
        </div>
      </section>
    </DocPage>
  );
}
