# Student Availability & Task Request — Sandbox

A local **React + TypeScript + Vite** prototype for a Microsoft Teams custom tab that lets users:

1. View a **calendar of student availability** (FullCalendar, month/week views)
2. Submit **task requests** for available students

Built as a local sandbox first. The project structure is set up to be moved into a Teams custom tab app later, without rewriting business logic.

---

## Project structure

```
src/
  App.tsx                       # Composes layout: header + calendar + form + list
  App.css                       # All app styling
  index.css                     # Minimal global resets only
  main.tsx                      # React entry point
  types.ts                      # Shared domain types (StudentAvailability, TaskRequest, ...)
  components/
    AvailabilityCalendar.tsx    # FullCalendar wrapper, month + week views, color-coded events
    TaskRequestForm.tsx         # Controlled form for creating new task requests
    TaskList.tsx                # Renders submitted task requests
  data/
    sampleAvailability.ts       # Hardcoded prototype availability data
```

The **types** and **components** are intentionally framework-agnostic — no Teams SDK or backend coupling — so they can be reused as-is inside a Teams tab.

---

## Color mapping

| Student | Color     |
| ------- | --------- |
| Yassir  | `#0078D4` |
| Mihai   | `#D83B01` |

---

## Install dependencies

```powershell
npm install
```

## Run locally

```powershell
npm run dev
```

Vite will start the dev server (default: `http://localhost:5173`). Open it in a browser to use the app.

## Build

```powershell
npm run build
npm run preview
```

## Connect to Supabase

This app now supports shared data via Supabase so availability/tasks persist across refresh and across devices.

1. Create a Supabase project.
2. In Supabase SQL Editor, run:

```sql
create table if not exists availability (
   id uuid primary key default gen_random_uuid(),
   student text not null check (student in ('Yassir', 'Mihai')),
   work_date date not null,
   availability text not null check (availability in ('Available', 'Partially Available', 'Unavailable')),
   location text check (location in ('Office', 'Remote')),
   partial_start_time time,
   partial_end_time time,
   note text,
   unique (student, work_date)
);

create table if not exists tasks (
   id uuid primary key default gen_random_uuid(),
   title text not null,
   description text not null,
   priority text not null check (priority in ('Low', 'Medium', 'High', 'Urgent')),
   deadline date not null,
   assigned_student text not null check (assigned_student in ('Yassir', 'Mihai')),
   clarification_meeting_needed boolean not null default false,
   notes_or_links text,
   requested_by text not null,
   status text not null check (status in ('New', 'In Progress', 'Blocked', 'Done')),
   created_at timestamptz not null default now(),
   deleted_at timestamptz,
   deleted_by text
);

-- If your availability table already exists, add the new fields:
alter table availability
   add column if not exists partial_start_time time,
   add column if not exists partial_end_time time;

-- If your tasks table already exists, add deleted audit fields:
alter table public.tasks
   add column if not exists deleted_at timestamptz,
   add column if not exists deleted_by text;
```

3. Enable Row Level Security and add policies allowing reads/writes for your intended users.
4. Create a local env file from [\.env.example](.env.example):

```powershell
copy .env.example .env.local
```

5. Fill in your real values in .env.local:
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY

6. Restart dev server:

```powershell
npm run dev
```

## Secure Teams notifications (recommended)

Do not call Power Automate webhook URLs from frontend code. In public repos/sites, frontend values can be extracted.

Use a server-side trigger instead:

1. In Supabase, open Database -> Webhooks.
2. Create a webhook for table public.tasks.
3. Events: INSERT and UPDATE.
4. Target URL: your Power Automate webhook URL.
5. Add filtering in Power Automate so it only notifies when assigned_student is new/changed.

If a webhook URL was previously used in frontend builds, rotate it in Power Automate immediately.

---

## Phase 2 — Future Microsoft Teams integration

This local sandbox is the **Phase 1** prototype. To later host it as a Microsoft Teams custom tab:

1. **Add the Teams JS SDK**
   ```powershell
   npm install @microsoft/teams-js
   ```
   Call `app.initialize()` from `main.tsx` (wrapped so it still works in the browser sandbox).

2. **Create a Teams app package**
   Use the [Microsoft Teams Toolkit](https://learn.microsoft.com/microsoftteams/platform/toolkit/) VS Code extension to scaffold:
   - `manifest.json`
   - `staticTabs` entry pointing at the hosted Vite build
   - Required `validDomains`

3. **Host the built app**
   Deploy the output of `npm run build` (the `dist/` folder) to any HTTPS host — Azure Static Web Apps, Azure Storage + CDN, GitHub Pages, etc. Teams tabs require HTTPS.

4. **Swap the data layer**
   Replace `src/data/sampleAvailability.ts` and the in-memory tasks state in `App.tsx` with one of:
   - **Dataverse** (via Power Platform Web API)
   - **SharePoint** lists (via Microsoft Graph)
   - **Microsoft Graph** (calendar / events)
   - A custom REST API

   Because `types.ts` already defines the domain model, only the data-fetching layer changes — `AvailabilityCalendar`, `TaskRequestForm`, and `TaskList` stay the same.

5. **Theming**
   FullCalendar styles use neutral Fluent-like colors. When inside Teams you can read the active theme via `app.getContext()` and toggle a CSS class on `body` for dark / high-contrast variants.

---

## Acceptance criteria — status

- [x] App runs locally in a browser (`npm run dev`)
- [x] Calendar displays colored student availability events
- [x] Month / week switching works
- [x] Task request form is visible and usable; `Status` defaults to `"New"`
- [x] Project structured cleanly for later Teams integration
