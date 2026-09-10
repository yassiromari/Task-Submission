import { useEffect, useState } from "react";
import { AvailabilityCalendar } from "./components/AvailabilityCalendar";
import { AvailabilityEditor } from "./components/AvailabilityEditor";
import { TaskRequestForm } from "./components/TaskRequestForm";
import { TaskList } from "./components/TaskList";
import { sampleAvailability } from "./data/sampleAvailability";
import {
  createTaskEntry,
  deleteAvailabilityEntry,
  fetchAvailability,
  fetchTasks,
  isSupabaseConfigured,
  softDeleteTaskEntry,
  upsertAvailabilityEntries,
  updateTaskEntry,
} from "./lib/supabase";
import {
  STUDENT_COLORS,
  type AvailabilityStatus,
  type StudentAvailability,
  type StudentName,
  type TaskRequest,
  type TaskRequestDraft,
  type TaskUpdateDraft,
} from "./types";
import "./App.css";

const OPEN_STATUSES = new Set(["New", "In Progress", "Blocked"]);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "Unknown error";
}

function toUserSyncError(error: unknown): string {
  const message = getErrorMessage(error);

  if (message.includes("availability.partial_start_time")) {
    return "Supabase schema is missing partial-time columns. Run the ALTER TABLE command in README under Connect to Supabase, then refresh.";
  }

  return `Supabase sync error: ${message}`;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!isSupabaseConfigured) {
        setSyncError(
          "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect shared data.",
        );
        setIsLoading(false);
        return;
      }

      try {
        const [availabilityRows, taskRows] = await Promise.all([
          fetchAvailability(),
          fetchTasks(),
        ]);

        if (!isMounted) return;

        setAvailability(
          availabilityRows.length > 0 ? availabilityRows : sampleAvailability,
        );
        setTasks(taskRows);
        setSyncError(null);
      } catch (error) {
        if (!isMounted) return;
        setSyncError(toUserSyncError(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getSuggestedAssignee = (deadline: string): StudentName | null => {
    return getAssigneeOptions(deadline)[0] ?? null;
  };

  const getAssigneeOptions = (deadline: string): StudentName[] => {
    const students = Object.keys(STUDENT_COLORS) as StudentName[];
    const workloadByStudent = tasks.reduce(
      (acc, task) => {
        if (!task.deletedAt && OPEN_STATUSES.has(task.status)) {
          acc[task.assignedStudent] += 1;
        }
        return acc;
      },
      { Yassir: 0, Mihai: 0 } as Record<StudentName, number>,
    );

    const byStudent = new Map<StudentName, AvailabilityStatus>();
    availability
      .filter((entry) => entry.workDate === deadline)
      .forEach((entry) => {
        byStudent.set(entry.student, entry.availability);
      });

    const scored = students
      .map((student) => {
        const status = byStudent.get(student);

        return {
          student,
          availabilityScore: getAvailabilityScore(status),
          score: getAvailabilityScore(status) - workloadByStudent[student] * 0.5,
          workload: workloadByStudent[student],
        };
      })
      .filter((entry) => entry.availabilityScore > 0);

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.workload !== b.workload) return a.workload - b.workload;
      return a.student.localeCompare(b.student);
    });

    return scored.map((entry) => entry.student);
  };

  const handleUpsertAvailability = async (
    nextAvailability: Omit<StudentAvailability, "id">[],
  ): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    try {
      const saved = await upsertAvailabilityEntries(nextAvailability);
      setAvailability((prev) => {
        const merged = new Map(prev.map((entry) => [entry.id, entry]));
        saved.forEach((entry) => merged.set(entry.id, entry));
        return [...merged.values()];
      });
      setSyncError(null);
      return true;
    } catch (error) {
      setSyncError(toUserSyncError(error));
      return false;
    }
  };

  const handleDeleteAvailability = async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    try {
      await deleteAvailabilityEntry(id);
      setAvailability((prev) => prev.filter((entry) => entry.id !== id));
      setSyncError(null);
      return true;
    } catch (error) {
      setSyncError(`Could not delete availability: ${getErrorMessage(error)}`);
      return false;
    }
  };

  const handleNewTask = async (taskDraft: TaskRequestDraft): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    const assignedStudent =
      taskDraft.selectedAssignee ?? getSuggestedAssignee(taskDraft.deadline);

    if (!assignedStudent) {
      setSyncError(
        "No one is marked available for that deadline. Pick a different date or add availability first.",
      );
      return false;
    }

    try {
      const task = await createTaskEntry(taskDraft, assignedStudent);
      // eslint-disable-next-line no-console
      console.log("New task request submitted:", task);
      setTasks((prev) => [task, ...prev]);
      setSyncError(null);
      return true;
    } catch (error) {
      setSyncError(`Could not create task: ${getErrorMessage(error)}`);
      return false;
    }
  };

  const handleUpdateTask = async (taskDraft: TaskUpdateDraft): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    try {
      const updated = await updateTaskEntry(taskDraft);
      setTasks((prev) =>
        prev.map((task) => (task.id === updated.id ? updated : task)),
      );
      setSyncError(null);
      return true;
    } catch (error) {
      setSyncError(`Could not update task: ${getErrorMessage(error)}`);
      return false;
    }
  };

  const handleDeleteTask = async (
    taskId: string,
    deletedBy: string,
  ): Promise<boolean> => {
    if (!isSupabaseConfigured) return false;

    try {
      const deletedTask = await softDeleteTaskEntry(taskId, deletedBy);
      setTasks((prev) =>
        prev.map((task) => (task.id === deletedTask.id ? deletedTask : task)),
      );
      setSyncError(null);
      return true;
    } catch (error) {
      setSyncError(`Could not delete task: ${getErrorMessage(error)}`);
      return false;
    }
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

      {syncError && <p className="sync-message sync-error">{syncError}</p>}
      {isLoading && <p className="sync-message">Loading shared data...</p>}

      {activePage === "availability" ? (
        <main className="single-page-main">
          <section className="panel">
            <h2>Update student availability</h2>
            <AvailabilityEditor
              availability={availability}
              onUpsertAvailability={handleUpsertAvailability}
              onDeleteAvailability={handleDeleteAvailability}
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
              getAssigneeOptions={getAssigneeOptions}
            />
          </section>

          <section className="panel list-panel">
            <TaskList
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              getAssigneeOptions={getAssigneeOptions}
            />
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
