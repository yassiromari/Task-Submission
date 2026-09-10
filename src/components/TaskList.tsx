import { useMemo, useState, type FormEvent } from "react";
import {
  STUDENT_COLORS,
  type Priority,
  type StudentName,
  type TaskRequest,
  type TaskStatus,
  type TaskUpdateDraft,
} from "../types";

interface TaskListProps {
  tasks: TaskRequest[];
  onUpdateTask: (task: TaskUpdateDraft) => Promise<boolean>;
  getAssigneeOptions: (deadline: string) => StudentName[];
}

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];
const STATUSES: TaskStatus[] = ["New", "In Progress", "Blocked", "Done"];

function toDraft(task: TaskRequest): TaskUpdateDraft {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    deadline: task.deadline,
    assignedStudent: task.assignedStudent,
    clarificationMeetingNeeded: task.clarificationMeetingNeeded,
    notesOrLinks: task.notesOrLinks,
    requestedBy: task.requestedBy,
    status: task.status,
  };
}

export function TaskList({ tasks, onUpdateTask, getAssigneeOptions }: TaskListProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TaskUpdateDraft | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (tasks.length === 0) {
    return (
      <div className="task-list empty">
        <p>No task requests submitted yet.</p>
      </div>
    );
  }

  const assigneeOptions = useMemo(() => {
    if (!draft) return [];
    const options = getAssigneeOptions(draft.deadline);

    // Keep current assignee selectable even if date availability changed mid-edit.
    if (!options.includes(draft.assignedStudent)) {
      return [draft.assignedStudent, ...options];
    }

    return options;
  }, [draft, getAssigneeOptions]);

  const startEditing = (task: TaskRequest) => {
    setEditingTaskId(task.id);
    setDraft(toDraft(task));
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setDraft(null);
    setIsSaving(false);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;

    setIsSaving(true);
    const ok = await onUpdateTask({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      notesOrLinks: draft.notesOrLinks?.trim() || undefined,
      requestedBy: draft.requestedBy.trim(),
    });

    setIsSaving(false);
    if (ok) {
      cancelEditing();
    }
  };

  return (
    <div className="task-list">
      <h2>Submitted task requests</h2>
      <ul>
        {tasks.map((task) => {
          const isEditing = editingTaskId === task.id && draft?.id === task.id;

          if (isEditing && draft) {
            return (
              <li key={task.id} className="task-item task-item-editing">
                <div
                  className="task-accent"
                  style={{ background: STUDENT_COLORS[draft.assignedStudent] }}
                />
                <form className="task-body task-edit-form" onSubmit={handleSave}>
                  <div className="task-header">
                    <strong>Editing task</strong>
                  </div>

                  <label className="form-field">
                    <span>Title</span>
                    <input
                      type="text"
                      required
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev ? { ...prev, title: event.target.value } : prev,
                        )
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span>Description</span>
                    <textarea
                      required
                      rows={3}
                      value={draft.description}
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev ? { ...prev, description: event.target.value } : prev,
                        )
                      }
                    />
                  </label>

                  <div className="form-row">
                    <label className="form-field">
                      <span>Priority</span>
                      <select
                        value={draft.priority}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  priority: event.target.value as Priority,
                                }
                              : prev,
                          )
                        }
                      >
                        {PRIORITIES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="form-field">
                      <span>Status</span>
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  status: event.target.value as TaskStatus,
                                }
                              : prev,
                          )
                        }
                      >
                        {STATUSES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="form-row">
                    <label className="form-field">
                      <span>Deadline</span>
                      <input
                        type="date"
                        required
                        value={draft.deadline}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev ? { ...prev, deadline: event.target.value } : prev,
                          )
                        }
                      />
                    </label>

                    <label className="form-field">
                      <span>Assigned student</span>
                      <select
                        value={draft.assignedStudent}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  assignedStudent: event.target.value as StudentName,
                                }
                              : prev,
                          )
                        }
                      >
                        {assigneeOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="form-field checkbox-field">
                    <input
                      type="checkbox"
                      checked={draft.clarificationMeetingNeeded}
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                clarificationMeetingNeeded: event.target.checked,
                              }
                            : prev,
                        )
                      }
                    />
                    <span>Clarification meeting needed?</span>
                  </label>

                  <label className="form-field">
                    <span>Relevant notes or links</span>
                    <textarea
                      rows={2}
                      value={draft.notesOrLinks ?? ""}
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev ? { ...prev, notesOrLinks: event.target.value } : prev,
                        )
                      }
                    />
                  </label>

                  <label className="form-field">
                    <span>Requested by</span>
                    <input
                      type="text"
                      required
                      value={draft.requestedBy}
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev ? { ...prev, requestedBy: event.target.value } : prev,
                        )
                      }
                    />
                  </label>

                  <div className="task-actions">
                    <button type="submit" className="submit-btn" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      className="nav-btn nav-btn-secondary"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            );
          }

          return (
            <li key={task.id} className="task-item">
              <div
                className="task-accent"
                style={{ background: STUDENT_COLORS[task.assignedStudent] }}
              />
              <div className="task-body">
                <div className="task-header">
                  <strong>{task.title}</strong>
                  <span className={`badge badge-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                  <span className="badge badge-status">{task.status}</span>
                </div>
                <p className="task-desc">{task.description}</p>
                <div className="task-meta">
                  <span>Assigned: {task.assignedStudent}</span>
                  <span>Deadline: {task.deadline}</span>
                  <span>Requested by: {task.requestedBy}</span>
                  {task.clarificationMeetingNeeded && <span>Meeting needed</span>}
                </div>
                {task.notesOrLinks && <p className="task-notes">{task.notesOrLinks}</p>}
                <div className="task-actions">
                  <button
                    type="button"
                    className="nav-btn nav-btn-secondary"
                    onClick={() => startEditing(task)}
                  >
                    Edit task
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
