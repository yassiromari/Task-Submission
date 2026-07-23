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
