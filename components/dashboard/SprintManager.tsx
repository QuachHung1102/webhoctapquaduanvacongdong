"use client";

import { useState, useTransition } from "react";
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from "@/constants/app";
import Icon from "@/components/ui/Icon";

interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  taskCount: number;
}

interface Member {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  assignee?: { id: string; name: string; avatarUrl: string | null } | null;
  dueDate?: string | null;
}

interface Props {
  projectId: string;
  projectSlug: string;
  initialSprints: Sprint[];
  members: Member[];
}

function SprintForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Sprint>;
  onSave: (data: Omit<Sprint, "id" | "taskCount">) => void;
  onCancel: () => void;
}) {
  const [name, setName]           = useState(initial?.name ?? "");
  const [goal, setGoal]           = useState(initial?.goal ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate]     = useState(initial?.endDate ?? "");
  const [isActive, setIsActive]   = useState(initial?.isActive ?? false);

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Tên sprint *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
            placeholder="VD: Sprint 1 — Setup & UI"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Mục tiêu sprint</label>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={200}
            placeholder="Hoàn thiện giao diện và database schema"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Ngày bắt đầu *</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Ngày kết thúc *</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
          className="rounded accent-indigo-600" />
        Đặt làm sprint đang hoạt động
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="text-sm text-slate-500 border border-slate-200 px-4 py-1.5 rounded-xl hover:bg-slate-50">Huỷ</button>
        <button type="button"
          onClick={() => onSave({ name, goal, startDate, endDate, isActive })}
          className="text-sm font-semibold bg-indigo-600 text-white px-4 py-1.5 rounded-xl hover:bg-indigo-700">Lưu</button>
      </div>
    </div>
  );
}

function TaskForm({
  projectId,
  sprintId,
  members,
  onSave,
  onCancel,
}: {
  projectId: string;
  sprintId: string;
  members: Member[];
  onSave: (task: Task) => void;
  onCancel: () => void;
}) {
  const [title, setTitle]           = useState("");
  const [description, setDesc]      = useState("");
  const [priority, setPriority]     = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [isPending, start]          = useTransition();
  const [error, setError]           = useState("");

  function handleSave() {
    if (!title.trim()) { setError("Tiêu đề task là bắt buộc."); return; }
    start(async () => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, sprintId, title, description, priority, assigneeId: assigneeId || undefined, dueDate: dueDate || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lỗi"); return; }
      onSave(data);
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-medium text-slate-700">Thêm task mới</p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
        placeholder="Tiêu đề task *"
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      <textarea value={description} onChange={(e) => setDesc(e.target.value)} rows={2} maxLength={500}
        placeholder="Mô tả chi tiết (tùy chọn)"
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select value={priority} onChange={(e) => setPriority(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300">
          {Object.keys(TASK_PRIORITY_LABELS).map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>)}
        </select>
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300">
          <option value="">Chưa giao</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          placeholder="Hạn chót"
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="text-xs text-slate-500 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50">Huỷ</button>
        <button type="button" onClick={handleSave} disabled={isPending}
          className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50">
          {isPending ? "Đang tạo..." : "Tạo task"}
        </button>
      </div>
    </div>
  );
}

export default function SprintManager({ projectId, projectSlug, initialSprints, members }: Props) {
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [sprintTasks, setSprintTasks] = useState<Record<string, Task[]>>({});
  const [editingSprint, setEditingSprint]   = useState<string | null>(null);
  const [showNewSprint, setShowNewSprint]   = useState(false);
  const [showNewTask, setShowNewTask]       = useState<string | null>(null); // sprintId
  const [loadedSprints, setLoadedSprints]  = useState<Set<string>>(new Set());
  const [isPending, start] = useTransition();
  const [error, setError] = useState("");

  async function loadTasks(sprintId: string) {
    if (loadedSprints.has(sprintId)) return;
    setLoadedSprints((prev) => new Set([...prev, sprintId]));
    const res = await fetch(`/api/tasks?sprintId=${sprintId}`);
    if (res.ok) {
      const data = await res.json();
      setSprintTasks((prev) => ({ ...prev, [sprintId]: data }));
    }
  }

  async function handleCreateSprint(data: Omit<Sprint, "id" | "taskCount">) {
    setError("");
    if (!data.name.trim() || !data.startDate || !data.endDate) {
      setError("Vui lòng điền đầy đủ thông tin sprint."); return;
    }
    start(async () => {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, ...data }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Lỗi"); return; }
      const newSprint = { ...json, startDate: json.startDate.split("T")[0], endDate: json.endDate.split("T")[0], taskCount: 0 };
      if (data.isActive) setSprints((prev) => prev.map((s) => ({ ...s, isActive: false })));
      setSprints((prev) => [...prev, newSprint]);
      setShowNewSprint(false);
    });
  }

  async function handleUpdateSprint(id: string, data: Partial<Sprint>) {
    setError("");
    start(async () => {
      const res = await fetch(`/api/sprints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Lỗi"); return; }
      const updated = { ...json, startDate: json.startDate.split("T")[0], endDate: json.endDate.split("T")[0], taskCount: json._count?.tasks ?? 0 };
      if (data.isActive) setSprints((prev) => prev.map((s) => (s.id === id ? { ...updated } : { ...s, isActive: false })));
      else setSprints((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingSprint(null);
    });
  }

  async function handleDeleteSprint(id: string) {
    if (!confirm("Xoá sprint này? Các task trong sprint sẽ bị tách khỏi sprint.")) return;
    start(async () => {
      const res = await fetch(`/api/sprints/${id}`, { method: "DELETE" });
      if (!res.ok) { setError("Không thể xoá sprint."); return; }
      setSprints((prev) => prev.filter((s) => s.id !== id));
    });
  }

  function handleTaskCreated(sprintId: string, task: Task) {
    setSprintTasks((prev) => ({ ...prev, [sprintId]: [task, ...(prev[sprintId] ?? [])] }));
    setSprints((prev) => prev.map((s) => s.id === sprintId ? { ...s, taskCount: s.taskCount + 1 } : s));
    setShowNewTask(null);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Header action */}
      {!showNewSprint && (
        <button onClick={() => setShowNewSprint(true)}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
          + Tạo sprint mới
        </button>
      )}

      {/* New sprint form */}
      {showNewSprint && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="font-semibold text-slate-800 mb-3 text-sm">Sprint mới</p>
          <SprintForm
            onSave={handleCreateSprint}
            onCancel={() => setShowNewSprint(false)}
          />
        </div>
      )}

      {/* Sprint list */}
      {sprints.length === 0 && !showNewSprint && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="bolt" className="w-6 h-6" /></span>
          <p className="text-slate-600 font-medium">Chưa có sprint nào</p>
          <p className="text-slate-400 text-sm mt-1">Tạo sprint đầu tiên để bắt đầu quản lý công việc.</p>
        </div>
      )}

      {sprints.map((sprint) => (
        <div key={sprint.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Sprint header */}
          <div className="p-5 border-b border-slate-100">
            {editingSprint === sprint.id ? (
              <>
                <p className="font-semibold text-slate-800 mb-3 text-sm">Chỉnh sửa sprint</p>
                <SprintForm
                  initial={sprint}
                  onSave={(data) => handleUpdateSprint(sprint.id, data)}
                  onCancel={() => setEditingSprint(null)}
                />
              </>
            ) : (
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800">{sprint.name}</h3>
                    {sprint.isActive && (
                      <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                        Đang hoạt động
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{sprint.taskCount} tasks</span>
                  </div>
                  {sprint.goal && <p className="text-sm text-slate-500 mt-1">{sprint.goal}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(sprint.startDate).toLocaleDateString("vi-VN")} —{" "}
                    {new Date(sprint.endDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!sprint.isActive && (
                    <button onClick={() => handleUpdateSprint(sprint.id, { isActive: true })} disabled={isPending}
                      className="text-xs text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50">
                      Kích hoạt
                    </button>
                  )}
                  <button onClick={() => { setEditingSprint(sprint.id); loadTasks(sprint.id); }} aria-label="Sửa sprint" title="Sửa"
                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"><Icon name="pencil" className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteSprint(sprint.id)} disabled={isPending} aria-label="Xoá sprint" title="Xoá"
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Icon name="trash" className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>

          {/* Tasks section */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <button onClick={() => loadTasks(sprint.id)}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                {loadedSprints.has(sprint.id) ? "Tasks" : "▶ Xem tasks"}
              </button>
              <button onClick={() => { setShowNewTask(sprint.id); loadTasks(sprint.id); }}
                className="text-xs font-medium text-indigo-600 hover:underline">
                + Thêm task
              </button>
            </div>

            {showNewTask === sprint.id && (
              <TaskForm
                projectId={projectId}
                sprintId={sprint.id}
                members={members}
                onSave={(task) => handleTaskCreated(sprint.id, task)}
                onCancel={() => setShowNewTask(null)}
              />
            )}

            {loadedSprints.has(sprint.id) && (
              <div className="space-y-1.5 mt-1">
                {(sprintTasks[sprint.id] ?? []).length === 0 && (
                  <p className="text-xs text-slate-400 py-2 text-center">Chưa có task nào. Hãy thêm task đầu tiên.</p>
                )}
                {(sprintTasks[sprint.id] ?? []).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md shrink-0 ${TASK_PRIORITY_COLORS[task.priority] ?? ""}`}>
                      {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                    </span>
                    <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{task.title}</span>
                    {task.assignee && (
                      <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">{task.assignee.name}</span>
                    )}
                    {task.dueDate && (
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(task.dueDate).toLocaleDateString("vi-VN")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Link to kanban */}
      {sprints.length > 0 && (
        <a href={`/dashboard/projects/${projectSlug}/kanban`}
          className="block text-center text-sm text-indigo-600 border border-indigo-200 rounded-xl py-2.5 hover:bg-indigo-50 transition-colors">
          Xem Kanban Board →
        </a>
      )}
    </div>
  );
}
