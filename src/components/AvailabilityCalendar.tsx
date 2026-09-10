import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventContentArg, EventMountArg } from "@fullcalendar/core";
import {
  AVAILABILITY_COLORS,
  type AvailabilityStatus,
  type StudentAvailability,
} from "../types";

interface AvailabilityCalendarProps {
  availability: StudentAvailability[];
}

export function AvailabilityCalendar({ availability }: AvailabilityCalendarProps) {
  const events = availability.map((a) => ({
    id: a.id,
    title: a.student,
    start: a.workDate,
    allDay: true,
    color: AVAILABILITY_COLORS[a.availability],
    extendedProps: {
      student: a.student,
      availability: a.availability,
      location: a.location,
      note: a.note,
    },
  }));

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { student, availability, location, note } = eventInfo.event.extendedProps as {
      student: string;
      availability: AvailabilityStatus;
      location?: string;
      note?: string;
    };

    return (
      <div className="calendar-event-content">
        <div className="calendar-event-top">{student}</div>
        <div className="calendar-event-sub">
          {availability}
          {location ? ` | ${location}` : ""}
        </div>
        {note ? <div className="calendar-event-note">{note}</div> : null}
      </div>
    );
  };

  const setEventTooltip = (eventInfo: EventMountArg) => {
    const { student, availability, location, note } = eventInfo.event.extendedProps as {
      student: string;
      availability: AvailabilityStatus;
      location?: string;
      note?: string;
    };

    const lines = [
      student,
      `Status: ${availability}`,
      `Location: ${location ?? "Not set"}`,
      note ? `Note: ${note}` : "",
    ].filter(Boolean);

    eventInfo.el.title = lines.join("\n");
  };

  return (
    <div className="calendar-card">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        events={events}
        height="auto"
        firstDay={1}
        eventDisplay="block"
        eventContent={renderEventContent}
        eventDidMount={setEventTooltip}
      />
    </div>
  );
}
