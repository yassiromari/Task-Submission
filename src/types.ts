// Domain types for the Student Availability & Task Request app.
// These are kept framework-agnostic so they can later be reused
// when the app is moved into a Microsoft Teams custom tab and
// backed by Dataverse / SharePoint / Microsoft Graph / a REST API.

export type StudentName = "Yassir" | "Mihai";

export const STUDENT_COLORS: Record<StudentName, string> = {
  Yassir: "#0078D4",
  Mihai: "#D83B01",
};

export type AvailabilityStatus = "Available" | "Partially Available" | "Unavailable";

export const AVAILABILITY_COLORS: Record<AvailabilityStatus, string> = {
  Available: "#16a34a",
  "Partially Available": "#f59e0b",
  Unavailable: "#dc2626",
};

export type WorkLocation = "Office" | "Remote";

export interface StudentAvailability {
  id: string;
  student: StudentName;
  workDate: string; // ISO date string, e.g. "2026-06-30"
  availability: AvailabilityStatus;
  location?: WorkLocation;
  partialStartTime?: string; // 24h HH:mm
  partialEndTime?: string; // 24h HH:mm
  note?: string;
}

export type Priority = "Low" | "Medium" | "High" | "Urgent";

export type TaskStatus = "New" | "In Progress" | "Blocked" | "Done";

export interface TaskRequest {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  deadline: string; // ISO date string
  assignedStudent: StudentName;
  clarificationMeetingNeeded: boolean;
  notesOrLinks?: string;
  requestedBy: string;
  status: TaskStatus;
  createdAt: string; // ISO datetime
  deletedAt?: string;
  deletedBy?: string;
}

export type TaskRequestDraft = Omit<
  TaskRequest,
  "id" | "assignedStudent" | "createdAt" | "deletedAt" | "deletedBy"
> & {
  selectedAssignee?: StudentName;
};

export type TaskUpdateDraft = Omit<TaskRequest, "createdAt" | "deletedAt" | "deletedBy">;
