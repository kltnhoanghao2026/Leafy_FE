import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';
import type { EventTaskRequest } from '../../shared/types';

interface EventTaskEditorProps {
  tasks: EventTaskRequest[];
  onChange: (tasks: EventTaskRequest[]) => void;
}

export function EventTaskEditor({ tasks, onChange }: EventTaskEditorProps) {
  const addTask = () =>
    onChange([...tasks, { title: '', completed: false }]);

  const removeTask = (idx: number) =>
    onChange(tasks.filter((_, i) => i !== idx));

  const toggleTask = (idx: number) =>
    onChange(
      tasks.map((t, i) =>
        i === idx ? { ...t, completed: !t.completed } : t,
      ),
    );

  const updateTask = (idx: number, patch: Partial<EventTaskRequest>) =>
    onChange(
      tasks.map((t, i) =>
        i === idx ? { ...t, ...patch } : t,
      ),
    );

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">
          Công việc ({tasks.length})
        </span>
        <button
          type="button"
          onClick={addTask}
          className="inline-flex items-center gap-1 rounded-xl border border-[#245A34] px-3 py-1.5 text-xs font-bold text-[#245A34] hover:bg-[#245A34]/5"
        >
          <Plus className="h-3 w-3" />
          Thêm
        </button>
      </div>

      {tasks.length === 0 && (
        <p className="mt-2 text-xs text-slate-400">
          Chưa có công việc nào. Nhấn &quot;Thêm&quot; để bắt đầu.
        </p>
      )}

      <div className="mt-2 space-y-2">
        {tasks.map((task, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3"
          >
            <button
              type="button"
              title={task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
              onClick={() => toggleTask(idx)}
              className="mt-1 shrink-0 transition-colors hover:opacity-70"
            >
              {task.completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
            </button>
            <div className="flex-1 space-y-2">
              <input
                value={task.title}
                onChange={e => updateTask(idx, { title: e.target.value })}
                placeholder="Tiêu đề công việc *"
                className={`h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold placeholder:font-normal ${
                  task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                }`}
              />
              <input
                value={task.description ?? ''}
                onChange={e =>
                  updateTask(idx, { description: e.target.value || undefined })
                }
                placeholder="Mô tả (tuỳ chọn)"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 placeholder:text-slate-400"
              />
              <input
                value={task.estimatedCost ?? ''}
                onChange={e =>
                  updateTask(idx, { estimatedCost: e.target.value || undefined })
                }
                placeholder="Chi phí dự kiến (tuỳ chọn)"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={() => removeTask(idx)}
              className="mt-0.5 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
              title="Xóa công việc"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
