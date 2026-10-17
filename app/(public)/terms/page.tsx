import type { Metadata } from "next";
import DocPage from "@/components/public/DocPage";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng — ProjectHub",
  description: "Các quy định khi sử dụng nền tảng ProjectHub.",
};

const sections = [
  {
    heading: "Phạm vi",
    body: [
      "ProjectHub là nền tảng học tập qua dự án. Các dự án trên nền tảng phục vụ mục đích học tập và xây dựng portfolio, không phải hợp đồng lao động hay cam kết việc làm.",
    ],
  },
  {
    heading: "Tài khoản",
    body: [
      "Bạn chịu trách nhiệm về thông tin đăng ký và giữ bí mật mật khẩu cũng như câu trả lời bảo mật của mình.",
      "Mỗi người dùng một tài khoản. Quản trị viên có thể đổi vai trò của tài khoản vi phạm các điều khoản này.",
    ],
  },
  {
    heading: "Ứng xử trong dự án",
    body: [
      "Tôn trọng thành viên khác, hoàn thành phần việc đã nhận hoặc báo sớm cho mentor khi không thể tiếp tục.",
      "Đánh giá thành viên và mentor phải trung thực, dựa trên quá trình làm việc thực tế trong dự án.",
    ],
  },
  {
    heading: "Nội dung bạn đăng",
    body: [
      "Bạn giữ quyền với sản phẩm, mô tả và hình ảnh mình đưa lên. Khi đặt một mục portfolio ở chế độ công khai, bạn đồng ý để nền tảng hiển thị mục đó trên trang hồ sơ của bạn.",
      "Không đăng nội dung vi phạm pháp luật, vi phạm bản quyền hoặc chứa mã độc.",
    ],
  },
  {
    heading: "Sản phẩm của nhóm",
    body: [
      "Sản phẩm của một dự án là công sức chung của cả nhóm. Mỗi thành viên được dùng sản phẩm đó trong portfolio cá nhân và cần ghi rõ phần đóng góp của mình.",
    ],
  },
  {
    heading: "Thay đổi điều khoản",
    body: ["Điều khoản có thể được cập nhật khi nền tảng thêm tính năng mới. Bản đang hiệu lực luôn nằm tại trang này."],
  },
];

export default function TermsPage() {
  return (
    <DocPage
      eyebrow="Pháp lý"
      title="Điều khoản sử dụng"
      intro="Những quy định ngắn gọn để mọi người làm việc với nhau một cách tử tế."
      sections={sections}
    />
  );
}
