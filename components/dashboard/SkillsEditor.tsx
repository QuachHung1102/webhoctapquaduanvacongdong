"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface SkillOption {
  id: string;
  name: string;
  category: string;
}

interface MySkill {
  id: string;
  name: string;
  level: number;
  category: string;
}

interface Props {
  mySkills: MySkill[];
  allSkills: SkillOption[];
}

const LEVEL_LABELS = ["", "Sơ cấp", "Cơ bản", "Trung cấp", "Khá", "Thành thạo"];
const LEVEL_COLORS = [
  "", "bg-slate-100 text-slate-500", "bg-indigo-50 text-indigo-600",
  "bg-purple-50 text-purple-600", "bg-orange-50 text-orange-600", "bg-green-50 text-green-600",
];

export default function SkillsEditor({ mySkills: initial, allSkills }: Props) {
  const [mySkills, setMySkills] = useState<MySkill[]>(initial);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const mySkillIds = new Set(mySkills.map((s) => s.id));
  const available = allSkills.filter((s) => !mySkillIds.has(s.id));

  // Group my skills by category
  const grouped = mySkills.reduce<Record<string, MySkill[]>>((acc, s) => {
    const cat = s.category ?? "Khác";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  function addSkill() {
    if (!selectedSkillId) return;
    const skill = allSkills.find((s) => s.id === selectedSkillId);
    if (!skill) return;
    setError("");

    const optimistic: MySkill = {
      id: skill.id, name: skill.name, level: selectedLevel, category: skill.category ?? "Khác",
    };
    setMySkills((prev) => [...prev, optimistic]);
    setSelectedSkillId("");
    setSelectedLevel(1);

    startTransition(async () => {
      try {
        const res = await fetch("/api/users/me/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skillId: selectedSkillId, level: selectedLevel }),
        });
        if (!res.ok) {
          const d = await res.json();
          setError(d.error ?? "Lỗi thêm kỹ năng.");
          setMySkills(initial);
        } else {
          router.refresh();
        }
      } catch {
        setError("Lỗi kết nối máy chủ.");
        setMySkills(initial);
      }
    });
  }

  function removeSkill(skillId: string) {
    setError("");
    setMySkills((prev) => prev.filter((s) => s.id !== skillId));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/users/me/skills/${skillId}`, { method: "DELETE" });
        if (!res.ok) {
          setError("Lỗi xóa kỹ năng.");
          setMySkills(initial);
        } else {
          router.refresh();
        }
      } catch {
        setError("Lỗi kết nối máy chủ.");
        setMySkills(initial);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Add skill */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Thêm kỹ năng mới</h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-40">
            <label className="text-xs font-medium text-slate-600 block mb-1">Kỹ năng</label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">-- Chọn kỹ năng --</option>
              {available.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Cấp độ</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(Number(e.target.value))}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {LEVEL_LABELS.slice(1).map((label, idx) => (
                <option key={idx + 1} value={idx + 1}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={addSkill}
            disabled={!selectedSkillId || isPending}
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            + Thêm
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>

      {/* My skills */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Kỹ năng của tôi ({mySkills.length})</h2>
        {mySkills.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có kỹ năng nào. Thêm kỹ năng đầu tiên!</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, skills]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-sm text-slate-800">{skill.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[skill.level] ?? ""}`}>
                        {LEVEL_LABELS[skill.level]}
                      </span>
                      <button
                        onClick={() => removeSkill(skill.id)}
                        disabled={isPending}
                        className="text-slate-300 hover:text-red-400 transition-colors text-xs leading-none"
                        title="Xóa"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
