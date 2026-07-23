import { useState } from "react";
import { AvailabilityCalendar } from "./components/AvailabilityCalendar";
import { TaskRequestForm } from "./components/TaskRequestForm";
import { TaskList } from "./components/TaskList";
import { sampleAvailability } from "./data/sampleAvailability";
import { STUDENT_COLORS, type TaskRequest } from "./types";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState<TaskRequest[]>([]);

  const handleNewTask = (task: TaskRequest) => {
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
        <div className="legend">
          {Object.entries(STUDENT_COLORS).map(([name, color]) => (
            <div key={name} className="legend-item">
              <span className="legend-swatch" style={{ background: color }} />
              {name}
            </div>
          ))}
        </div>
      </header>

      <main className="app-main">
        <section className="panel calendar-panel">
          <h2>Availability calendar</h2>
          <AvailabilityCalendar availability={sampleAvailability} />
        </section>

        <section className="panel form-panel">
          <TaskRequestForm onSubmit={handleNewTask} />
        </section>

        <section className="panel list-panel">
          <TaskList tasks={tasks} />
        </section>
      </main>
    </div>
  );
}

export default App;
