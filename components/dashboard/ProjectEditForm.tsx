"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

interface Props {
  slug: string;
  project: { title: string; description: string; outputGoal: string; coverImageUrl: string | null };
}

const FIELD = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

/** Mentor/admin: edit the project's title, description, output goal and cover in place. */
export default function ProjectEditForm({ slug, project }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [outputGoal, setOutputGoal] = useState(project.outputGoal);
  const [coverImageUrl, setCoverImageUrl] = useState(project.coverImageUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function cancel() {
    setTitle(project.title);
    setDescription(project.description);
    setOutputGoal(project.outputGoal);
    setCoverImageUrl(project.coverImageUrl ?? "");
    setError("");
    setOpen(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !outputGoal.trim()) {
      setError("Tên dự án, mô tả và mục tiêu đầu ra không được để trống.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          outputGoal: outputGoal.trim(),
          // Only sent when it changed; "" clears the cover back to the category default.
          ...(coverImageUrl !== (project.coverImageUrl ?? "") && { coverImageUrl }),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Không thể lưu thay đổi.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-800">Thông tin dự án</h2>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 text-sm font-medium text-indigo-600 border border-indigo-200 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Chỉnh sửa
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-slate-800">Chỉnh sửa thông tin dự án</h2>

      <div>
        <label htmlFor="project-title" className={LABEL}>Tên dự án *</label>
        <input id="project-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={FIELD} />
      </div>
      <div>
        <label htmlFor="project-description" className={LABEL}>Mô tả *</label>
        <textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`${FIELD} resize-none`} />
      </div>
      <div>
        <label htmlFor="project-output-goal" className={LABEL}>Mục tiêu đầu ra *</label>
        <textarea id="project-output-goal" value={outputGoal} onChange={(e) => setOutputGoal(e.target.value)} rows={2} className={`${FIELD} resize-none`} />
      </div>
      <ImageUpload
        label="Ảnh bìa"
        value={coverImageUrl}
        onChange={setCoverImageUrl}
        folder="projecthub/covers"
        aspectRatio="wide"
        disabled={busy}
      />

      {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={cancel} disabled={busy}
          className="text-sm text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100 disabled:opacity-50">
          Huỷ
        </button>
        <button type="submit" disabled={busy}
          className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {busy ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
