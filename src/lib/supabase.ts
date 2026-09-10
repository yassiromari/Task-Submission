import { createClient } from "@supabase/supabase-js";
import type {
  StudentAvailability,
  TaskRequest,
  TaskRequestDraft,
  TaskUpdateDraft,
} from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

interface AvailabilityRow {
  id: string;
  student: StudentAvailability["student"];
  work_date: string;
  availability: StudentAvailability["availability"];
  location: StudentAvailability["location"] | null;
  partial_start_time: string | null;
  partial_end_time: string | null;
  note: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  description: string;
  priority: TaskRequest["priority"];
  deadline: string;
  assigned_student: TaskRequest["assignedStudent"];
  clarification_meeting_needed: boolean;
  notes_or_links: string | null;
  requested_by: string;
  status: TaskRequest["status"];
  created_at: string;
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return supabase;
}

function mapAvailabilityRowToModel(row: AvailabilityRow): StudentAvailability {
  return {
    id: row.id,
    student: row.student,
    workDate: row.work_date,
    availability: row.availability,
    location: row.location ?? undefined,
    partialStartTime: row.partial_start_time ?? undefined,
    partialEndTime: row.partial_end_time ?? undefined,
    note: row.note ?? undefined,
  };
}

function mapTaskRowToModel(row: TaskRow): TaskRequest {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    deadline: row.deadline,
    assignedStudent: row.assigned_student,
    clarificationMeetingNeeded: row.clarification_meeting_needed,
    notesOrLinks: row.notes_or_links ?? undefined,
    requestedBy: row.requested_by,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function fetchAvailability(): Promise<StudentAvailability[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("availability")
    .select(
      "id, student, work_date, availability, location, partial_start_time, partial_end_time, note",
    )
    .order("work_date", { ascending: true });

  if (error) throw error;
  return (data as AvailabilityRow[]).map(mapAvailabilityRowToModel);
}

export async function fetchTasks(): Promise<TaskRequest[]> {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("tasks")
    .select(
      "id, title, description, priority, deadline, assigned_student, clarification_meeting_needed, notes_or_links, requested_by, status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as TaskRow[]).map(mapTaskRowToModel);
}

export async function upsertAvailabilityEntries(
  entries: Omit<StudentAvailability, "id">[],
): Promise<StudentAvailability[]> {
  const client = ensureSupabase();

  const rows = entries.map((entry) => ({
    student: entry.student,
    work_date: entry.workDate,
    availability: entry.availability,
    location: entry.location ?? null,
    partial_start_time: entry.partialStartTime ?? null,
    partial_end_time: entry.partialEndTime ?? null,
    note: entry.note ?? null,
  }));

  const { data, error } = await client
    .from("availability")
    .upsert(rows, { onConflict: "student,work_date" })
    .select(
      "id, student, work_date, availability, location, partial_start_time, partial_end_time, note",
    );

  if (error) throw error;
  return (data as AvailabilityRow[]).map(mapAvailabilityRowToModel);
}

export async function deleteAvailabilityEntry(id: string): Promise<void> {
  const client = ensureSupabase();
  const { error } = await client.from("availability").delete().eq("id", id);

  if (error) throw error;
}

export async function createTaskEntry(
  taskDraft: TaskRequestDraft,
  assignedStudent: TaskRequest["assignedStudent"],
): Promise<TaskRequest> {
  const client = ensureSupabase();

  const payload = {
    title: taskDraft.title,
    description: taskDraft.description,
    priority: taskDraft.priority,
    deadline: taskDraft.deadline,
    assigned_student: assignedStudent,
    clarification_meeting_needed: taskDraft.clarificationMeetingNeeded,
    notes_or_links: taskDraft.notesOrLinks ?? null,
    requested_by: taskDraft.requestedBy,
    status: taskDraft.status,
  };

  const { data, error } = await client
    .from("tasks")
    .insert(payload)
    .select(
      "id, title, description, priority, deadline, assigned_student, clarification_meeting_needed, notes_or_links, requested_by, status, created_at",
    )
    .single();

  if (error) throw error;
  return mapTaskRowToModel(data as TaskRow);
}

export async function updateTaskEntry(
  task: TaskUpdateDraft,
): Promise<TaskRequest> {
  const client = ensureSupabase();

  const payload = {
    title: task.title,
    description: task.description,
    priority: task.priority,
    deadline: task.deadline,
    assigned_student: task.assignedStudent,
    clarification_meeting_needed: task.clarificationMeetingNeeded,
    notes_or_links: task.notesOrLinks ?? null,
    requested_by: task.requestedBy,
    status: task.status,
  };

  const { data, error } = await client
    .from("tasks")
    .update(payload)
    .eq("id", task.id)
    .select(
      "id, title, description, priority, deadline, assigned_student, clarification_meeting_needed, notes_or_links, requested_by, status, created_at",
    )
    .single();

  if (error) throw error;
  return mapTaskRowToModel(data as TaskRow);
}
