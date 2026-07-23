import { useState, type FormEvent } from "react";
import type {
  Priority,
  StudentName,
  TaskRequest,
  TaskStatus,
} from "../types";

interface TaskRequestFormProps {
  onSubmit: (task: TaskRequest) => void;
}

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];
const STUDENTS: StudentName[] = ["Yassir", "Mihai"];
const STATUSES: TaskStatus[] = ["New", "In Progress", "Blocked", "Done"];

interface FormState {
  title: string;
  description: string;
  priority: Priority;
  deadline: string;
  assignedStudent: StudentName;
  clarificationMeetingNeeded: boolean;
  notesOrLinks: string;
  requestedBy: string;
  status: TaskStatus;
}

const INITIAL_STATE: FormState = {
  title: "",
  description: "",
  priority: "Medium",
  deadline: "",
  assignedStudent: "Yassir",
  clarificationMeetingNeeded: false,
  notesOrLinks: "",
  requestedBy: "",
  status: "New",
};

export function TaskRequestForm({ onSubmit }: TaskRequestFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const task: TaskRequest = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      deadline: form.deadline,
      assignedStudent: form.assignedStudent,
      clarificationMeetingNeeded: form.clarificationMeetingNeeded,
      notesOrLinks: form.notesOrLinks.trim() || undefined,
      requestedBy: form.requestedBy.trim(),
      status: form.status,
      createdAt: new Date().toISOString(),
    };

    onSubmit(task);
    setForm(INITIAL_STATE);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>New task request</h2>

      <label className="form-field">
        <span>Title</span>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Short task title"
        />
      </label>

      <label className="form-field">
        <span>Task description</span>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="What needs to be done?"
        />
      </label>

      <div className="form-row">
        <label className="form-field">
          <span>Priority</span>
          <select
            value={form.priority}
            onChange={(e) => handleChange("priority", e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Deadline</span>
          <input
            type="date"
            required
            value={form.deadline}
            onChange={(e) => handleChange("deadline", e.target.value)}
          />
        </label>
      </div>

      <div className="form-row">
        <label className="form-field">
          <span>Assigned student</span>
          <select
            value={form.assignedStudent}
            onChange={(e) =>
              handleChange("assignedStudent", e.target.value as StudentName)
            }
          >
            {STUDENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Status</span>
          <select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value as TaskStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="form-field checkbox-field">
        <input
          type="checkbox"
          checked={form.clarificationMeetingNeeded}
          onChange={(e) =>
            handleChange("clarificationMeetingNeeded", e.target.checked)
          }
        />
        <span>Clarification meeting needed?</span>
      </label>

      <label className="form-field">
        <span>Relevant notes or links</span>
        <textarea
          rows={2}
          value={form.notesOrLinks}
          onChange={(e) => handleChange("notesOrLinks", e.target.value)}
          placeholder="Links, references, context..."
        />
      </label>

      <label className="form-field">
        <span>Requested by</span>
        <input
          type="text"
          required
          value={form.requestedBy}
          onChange={(e) => handleChange("requestedBy", e.target.value)}
          placeholder="Your name"
        />
      </label>

      <button type="submit" className="submit-btn">
        Submit task request
      </button>
    </form>
  );
}
