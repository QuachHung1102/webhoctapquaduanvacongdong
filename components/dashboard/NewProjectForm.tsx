"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface Props {
  allSkills: Skill[];
}

const CATEGORIES = [
  { value: "APP",     label: "Lập trình App" },
  { value: "DESIGN",  label: "Thiết kế" },
  { value: "VIDEO",   label: "Video Marketing" },
  { value: "PRODUCT", label: "Sản phẩm Số" },
];

const DIFFICULTIES = [
  { value: "BEGINNER",     label: "Cơ bản" },
  { value: "INTERMEDIATE", label: "Trung cấp" },
  { value: "ADVANCED",     label: "Nâng cao" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewProjectForm({ allSkills }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("APP");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [timeline, setTimeline] = useState(4);
  const [maxMembers, setMaxMembers] = useState(4);
  const [outputGoal, setOutputGoal] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  }

  function toggleSkill(skill: Skill) {
    setSelectedSkills((prev) =>
      prev.some((s) => s.id === skill.id)
        ? prev.filter((s) => s.id !== skill.id)
        : [...prev, skill]
    );
  }

  const filteredSkills = allSkills.filter(
    (s) =>
      !selectedSkills.some((ss) => ss.id === s.id) &&
      s.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  // Group available skills by category
  const groupedSkills = filteredSkills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category ?? "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim() || !slug.trim()) {
      setError("Tiêu đề, mô tả và slug là bắt buộc.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:         title.trim(),
            slug:          slug.trim(),
            description:   description.trim(),
            category,
            difficulty,
            timeline,
            maxMembers,
            outputGoal:    outputGoal.trim() || undefined,
            coverImageUrl: coverImageUrl || undefined,
            startDate:     startDate || undefined,
            skillNames:    selectedSkills.map((s) => s.name),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Có lỗi xảy ra.");
        } else {
          router.push(`/dashboard/projects/${data.slug}`);
          router.refresh();
        }
      } catch {
        setError("Không thể kết nối tới máy chủ.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section 1: Thông tin cơ bản */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 text-base">1. Thông tin cơ bản</h2>

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">
            Tên dự án <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="VD: App theo dõi sức khỏe cá nhân"
            maxLength={120}
            required
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">
            Slug (URL) <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-400 shrink-0">/projects/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
              placeholder="app-theo-doi-suc-khoe"
              required
              className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Tự động tạo từ tên dự án. Chỉ dùng chữ thường, số và gạch ngang.</p>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">
            Mô tả dự án <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Dự án này xây dựng gì? Vấn đề cần giải quyết là gì?"
            required
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <p className="text-xs text-slate-400 text-right mt-0.5">{description.length}/1000</p>
        </div>

        {/* Output goal */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">
            Mục tiêu đầu ra
          </label>
          <textarea
            value={outputGoal}
            onChange={(e) => setOutputGoal(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Sản phẩm cuối dự án là gì? VD: App Flutter hoàn chỉnh, deploy lên store..."
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Section 2: Ảnh bìa */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 text-base">2. Ảnh bìa dự án</h2>
        <ImageUpload
          value={coverImageUrl}
          onChange={setCoverImageUrl}
          folder="projecthub/covers"
          aspectRatio="cover"
          disabled={isPending}
        />
        <p className="text-xs text-slate-400">Ảnh bìa xuất hiện trên trang danh sách dự án. Tỉ lệ 16:9 cho đẹp nhất.</p>
      </div>

      {/* Section 3: Phân loại */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 text-base">3. Phân loại &amp; Độ khó</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Danh mục</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Độ khó</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 text-xs font-medium py-2.5 rounded-xl border transition-colors ${
                    difficulty === d.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Timeline */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Thời gian (tuần)
            </label>
            <input
              type="number"
              value={timeline}
              onChange={(e) => setTimeline(Math.max(1, Math.min(52, Number(e.target.value))))}
              min={1} max={52}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Max members */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Số thành viên tối đa
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Math.max(1, Math.min(20, Number(e.target.value))))}
              min={1} max={20}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Start date */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              Ngày bắt đầu (dự kiến)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Skills */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="font-semibold text-slate-800 text-base">4. Kỹ năng yêu cầu</h2>

        {/* Selected skills */}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill)}
                className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
              >
                {skill.name}
                <span className="text-xs">×</span>
              </button>
            ))}
          </div>
        )}

        {/* Skill search */}
        <input
          type="text"
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          placeholder="Tìm kỹ năng..."
          className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        {/* Skill picker */}
        <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
          {Object.entries(groupedSkills).map(([cat, skills]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{cat}</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                  >
                    + {skill.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(groupedSkills).length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              {skillSearch ? "Không tìm thấy kỹ năng phù hợp." : "Tất cả kỹ năng đã được chọn."}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-semibold bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Đang tạo..." : "Tạo dự án"}
        </button>
      </div>
    </form>
  );
}
