import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getMe, updateUserProfile } from "@/lib/queries/user";
import { parseOptionalUrl, readJson } from "@/lib/validation";

// GET /api/users/me → { id, name, email, username, bio, avatarUrl, role }
export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const user = await getMe(sessionUser.id);
  if (!user) {
    return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH /api/users/me — chỉ ghi các key có mặt trong body (name, bio, avatarUrl)
export async function PATCH(req: Request) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const body = await readJson(req);
  const data: { name?: string; bio?: string | null; avatarUrl?: string | null } = {};

  if ("name" in body) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "Tên không được để trống." }, { status: 400 });
    }
    data.name = body.name.trim();
  }

  if ("bio" in body) {
    if (body.bio !== null && typeof body.bio !== "string") {
      return NextResponse.json({ error: "Bio không hợp lệ." }, { status: 400 });
    }
    data.bio = body.bio?.trim() || null;
  }

  if ("avatarUrl" in body) {
    const avatarUrl = parseOptionalUrl(body.avatarUrl);
    if (avatarUrl === undefined) {
      return NextResponse.json({ error: "Ảnh đại diện không hợp lệ." }, { status: 400 });
    }
    data.avatarUrl = avatarUrl;
  }

  try {
    return NextResponse.json(await updateUserProfile(sessionUser.id, data));
  } catch {
    // Tài khoản đã bị xoá trong khi session còn hiệu lực
    return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
  }
}
