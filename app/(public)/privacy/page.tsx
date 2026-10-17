import type { Metadata } from "next";
import DocPage from "@/components/public/DocPage";

export const metadata: Metadata = {
  title: "Chính sách bảo mật — ProjectHub",
  description: "ProjectHub thu thập dữ liệu gì và dùng vào việc gì.",
};

const sections = [
  {
    heading: "Dữ liệu chúng tôi lưu",
    body: [
      "Thông tin tài khoản: họ tên, email, tên người dùng, ảnh đại diện và phần giới thiệu bạn tự nhập.",
      "Hoạt động học tập: đơn đăng ký, vai trò trong dự án, task được giao, kỹ năng, portfolio, huy hiệu và các đánh giá bạn viết hoặc nhận.",
    ],
  },
  {
    heading: "Mật khẩu",
    body: [
      "Mật khẩu và câu trả lời bảo mật chỉ được lưu dưới dạng băm một chiều (bcrypt). Không ai, kể cả quản trị viên, đọc được bản gốc.",
    ],
  },
  {
    heading: "Những gì hiển thị công khai",
    body: [
      "Trang hồ sơ /u/tên-người-dùng hiện họ tên, ảnh đại diện, giới thiệu, kỹ năng, huy hiệu, các dự án đã tham gia và mục portfolio bạn đặt công khai.",
      "Đánh giá chéo giữa các thành viên chỉ hiện điểm trung bình. Nhận xét học viên viết cho mentor hiện trên hồ sơ của mentor đó. Email của bạn không hiển thị công khai.",
    ],
  },
  {
    heading: "Ảnh tải lên",
    body: ["Ảnh đại diện, ảnh bìa dự án và ảnh portfolio được lưu trên dịch vụ Cloudinary và phân phối qua đường dẫn công khai."],
  },
  {
    heading: "Cookie",
    body: ["Nền tảng chỉ dùng cookie phiên đăng nhập. Không có cookie quảng cáo hay công cụ theo dõi của bên thứ ba."],
  },
  {
    heading: "Quyền của bạn",
    body: [
      "Bạn có thể sửa hồ sơ, kỹ năng và portfolio bất cứ lúc nào trong dashboard. Để xoá tài khoản cùng dữ liệu liên quan, hãy liên hệ quản trị viên.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Pháp lý"
      title="Chính sách bảo mật"
      intro="Nền tảng lưu những gì về bạn, ai nhìn thấy và bạn kiểm soát ra sao."
      sections={sections}
    />
  );
}
