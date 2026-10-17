import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { readJson, text, uniqueUsername, usernameBase } from "@/lib/validation";

// POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    const body = await readJson(req);
    const email            = text(body.email).toLowerCase();
    const name             = text(body.name);
    const securityQuestion = text(body.securityQuestion);
    const securityAnswer   = text(body.securityAnswer).toLowerCase();
    const password         = typeof body.password === "string" ? body.password : "";

    if (!email || !password || !name || !securityQuestion || !securityAnswer) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 8 ký tự." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email đã được sử dụng." }, { status: 409 });
    }

    // Username = slug phần trước @ của email, thêm hậu tố số nếu trùng
    const base  = usernameBase(email);
    const taken = await prisma.user.findMany({
      where:  { username: { startsWith: base } },
      select: { username: true },
    });
    const username = uniqueUsername(base, taken.flatMap((u) => u.username ?? []));

    const [passwordHash, securityAnswerHash] = await Promise.all([
      bcrypt.hash(password, 12),
      // Chuẩn hoá câu trả lời: lowercase + trim trước khi hash
      bcrypt.hash(securityAnswer, 12),
    ]);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        name,
        securityQuestion,
        securityAnswerHash,
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    // Hai request đăng ký đồng thời cùng email/username — unique constraint chặn lại
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Email đã được sử dụng. Vui lòng thử lại." }, { status: 409 });
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
