/**
 * app/api/upload/route.ts
 * Upload ảnh lên Cloudinary. Auth required.
 * POST FormData { file: File, folder?: string }
 * → { url: string, publicId: string }
 */
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { cloudinary } from "@/lib/cloudinary";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// First entry is the default. Keep in sync with the `folder` props passed to <ImageUpload>.
const ALLOWED_FOLDERS = ["projecthub/general", "projecthub/avatars", "projecthub/covers", "projecthub/portfolio"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Không tìm thấy file." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Chỉ hỗ trợ JPEG, PNG, WebP hoặc GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Ảnh quá lớn. Giới hạn 5 MB." },
      { status: 400 }
    );
  }

  // Only folders the UI uses — a client-chosen path could otherwise write anywhere in the Cloudinary account
  const requested = formData.get("folder");
  const folder = typeof requested === "string" && ALLOWED_FOLDERS.includes(requested) ? requested : ALLOWED_FOLDERS[0];
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise<NextResponse>((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          resolve(
            NextResponse.json(
              { error: "Upload thất bại. Vui lòng thử lại." },
              { status: 500 }
            )
          );
        } else {
          resolve(
            NextResponse.json({ url: result.secure_url, publicId: result.public_id })
          );
        }
      }
    );
    stream.end(buffer);
  });
}
