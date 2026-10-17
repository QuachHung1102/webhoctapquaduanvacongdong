"use client";

import { useEffect, useRef, useState } from "react";
import type { TaskStatus } from "@/app/generated/prisma/client";
import Avatar from "@/components/ui/Avatar";
import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS } from "@/constants/app";

interface TaskUser {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

interface KanbanTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  position: number;
  assignee: TaskUser | null;
  dueDate: string | null; // ISO
  createdById: string;
}

interface Column {
  id: TaskStatus;
  label: string;
  color: string;
  headerColor: string;
}

const COLUMNS: Column[] = [
  { id: "TODO",        label: "Cần làm",       color: "bg-slate-50 border-slate-200",  headerColor: "bg-slate-100 text-slate-700" },
  { id: "IN_PROGRESS", label: "Đang làm",      color: "bg-indigo-50 border-indigo-200",    headerColor: "bg-indigo-100 text-indigo-700" },
  { id: "IN_REVIEW",   label: "Đang review",  color: "bg-purple-50 border-purple-200", headerColor: "bg-purple-100 text-purple-700" },
  { id: "DONE",        label: "Hoàn thành",    color: "bg-green-50 border-green-200",  headerColor: "bg-green-100 text-green-700" },
];

interface Props {
  initialTasks: KanbanTask[];
  projectId: string;
  sprintId: string;
  members: TaskUser[];
  currentUserId: string;
  canManage: boolean; // mentor or admin
}

// Due dates are stored as UTC midnight, so the ISO date part is the day the user picked.
const dayOf = (iso: string) => iso.slice(0, 10);
const formatDay = (iso: string) => dayOf(iso).split("-").reverse().join("/");
function isOverdue(task: KanbanTask) {
  if (!task.dueDate || task.status === "DONE") return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return dayOf(task.dueDate) < today;
}

async function readError(res: Response, fallback: string) {
  const json = await res.json().catch(() => ({}));
  return (json as { error?: string }).error ?? fallback;
}

const FIELD = "w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300";
const LABEL = "block text-xs font-medium text-slate-600 mb-1";

// -- Create / edit dialog ----------------------------------------------------

function TaskDialog({
  task,
  projectId,
  sprintId,
  members,
  canDelete,
  onSaved,
  onDeleted,
  onClose,
}: {
  task: KanbanTask | null; // null = create
  projectId: string;
  sprintId: string;
  members: TaskUser[];
  canDelete: boolean;
  onSaved: (task: KanbanTask) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle]             = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus]           = useState<TaskStatus>(task?.status ?? "TODO");
  const [priority, setPriority]       = useState(task?.priority ?? "MEDIUM");
  const [assigneeId, setAssigneeId]   = useState(task?.assignee?.id ?? "");
  const [dueDate, setDueDate]         = useState(task?.dueDate ? dayOf(task.dueDate) : "");
  const [busy, setBusy]               = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Tiêu đề task là bắt buộc."); return; }
    setError("");
    setBusy(true);
    try {
      const res = task
        ? await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              description: description.trim(),
              status,
              priority,
              assigneeId: assigneeId || null,
              dueDate: dueDate || null,
            }),
          })
        : await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              sprintId,
              title: title.trim(),
              description: description.trim() || undefined,
              priority,
              assigneeId: assigneeId || undefined,
              dueDate: dueDate || undefined,
            }),
          });
      if (!res.ok) { setError(await readError(res, "Không thể lưu task.")); return; }
      const saved = await res.json();
      // Built from the form, not the response: the PATCH response carries no assignee relation.
      onSaved({
        id: task?.id ?? saved.id,
        createdById: task?.createdById ?? saved.createdById,
        position: task?.position ?? saved.position ?? 0,
        title: title.trim(),
        description: description.trim() || null,
        status: task ? status : "TODO",
        priority,
        assignee: members.find((m) => m.id === assigneeId) ?? null,
        dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : null,
      });
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!task) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) { setError(await readError(res, "Không thể xoá task.")); return; }
      onDeleted(task.id);
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 sm:p-4"
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={task ? "Chỉnh sửa task" : "Thêm task"}
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">{task ? "Chỉnh sửa task" : "Thêm task"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label htmlFor="task-title" className={LABEL}>Tiêu đề *</label>
          <input id="task-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={FIELD} />
        </div>

        <div>
          <label htmlFor="task-description" className={LABEL}>Mô tả</label>
          <textarea id="task-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} className={`${FIELD} resize-none`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {task && (
            <div>
              <label htmlFor="task-status" className={LABEL}>Trạng thái</label>
              <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={FIELD}>
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="task-priority" className={LABEL}>Độ ưu tiên</label>
            <select id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className={FIELD}>
              {Object.keys(TASK_PRIORITY_LABELS).map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="task-assignee" className={LABEL}>Người thực hiện</label>
            <select id="task-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={FIELD}>
              <option value="">Chưa giao</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="task-due" className={LABEL}>Hạn chót</label>
            <input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={FIELD} />
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-2">
            {task && canDelete && !confirmDelete && (
              <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy}
                className="text-sm text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50">
                Xoá task
              </button>
            )}
            {task && canDelete && confirmDelete && (
              <>
                <button type="button" onClick={remove} disabled={busy}
                  className="text-sm font-medium bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
                  Xác nhận xoá
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={busy}
                  className="text-sm text-slate-500 px-3 py-2 rounded-lg hover:bg-slate-100">
                  Huỷ
                </button>
              </>
            )}
          </div>
          <button type="submit" disabled={busy}
            className="ml-auto text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {busy ? "Đang lưu..." : task ? "Lưu thay đổi" : "Tạo task"}
          </button>
        </div>
      </form>
    </div>
  );
}

// -- Board -------------------------------------------------------------------

export default function KanbanBoard({ initialTasks, projectId, sprintId, members, currentUserId, canManage }: Props) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [error, setError] = useState("");
  // "new" = create dialog, a task id = edit dialog
  const [dialog, setDialog] = useState<string | null>(null);
  const dragTaskRef = useRef<KanbanTask | null>(null);

  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks.filter((t) => t.status === col.id).sort((a, b) => a.position - b.position),
  }));
  const editing = dialog && dialog !== "new" ? tasks.find((t) => t.id === dialog) ?? null : null;

  function handleDragStart(task: KanbanTask) {
    setDragging(task.id);
    dragTaskRef.current = task;
  }

  function handleDragOver(e: React.DragEvent, colId: TaskStatus) {
    e.preventDefault();
    setDragOver(colId);
  }

  async function handleDrop(colId: TaskStatus) {
    const task = dragTaskRef.current;
    setDragging(null);
    setDragOver(null);
    if (!task || task.status === colId) return;

    // Optimistic update
    const newPosition = tasks.filter((t) => t.status === colId).length;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: colId, position: newPosition } : t))
    );
    setError("");

    const revert = (message: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status, position: task.position } : t))
      );
      setError(message);
    };

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: colId, position: newPosition }),
      });
      if (!res.ok) revert(await readError(res, "Không thể chuyển task."));
    } catch {
      revert("Không thể kết nối tới máy chủ.");
    }
  }

  function handleSaved(saved: KanbanTask) {
    setTasks((prev) =>
      prev.some((t) => t.id === saved.id) ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]
    );
    setDialog(null);
  }

  return (
    <>
      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={() => handleDrop(col.id)}
            className={`flex-1 min-w-64 rounded-xl border ${col.color} ${dragOver === col.id ? "ring-2 ring-indigo-400" : ""} transition-all`}
          >
            {/* Column header */}
            <div className={`${col.headerColor} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
              <span className="text-sm font-semibold">{col.label}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/60">
                {col.tasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-3 space-y-2 min-h-32">
              {col.id === "TODO" && (
                <button
                  type="button"
                  onClick={() => setDialog("new")}
                  className="w-full min-h-11 text-sm font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  + Thêm task
                </button>
              )}

              {col.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  role="button"
                  tabIndex={0}
                  onClick={() => setDialog(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDialog(task.id); }
                  }}
                  onDragStart={() => handleDragStart(task)}
                  onDragEnd={() => setDragging(null)}
                  className={`bg-white border border-slate-100 rounded-xl p-3 shadow-sm cursor-pointer select-none hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-all ${
                    dragging === task.id ? "opacity-40" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-2">
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-slate-400 line-clamp-1 mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TASK_PRIORITY_COLORS[task.priority] ?? ""}`}>
                      {TASK_PRIORITY_LABELS[task.priority] ?? task.priority}
                    </span>
                    {task.dueDate && (
                      // Overdue depends on the viewer's clock, which can differ from the server's.
                      <span suppressHydrationWarning className={`text-xs ${isOverdue(task) ? "text-red-600 font-semibold" : "text-slate-400"}`}>
                        Hạn {formatDay(task.dueDate)}
                      </span>
                    )}
                    {task.assignee && (
                      <span className="ml-auto" title={task.assignee.name ?? ""}>
                        <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="xs" />
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {col.tasks.length === 0 && col.id !== "TODO" && (
                <div className="text-center py-6 text-xs text-slate-400">
                  Chưa có task nào ở cột này.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {dialog && (dialog === "new" || editing) && (
        <TaskDialog
          key={dialog}
          task={editing}
          projectId={projectId}
          sprintId={sprintId}
          members={members}
          canDelete={!!editing && (canManage || editing.createdById === currentUserId)}
          onSaved={handleSaved}
          onDeleted={(id) => { setTasks((prev) => prev.filter((t) => t.id !== id)); setDialog(null); }}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
