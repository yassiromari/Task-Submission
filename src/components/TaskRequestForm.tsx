import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  Priority,
  RequestTarget,
  StudentName,
  TaskRequestDraft,
  TaskStatus,
} from "../types";

interface TaskRequestFormProps {
  onSubmit: (task: TaskRequestDraft) => Promise<boolean>;
  getSuggestedAssignee: (deadline: string) => StudentName | null;
  getAssigneeOptions: (deadline: string) => StudentName[];
}

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];
const STATUSES: TaskStatus[] = ["New", "In Progress", "Blocked", "Done"];
const ALL_ASSIGNEES: StudentName[] = ["Yassir", "Mihai"];
const REQUEST_TARGETS: RequestTarget[] = ["Either", "Both", ...ALL_ASSIGNEES];

interface FormState {
  title: string;
  description: string;
  priority: Priority;
  deadline: string;
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
  clarificationMeetingNeeded: false,
  notesOrLinks: "",
  requestedBy: "",
  status: "New",
};

export function TaskRequestForm({
  onSubmit,
  getSuggestedAssignee,
  getAssigneeOptions,
}: TaskRequestFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestTarget, setRequestTarget] = useState<RequestTarget>("Either");

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const taskDraft: TaskRequestDraft = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      deadline: form.deadline,
      clarificationMeetingNeeded: form.clarificationMeetingNeeded,
      notesOrLinks: form.notesOrLinks.trim() || undefined,
      requestedBy: form.requestedBy.trim(),
      status: form.status,
      requestTarget,
    };

    const success = await onSubmit(taskDraft);
    if (success) {
      setForm(INITIAL_STATE);
      setRequestTarget("Either");
    }

    setIsSubmitting(false);
  };

  const suggestedAssignee = form.deadline
    ? getSuggestedAssignee(form.deadline)
    : null;

  const assigneeOptions = useMemo(
    () => {
      const available = form.deadline ? getAssigneeOptions(form.deadline) : [];
      const remaining = ALL_ASSIGNEES.filter((name) => !available.includes(name));
      return [...available, ...remaining];
    },
    [form.deadline, getAssigneeOptions],
  );

  useEffect(() => {
    if (
      (requestTarget === "Yassir" || requestTarget === "Mihai") &&
      !assigneeOptions.includes(requestTarget)
    ) {
      setRequestTarget("Either");
    }
  }, [assigneeOptions, requestTarget]);

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

        <label className="form-field">
          <span>Request For</span>
          <select
            value={requestTarget}
            onChange={(e) => setRequestTarget(e.target.value as RequestTarget)}
          >
            {REQUEST_TARGETS.map((target) => {
              if (target === "Either") {
                return (
                  <option key={target} value={target}>
                    {suggestedAssignee
                      ? `Either (Smart pick: ${suggestedAssignee})`
                      : "Either (No one marked available)"}
                  </option>
                );
              }

              if (target === "Both") {
                return (
                  <option key={target} value={target}>
                    Both (Creates one task per student)
                  </option>
                );
              }

              return (
                <option key={target} value={target}>
                  {target}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      {form.deadline && assigneeOptions.length > 0 && (
        <p className="sync-message">Free on this date: {assigneeOptions.join(", ")}</p>
      )}
      {form.deadline && assigneeOptions.length === 0 && (
        <p className="sync-message sync-error">
          No one is marked available on this deadline yet.
        </p>
      )}

      {requestTarget === "Both" && (
        <p className="sync-message">This request will create one task for Yassir and one for Mihai.</p>
      )}

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

      <button
        type="submit"
        className="submit-btn"
        disabled={isSubmitting || !form.deadline}
      >
        {isSubmitting ? "Submitting..." : "Submit task request"}
      </button>
    </form>
  );
}
