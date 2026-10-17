import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { upsertUserSkill } from "@/lib/queries/user";
import { readJson } from "@/lib/validation";

// POST /api/users/me/skills — add or update a skill. Body: { skillId, level 1-5 }
export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const { skillId, level } = await readJson(req);
    if (typeof skillId !== "string" || !skillId || typeof level !== "number" || !Number.isInteger(level) || level < 1 || level > 5) {
      return NextResponse.json({ error: "skillId và level (1-5) là bắt buộc." }, { status: 400 });
    }

    const result = await upsertUserSkill(authUser.id, skillId, level);
    if (!result) {
      return NextResponse.json({ error: "Kỹ năng không tồn tại." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
