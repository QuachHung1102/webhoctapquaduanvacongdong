import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UserRole } from "@/app/generated/prisma/client";
import { isOneOf, readJson } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/[id] — update role or isVerified
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
    }

    const { id } = await params;
    const { role, isVerified } = await readJson(req);

    if (role !== undefined && !isOneOf(UserRole, role)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
    }
    if (isVerified !== undefined && typeof isVerified !== "boolean") {
      return NextResponse.json({ error: "isVerified không hợp lệ." }, { status: 400 });
    }
    if (role === undefined && isVerified === undefined) {
      return NextResponse.json({ error: "Không có dữ liệu cập nhật." }, { status: 400 });
    }
    // Admin tự hạ quyền mình có thể làm hệ thống không còn admin nào
    if (role !== undefined && id === session.user.id) {
      return NextResponse.json({ error: "Bạn không thể tự đổi vai trò của chính mình." }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const updated = await prisma.user.update({ where: { id }, data: { role, isVerified } });
    return NextResponse.json({ id: updated.id, role: updated.role, isVerified: updated.isVerified });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
