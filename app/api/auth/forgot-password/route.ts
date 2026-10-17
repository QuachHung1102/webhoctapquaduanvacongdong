import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SECURITY_QUESTIONS } from "@/constants/auth";
import { passwordError, readJson, text } from "@/lib/validation";

// shortcut: no rate limiting on either handler — the security answer can be brute-forced
// and emails probed at request speed. Add a per-IP + per-email limit (e.g. 5 attempts / 15 min)
// before this is exposed publicly.

/**
 * Câu hỏi "mồi" cho email không tồn tại / chưa có câu hỏi: chọn cố định theo email
 * (cùng email → luôn cùng câu) để phản hồi không khác gì một tài khoản thật.
 */
function decoyQuestion(email: string) {
  let sum = 0;
  for (const char of email) sum += char.charCodeAt(0);
  return SECURITY_QUESTIONS[sum % SECURITY_QUESTIONS.length];
}

/**
 * GET /api/auth/forgot-password?email=...
 * Trả về câu hỏi bảo mật của user (không tiết lộ câu trả lời).
 * Luôn 200 với một câu hỏi — không tiết lộ email có tồn tại hay không.
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: "Vui lòng nhập email." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { securityQuestion: true },
    });

    return NextResponse.json({ question: user?.securityQuestion || decoyQuestion(email) });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

/**
 * POST /api/auth/forgot-password
 * Body: { email, answer, newPassword }
 * Xác minh câu trả lời bảo mật → đặt lại mật khẩu mới.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const email       = text(body.email).toLowerCase();
    const answer      = text(body.answer).toLowerCase();
    const newPassword = body.newPassword;

    if (!email || !answer || typeof newPassword !== "string" || !newPassword) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
    }

    // Cùng quy tắc với /api/users/me/change-password
    const invalid = passwordError(newPassword);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, securityAnswerHash: true },
    });

    // Luôn trả lỗi chung để tránh user enumeration
    if (!user?.securityAnswerHash) {
      return NextResponse.json(
        { error: "Câu trả lời không chính xác." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(answer, user.securityAnswerHash);
    if (!valid) {
      return NextResponse.json({ error: "Câu trả lời không chính xác." }, { status: 401 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash },
    });

    return NextResponse.json({ message: "Đặt lại mật khẩu thành công." });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
