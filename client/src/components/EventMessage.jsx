import { memo } from "react";
import { Calendar, Clock, Users, Bell } from "lucide-react";

const ICONS = { birthday: "🎂", meeting: "📅", reminder: "🔔", other: "📌" };

const EventMessage = memo(function EventMessage({ event }) {
  if (!event?.title) return null;

  const date = event.startsAt ? new Date(event.startsAt) : null;
  const dateStr = date
    ? date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : null;
  const timeStr = date
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="event-card">
      <div className="event-card__icon">{ICONS[event.eventType] || "📌"}</div>
      <div className="event-card__body">
        <span className="event-card__type">{event.eventType}</span>
        <p className="event-card__title">{event.title}</p>
        {event.description && <p className="event-card__desc">{event.description}</p>}
        {date && (
          <p className="event-card__time">
            {dateStr}
            {timeStr && <> · {timeStr}</>}
          </p>
        )}
      </div>
    </div>
  );
});

export default EventMessage;
