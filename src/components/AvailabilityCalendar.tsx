import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { STUDENT_COLORS, type StudentAvailability } from "../types";

interface AvailabilityCalendarProps {
  availability: StudentAvailability[];
}

export function AvailabilityCalendar({ availability }: AvailabilityCalendarProps) {
  const events = availability.map((a) => ({
    id: a.id,
    title: `${a.student} - ${a.availability}`,
    start: a.workDate,
    allDay: true,
    color: STUDENT_COLORS[a.student],
    extendedProps: {
      availability: a.availability,
      location: a.location,
      note: a.note,
    },
  }));

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
      />
    </div>
  );
}
