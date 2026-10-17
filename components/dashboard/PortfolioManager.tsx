"use client";

import { useState, useTransition } from "react";
import { CATEGORY_LABELS } from "@/constants/app";
import ImageUpload from "@/components/ui/ImageUpload";
import Icon from "@/components/ui/Icon";

interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
}

interface PortfolioItem {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  demoUrl: string;
  repoUrl: string;
  coverUrl: string;
  isPublic: boolean;
  createdAt: string;
  project: Project;
}

interface Props {
  initialItems: PortfolioItem[];
  availableProjects: Project[];
  portfolioProjectIds: string[];
}

function ItemForm({
  projectId,
  initial,
  onSave,
  onCancel,
}: {
  projectId: string;
  initial?: Partial<PortfolioItem>;
  onSave: (data: Omit<PortfolioItem, "id" | "createdAt" | "project">) => void;
  onCancel: () => void;
}) {
  const [title, setTitle]     = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [demoUrl, setDemoUrl] = useState(initial?.demoUrl ?? "");
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverUrl ?? "");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Tiêu đề *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
          placeholder="VD: Web app theo dõi sức khỏe"
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Mô tả ngắn *</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} maxLength={500}
          placeholder="Bạn đã làm gì trong dự án? Kết quả đạt được là gì?"
          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <p className="text-xs text-slate-400 text-right mt-0.5">{summary.length}/500</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Link Demo</label>
          <input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} type="url"
            placeholder="https://..."
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Source / Figma</label>
          <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} type="url"
            placeholder="https://github.com/..."
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
      </div>
      <ImageUpload
        label="Ảnh bìa portfolio"
        value={coverUrl}
        onChange={setCoverUrl}
        folder="projecthub/portfolio"
        aspectRatio="wide"
      />
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
          className="rounded accent-indigo-600" />
        Hiển thị công khai trên trang hồ sơ
      </label>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel}
          className="text-sm text-slate-500 border border-slate-200 px-4 py-1.5 rounded-xl hover:bg-slate-50">
          Huỷ
        </button>
        <button type="button"
          onClick={() => onSave({ projectId, title, summary, demoUrl, repoUrl, coverUrl, isPublic })}
          className="text-sm font-semibold bg-indigo-600 text-white px-4 py-1.5 rounded-xl hover:bg-indigo-700">
          Lưu
        </button>
      </div>
    </div>
  );
}

export default function PortfolioManager({ initialItems, availableProjects, portfolioProjectIds }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [editing, setEditing] = useState<string | null>(null); // item id or "new-{projectId}"
  const [addingProjectId, setAddingProjectId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const projectsWithoutPortfolio = availableProjects.filter(
    (p) => !portfolioProjectIds.includes(p.id) && !items.some((i) => i.projectId === p.id)
  );

  async function handleCreate(data: Omit<PortfolioItem, "id" | "createdAt" | "project">) {
    setError("");
    if (!data.title.trim() || !data.summary.trim()) { setError("Tiêu đề và mô tả là bắt buộc."); return; }
    startTransition(async () => {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Lỗi"); return; }
      setItems((prev) => [json, ...prev]);
      setAddingProjectId("");
      setEditing(null);
    });
  }

  async function handleUpdate(id: string, data: Partial<PortfolioItem>) {
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Lỗi"); return; }
      setItems((prev) => prev.map((i) => (i.id === id ? json : i)));
      setEditing(null);
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa portfolio item này?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
      if (!res.ok) { setError("Không thể xóa."); return; }
      setItems((prev) => prev.filter((i) => i.id !== id));
    });
  }

  async function togglePublic(item: PortfolioItem) {
    await handleUpdate(item.id, { isPublic: !item.isPublic });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Add new from available projects */}
      {projectsWithoutPortfolio.length > 0 && !addingProjectId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-indigo-800 mb-2">Thêm dự án vào portfolio:</p>
          <div className="flex flex-wrap gap-2">
            {projectsWithoutPortfolio.map((p) => (
              <button key={p.id} type="button"
                onClick={() => { setAddingProjectId(p.id); setEditing(`new-${p.id}`); }}
                className="text-xs bg-white border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                + {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New item form */}
      {addingProjectId && editing === `new-${addingProjectId}` && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-800 mb-4">
            Thêm portfolio: <span className="text-indigo-600">{projectsWithoutPortfolio.find(p => p.id === addingProjectId)?.title}</span>
          </p>
          <ItemForm
            projectId={addingProjectId}
            onSave={handleCreate}
            onCancel={() => { setAddingProjectId(""); setEditing(null); }}
          />
        </div>
      )}

      {/* Existing items */}
      {items.length === 0 && !addingProjectId && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="folder" className="w-6 h-6" /></span>
          <p className="text-slate-600 font-medium">Portfolio còn trống</p>
          <p className="text-slate-400 text-sm mt-1">
            {availableProjects.length === 0
              ? "Hãy tham gia một dự án để bắt đầu xây dựng portfolio."
              : "Chọn dự án bên trên để bắt đầu."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5">
            {editing === item.id ? (
              <>
                <p className="text-sm font-semibold text-slate-800 mb-4">Chỉnh sửa portfolio</p>
                <ItemForm
                  projectId={item.projectId}
                  initial={item}
                  onSave={(data) => handleUpdate(item.id, data)}
                  onCancel={() => setEditing(null)}
                />
              </>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    {!item.isPublic && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Riêng tư</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {CATEGORY_LABELS[item.project?.category ?? ""] ?? item.project?.category} · {item.project?.title}
                  </p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.summary}</p>
                  {(item.demoUrl || item.repoUrl) && (
                    <div className="flex gap-3 mt-2">
                      {item.demoUrl && (
                        <a href={item.demoUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:underline">Demo</a>
                      )}
                      {item.repoUrl && (
                        <a href={item.repoUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-slate-500 hover:underline">Mã nguồn</a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => togglePublic(item)} disabled={isPending}
                    title={item.isPublic ? "Ẩn khỏi profile" : "Hiện trên profile"}
                    aria-label={item.isPublic ? "Ẩn khỏi profile" : "Hiện trên profile"}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                    <Icon name={item.isPublic ? "eye" : "eyeOff"} className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(item.id)} aria-label="Sửa mục portfolio" title="Sửa"
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                    <Icon name="pencil" className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} disabled={isPending} aria-label="Xoá mục portfolio" title="Xoá"
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
