import { useMemo, useState, type FormEvent } from "react";
import type {
  AvailabilityStatus,
  StudentAvailability,
  StudentName,
  WorkLocation,
} from "../types";

interface AvailabilityEditorProps {
  availability: StudentAvailability[];
  onUpsertAvailability: (
    entries: Omit<StudentAvailability, "id">[],
  ) => Promise<boolean>;
  onDeleteAvailability: (id: string) => Promise<boolean>;
}

const STUDENTS: StudentName[] = ["Yassir", "Mihai"];
const AVAILABILITY_STATUSES: AvailabilityStatus[] = [
  "Available",
  "Partially Available",
  "Unavailable",
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const LOCATIONS: WorkLocation[] = ["Office", "Remote"];

type Weekday = (typeof WEEKDAYS)[number];

function getWeekdayLabel(date: Date): Weekday {
  const day = date.getDay();
  const map: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return map[day];
}

function getDatesBetween(startDate: string, endDate: string, weekdays: Set<Weekday>) {
  const result: string[] = [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    if (weekdays.has(getWeekdayLabel(cursor))) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, "0");
      const day = String(cursor.getDate()).padStart(2, "0");
      result.push(`${year}-${month}-${day}`);
    }
  }

  return result;
}

export function AvailabilityEditor({
  availability,
  onUpsertAvailability,
  onDeleteAvailability,
}: AvailabilityEditorProps) {
  const [student, setStudent] = useState<StudentName>("Yassir");
  const [mode, setMode] = useState<"single" | "recurring">("single");
  const [workDate, setWorkDate] = useState("");
  const [rangeStartDate, setRangeStartDate] = useState("");
  const [rangeEndDate, setRangeEndDate] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<Weekday>>(
    () => new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]),
  );
  const [status, setStatus] = useState<AvailabilityStatus>("Available");
  const [location, setLocation] = useState<WorkLocation>("Office");
  const [partialStartTime, setPartialStartTime] = useState("");
  const [partialEndTime, setPartialEndTime] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const sortedEntries = useMemo(
    () => [...availability].sort((a, b) => a.workDate.localeCompare(b.workDate)),
    [availability],
  );

  const toggleWeekday = (day: Weekday) => {
    setSelectedWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (status === "Partially Available" && (!partialStartTime || !partialEndTime)) {
      setFormError("Please provide from and to time for partially available days.");
      return;
    }

    if (
      status === "Partially Available" &&
      partialStartTime >= partialEndTime
    ) {
      setFormError("Partial availability start time must be before end time.");
      return;
    }

    const candidateDates =
      mode === "single"
        ? [workDate]
        : getDatesBetween(rangeStartDate, rangeEndDate, selectedWeekdays);

    if (candidateDates.length === 0) {
      setFormError("No dates matched your recurring selection.");
      return;
    }

    setIsSubmitting(true);

    const entries = candidateDates.map((date) => ({
      student,
      workDate: date,
      availability: status,
      location,
      partialStartTime:
        status === "Partially Available" ? partialStartTime : undefined,
      partialEndTime: status === "Partially Available" ? partialEndTime : undefined,
      note: note.trim() || undefined,
    }));

    const success = await onUpsertAvailability(entries);

    if (success) {
      setNote("");
      setPartialStartTime("");
      setPartialEndTime("");
      setFormError(null);
    }

    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDeleteAvailability(id);
    setDeletingId(null);
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
            <span>Entry mode</span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as "single" | "recurring")}
            >
              <option value="single">Single day</option>
              <option value="recurring">Recurring range</option>
            </select>
          </label>
        </div>

        {mode === "single" ? (
          <div className="form-row">
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
        ) : (
          <>
            <div className="form-row">
              <label className="form-field">
                <span>From</span>
                <input
                  type="date"
                  required
                  value={rangeStartDate}
                  onChange={(event) => setRangeStartDate(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>To</span>
                <input
                  type="date"
                  required
                  value={rangeEndDate}
                  onChange={(event) => setRangeEndDate(event.target.value)}
                />
              </label>
            </div>

            <div className="form-field">
              <span>Repeat on</span>
              <div className="weekday-grid">
                {WEEKDAYS.map((day) => (
                  <label key={day} className="weekday-pill">
                    <input
                      type="checkbox"
                      checked={selectedWeekdays.has(day)}
                      onChange={() => toggleWeekday(day)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="form-row">
          <label className="form-field">
            <span>Availability</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AvailabilityStatus)}
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
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value as WorkLocation)}
            >
              {LOCATIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>

        {status === "Partially Available" && (
          <div className="form-row">
            <label className="form-field">
              <span>From time</span>
              <input
                type="time"
                required
                value={partialStartTime}
                onChange={(event) => setPartialStartTime(event.target.value)}
              />
            </label>

            <label className="form-field">
              <span>To time</span>
              <input
                type="time"
                required
                value={partialEndTime}
                onChange={(event) => setPartialEndTime(event.target.value)}
              />
            </label>
          </div>
        )}

        <label className="form-field">
          <span>Note</span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional details"
          />
        </label>

        <button
          type="submit"
          className="submit-btn"
          disabled={
            isSubmitting ||
            (mode === "single" && !workDate) ||
            (mode === "recurring" &&
              (!rangeStartDate || !rangeEndDate || selectedWeekdays.size === 0))
          }
        >
          {isSubmitting ? "Saving..." : "Save availability"}
        </button>

        {formError && <p className="sync-message sync-error">{formError}</p>}
      </form>

      <div className="availability-list">
        <h3>Current submitted availability</h3>
        {sortedEntries.length === 0 ? (
          <p>No availability submitted yet.</p>
        ) : (
          <ul>
            {sortedEntries.map((entry) => (
              <li key={entry.id}>
                <div className="availability-item-content">
                  <span>
                    <strong>{entry.workDate}</strong> - {entry.student}: {entry.availability}
                    {entry.availability === "Partially Available" &&
                    entry.partialStartTime &&
                    entry.partialEndTime
                      ? ` (${entry.partialStartTime}-${entry.partialEndTime})`
                      : ""}
                    {entry.location ? ` (${entry.location})` : ""}
                    {entry.note ? ` - ${entry.note}` : ""}
                  </span>
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                  >
                    {deletingId === entry.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
