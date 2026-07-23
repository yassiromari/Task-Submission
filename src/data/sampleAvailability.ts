import type { StudentAvailability } from "../types";

// Hardcoded prototype data. Later this will be replaced by a data
// source call (Dataverse / SharePoint / Microsoft Graph / REST API).
export const sampleAvailability: StudentAvailability[] = [
  {
    id: "a1",
    student: "Yassir",
    workDate: "2026-06-30",
    availability: "Available",
    location: "Office",
    note: "Full day onsite",
  },
  {
    id: "a2",
    student: "Mihai",
    workDate: "2026-07-01",
    availability: "Available",
    location: "Remote",
  },
  {
    id: "a3",
    student: "Yassir",
    workDate: "2026-07-03",
    availability: "Available",
    location: "Office",
  },
  {
    id: "a4",
    student: "Mihai",
    workDate: "2026-07-04",
    availability: "Partially Available",
    location: "Remote",
    note: "Available in the afternoon",
  },
];
