import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { removeUserSkill } from "@/lib/queries/user";

type Params = { params: Promise<{ skillId: string }> };

// DELETE /api/users/me/skills/[skillId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }
    const { skillId } = await params;

    await removeUserSkill(authUser.id, skillId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
