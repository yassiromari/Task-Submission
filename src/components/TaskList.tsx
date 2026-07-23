import { STUDENT_COLORS, type TaskRequest } from "../types";

interface TaskListProps {
  tasks: TaskRequest[];
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="task-list empty">
        <p>No task requests submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <h2>Submitted task requests</h2>
      <ul>
        {tasks.map((task) => (
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
              {task.notesOrLinks && (
                <p className="task-notes">{task.notesOrLinks}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
