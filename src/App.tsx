import { useState } from "react";
import { AvailabilityCalendar } from "./components/AvailabilityCalendar";
import { AvailabilityEditor } from "./components/AvailabilityEditor";
import { TaskRequestForm } from "./components/TaskRequestForm";
import { TaskList } from "./components/TaskList";
import { sampleAvailability } from "./data/sampleAvailability";
import {
  STUDENT_COLORS,
  type AvailabilityStatus,
  type StudentAvailability,
  type StudentName,
  type TaskRequest,
  type TaskRequestDraft,
} from "./types";
import "./App.css";

const OPEN_STATUSES = new Set(["New", "In Progress", "Blocked"]);

function getAvailabilityScore(status: AvailabilityStatus | undefined): number {
  switch (status) {
    case "Available":
      return 3;
    case "Partially Available":
      return 2;
    case "Unavailable":
      return 0;
    default:
      // If no explicit availability was submitted for a date, treat it as neutral.
      return 1;
  }
}

function App() {
  const [activePage, setActivePage] = useState<"dashboard" | "availability">(
    "dashboard",
  );
  const [availability, setAvailability] = useState<StudentAvailability[]>(
    sampleAvailability,
  );
  const [tasks, setTasks] = useState<TaskRequest[]>([]);

  const getSuggestedAssignee = (deadline: string): StudentName => {
    const students = Object.keys(STUDENT_COLORS) as StudentName[];
    const workloadByStudent = tasks.reduce(
      (acc, task) => {
        if (OPEN_STATUSES.has(task.status)) {
          acc[task.assignedStudent] += 1;
        }
        return acc;
      },
      { Yassir: 0, Mihai: 0 } as Record<StudentName, number>,
    );

    const scored = students.map((student) => {
      const dayAvailability = availability.find(
        (entry) => entry.student === student && entry.workDate === deadline,
      );

      return {
        student,
        score:
          getAvailabilityScore(dayAvailability?.availability) -
          workloadByStudent[student] * 0.5,
        workload: workloadByStudent[student],
      };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.workload !== b.workload) return a.workload - b.workload;
      return a.student.localeCompare(b.student);
    });

    return scored[0].student;
  };

  const handleUpsertAvailability = (
    nextAvailability: Omit<StudentAvailability, "id">,
  ) => {
    setAvailability((prev) => {
      const existing = prev.find(
        (entry) =>
          entry.student === nextAvailability.student &&
          entry.workDate === nextAvailability.workDate,
      );

      if (existing) {
        return prev.map((entry) =>
          entry.id === existing.id ? { ...entry, ...nextAvailability } : entry,
        );
      }

      return [
        {
          id: crypto.randomUUID(),
          ...nextAvailability,
        },
        ...prev,
      ];
    });
  };

  const handleNewTask = (taskDraft: TaskRequestDraft) => {
    const task: TaskRequest = {
      id: crypto.randomUUID(),
      assignedStudent: getSuggestedAssignee(taskDraft.deadline),
      createdAt: new Date().toISOString(),
      ...taskDraft,
    };

    // For the local prototype we keep tasks in component state.
    // When wired up to a backend (Dataverse / SharePoint / Graph / API),
    // this is the integration point.
    // eslint-disable-next-line no-console
    console.log("New task request submitted:", task);
    setTasks((prev) => [task, ...prev]);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Student Availability & Task Requests</h1>
        <div className="header-actions">
          <div className="legend">
            {Object.entries(STUDENT_COLORS).map(([name, color]) => (
              <div key={name} className="legend-item">
                <span className="legend-swatch" style={{ background: color }} />
                {name}
              </div>
            ))}
          </div>

          {activePage === "dashboard" ? (
            <button
              type="button"
              className="nav-btn"
              onClick={() => setActivePage("availability")}
            >
              Add availability
            </button>
          ) : (
            <button
              type="button"
              className="nav-btn nav-btn-secondary"
              onClick={() => setActivePage("dashboard")}
            >
              Back to dashboard
            </button>
          )}
        </div>
      </header>

      {activePage === "availability" ? (
        <main className="single-page-main">
          <section className="panel">
            <h2>Update student availability</h2>
            <AvailabilityEditor
              availability={availability}
              onUpsertAvailability={handleUpsertAvailability}
            />
          </section>
        </main>
      ) : (
        <main className="app-main">
          <section className="panel calendar-panel">
            <h2>Availability calendar</h2>
            <AvailabilityCalendar availability={availability} />
          </section>

          <section className="panel form-panel">
            <TaskRequestForm
              onSubmit={handleNewTask}
              getSuggestedAssignee={getSuggestedAssignee}
            />
          </section>

          <section className="panel list-panel">
            <TaskList tasks={tasks} />
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
