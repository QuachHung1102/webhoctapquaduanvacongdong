/**
 * Danh sách câu hỏi bảo mật — dùng chung cho register page và forgot-password.
 */
export const SECURITY_QUESTIONS = [
  "Tên thú cưng đầu tiên của bạn là gì?",
  "Tên trường tiểu học bạn từng học?",
  "Tên thành phố bạn sinh ra?",
  "Tên người bạn thân nhất thời thơ ấu?",
  "Món ăn yêu thích của bạn là gì?",
  "Tên đường nơi bạn lớn lên?",
  "Tên giáo viên yêu thích nhất của bạn?",
] as const;

export type SecurityQuestion = (typeof SECURITY_QUESTIONS)[number];
