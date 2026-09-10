import { useMemo, useState, type FormEvent } from "react";
import type {
  AvailabilityStatus,
  StudentAvailability,
  StudentName,
} from "../types";

interface AvailabilityEditorProps {
  availability: StudentAvailability[];
  onUpsertAvailability: (
    entry: Omit<StudentAvailability, "id">,
  ) => Promise<boolean>;
}

const STUDENTS: StudentName[] = ["Yassir", "Mihai"];
const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  "Available",
  "Partially Available",
  "Unavailable",
];

export function AvailabilityEditor({
  availability,
  onUpsertAvailability,
}: AvailabilityEditorProps) {
  const [student, setStudent] = useState<StudentName>("Yassir");
  const [workDate, setWorkDate] = useState("");
  const [status, setStatus] = useState<AvailabilityStatus>("Available");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedEntries = useMemo(
    () => [...availability].sort((a, b) => a.workDate.localeCompare(b.workDate)),
    [availability],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const success = await onUpsertAvailability({
      student,
      workDate,
      availability: status,
      location: location.trim() || undefined,
      note: note.trim() || undefined,
    });

    if (success) {
      setLocation("");
      setNote("");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="availability-editor">
      <form className="task-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label className="form-field">
            <span>Student</span>
            <select
              value={student}
              onChange={(event) => setStudent(event.target.value as StudentName)}
            >
              {STUDENTS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Date</span>
            <input
              type="date"
              required
              value={workDate}
              onChange={(event) => setWorkDate(event.target.value)}
            />
          </label>
        </div>

        <div className="form-row">
          <label className="form-field">
            <span>Availability</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as AvailabilityStatus)
              }
            >
              {AVAILABILITY_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Location</span>
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Office / Remote"
            />
          </label>
        </div>

        <label className="form-field">
          <span>Note</span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional details"
          />
        </label>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save availability"}
        </button>
      </form>

      <div className="availability-list">
        <h3>Current submitted availability</h3>
        {sortedEntries.length === 0 ? (
          <p>No availability submitted yet.</p>
        ) : (
          <ul>
            {sortedEntries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.workDate}</strong> - {entry.student}: {entry.availability}
                {entry.location ? ` (${entry.location})` : ""}
                {entry.note ? ` - ${entry.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
