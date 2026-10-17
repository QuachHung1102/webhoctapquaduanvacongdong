/**
 * app/api/projects/[slug]/output/route.ts
 * POST — thành viên hoặc mentor nộp link output (demo URL, repo URL, etc.)
 * Body: { outputUrl: string }
 */
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseOptionalUrl, readJson } from "@/lib/validation";

type Params = { params: Promise<{ slug: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const { slug } = await params;
    const body = await readJson(req);

    // Link này được render thành <a href> — chỉ nhận http(s) hoặc đường dẫn nội bộ
    const outputUrl = parseOptionalUrl(body.outputUrl);
    if (outputUrl === null) {
      return NextResponse.json({ error: "Thiếu outputUrl." }, { status: 400 });
    }
    if (outputUrl === undefined) {
      return NextResponse.json({ error: "URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://)." }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { slug },
      select: {
        id:       true,
        mentorId: true,
        status:   true,
        members:  { where: { userId: session.user.id }, select: { id: true } },
      },
    });
    if (!project) return NextResponse.json({ error: "Không tìm thấy dự án." }, { status: 404 });

    const isMentor  = project.mentorId === session.user.id;
    const isMember  = project.members.length > 0;
    const isAdmin   = session.user.role === "ADMIN";

    if (!isMentor && !isMember && !isAdmin) {
      return NextResponse.json({ error: "Bạn không phải thành viên dự án." }, { status: 403 });
    }

    if (!["REVIEWING", "COMPLETED"].includes(project.status) && !isMentor && !isAdmin) {
      return NextResponse.json({ error: "Chỉ có thể nộp output khi dự án đang trong giai đoạn REVIEWING hoặc đã COMPLETED." }, { status: 400 });
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data:  { outputUrl },
      select: { outputUrl: true },
    });

    return NextResponse.json({ ok: true, outputUrl: updated.outputUrl });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
