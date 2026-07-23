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

export interface StudentAvailability {
  id: string;
  student: StudentName;
  workDate: string; // ISO date string, e.g. "2026-06-30"
  availability: AvailabilityStatus;
  location?: string;
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
}
