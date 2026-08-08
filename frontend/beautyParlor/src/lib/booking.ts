// Formatting helpers for appointments. The scheduling rules themselves live on
// the server (backend/src/utils/schedule.js) so the diary has one source of
// truth — this file only turns its values into something readable.

import type { Booking, Studio, Treatment } from "../api/bookingApi";

const pad2 = (n: number) => String(n).padStart(2, "0");

export const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MON = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** "9:30" -> 570 minutes past midnight. */
export const t2m = (t: string) => {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
};

export const m2t = (m: number) => `${Math.floor(m / 60)}:${pad2(m % 60)}`;

/** "13:30" -> "1:30pm". */
export const t12 = (t: string) => {
  const total = t2m(t);
  const h = Math.floor(total / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad2(total % 60)}${h >= 12 ? "pm" : "am"}`;
};

/** Parses yyyy-mm-dd as a *local* date — `new Date(str)` would read it as UTC. */
export const dParts = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const dLabel = (s: string) => {
  const d = dParts(s);
  return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
};

export const nextDays = (n: number) => {
  const out: string[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(isoDate(d));
  }

  return out;
};

export const money = (n: number) => `$${Math.round(n)}`;

/** Mirrors the server's rule so the summary panel can show it before booking. */
export const depositFor = (price: number) =>
  Math.max(10, Math.round((price * 0.2) / 5) * 5);

export const STATUS_LABEL: Record<Booking["status"], string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
};

/** Downloadable calendar entry for the confirmation screen. */
export function icsFor(
  booking: Booking,
  treatment: Treatment | null,
  studio: Studio | null
) {
  const start = t2m(booking.time);
  const stamp = (mins: number) =>
    `${booking.date.replace(/-/g, "")}T${pad2(Math.floor(mins / 60))}${pad2(mins % 60)}00`;

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${treatment ? treatment.title : "Appointment"} at Brow Beauty Hub`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(start + booking.dur)}`,
    `LOCATION:${studio ? studio.address : ""}`,
    `DESCRIPTION:Reference ${booking.ref}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(body)}`;
}
