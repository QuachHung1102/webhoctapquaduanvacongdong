/**
 * Navigation links dùng chung ở Navbar, Footer, ...
 */
export const NAV_LINKS = [
  { label: "Dự án", href: "/projects" },
  { label: "Cách hoạt động", href: "/#how-it-works" },
  { label: "Lĩnh vực", href: "/#project-types" },
  { label: "Mentor", href: "/#roles" },
] as const;

/**
 * Project category labels (UI display)
 */
export const CATEGORY_LABELS: Record<string, string> = {
  APP:     "Lập trình App",
  DESIGN:  "Thiết kế Website",
  VIDEO:   "Video Marketing",
  PRODUCT: "Sản phẩm Số",
};

/**
 * Difficulty labels
 */
export const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER:     "Cơ bản",
  INTERMEDIATE: "Trung bình",
  ADVANCED:     "Nâng cao",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER:     "text-green-600 bg-green-50",
  INTERMEDIATE: "text-yellow-600 bg-yellow-50",
  ADVANCED:     "text-red-600 bg-red-50",
};

/**
 * Project status labels
 */
export const STATUS_LABELS: Record<string, string> = {
  RECRUITING:  "Đang tuyển",
  IN_PROGRESS: "Đang thực hiện",
  REVIEWING:   "Đang review",
  COMPLETED:   "Hoàn thành",
  UPCOMING:    "Sắp mở",
  CANCELLED:   "Đã huỷ",
};

export const STATUS_COLORS: Record<string, string> = {
  RECRUITING:  "text-blue-600 bg-blue-50",
  IN_PROGRESS: "text-orange-600 bg-orange-50",
  REVIEWING:   "text-purple-600 bg-purple-50",
  COMPLETED:   "text-green-600 bg-green-50",
  UPCOMING:    "text-slate-600 bg-slate-100",
  CANCELLED:   "text-red-600 bg-red-50",
};

/**
 * Member role labels (vai trò trong nhóm dự án)
 */
export const MEMBER_ROLE_LABELS: Record<string, string> = {
  LEADER:            "Trưởng nhóm",
  DEVELOPER:         "Developer",
  MOBILE_DEV:        "Mobile Dev",
  FULLSTACK_DEV:     "Full-stack Dev",
  BACKEND_DEV:       "Backend Dev",
  FRONTEND_DEV:      "Frontend Dev",
  DESIGNER:          "Designer",
  CONTENT_CREATOR:   "Content Creator",
  VIDEO_EDITOR:      "Video Editor",
  MOTION_DESIGNER:   "Motion Designer",
  PRODUCT_MANAGER:   "Product Manager",
  QA:                "QA / Tester",
  CREATIVE_DIRECTOR: "Creative Director",
  SCRIPT_WRITER:     "Script Writer",
};

/**
 * System role labels
 */
export const USER_ROLE_LABELS: Record<string, string> = {
  LEARNER: "Học viên",
  MENTOR:  "Mentor",
  ADMIN:   "Quản trị viên",
};

/**
 * Stock photo per category — used when a project has no cover of its own.
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  APP:     "/images/categories/app.jpg",
  DESIGN:  "/images/categories/design.jpg",
  VIDEO:   "/images/categories/video.jpg",
  PRODUCT: "/images/categories/product.jpg",
};

export function projectCover(project: { coverImageUrl?: string | null; category: string }) {
  return project.coverImageUrl || CATEGORY_IMAGES[project.category] || CATEGORY_IMAGES.APP;
}

/**
 * Task priority / status labels (enum TaskPriority, TaskStatus)
 */
export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW:    "Thấp",
  MEDIUM: "Trung bình",
  HIGH:   "Cao",
  URGENT: "Khẩn cấp",
};

export const TASK_PRIORITY_COLORS: Record<string, string> = {
  LOW:    "bg-slate-100 text-slate-500",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH:   "bg-orange-50 text-orange-600",
  URGENT: "bg-red-50 text-red-600",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  TODO:        "Chưa làm",
  IN_PROGRESS: "Đang làm",
  IN_REVIEW:   "Đang review",
  DONE:        "Hoàn thành",
};

/** Fired on `window` when the unread notification count may have changed. */
export const NOTIFICATIONS_CHANGED_EVENT = "notifications:changed";
