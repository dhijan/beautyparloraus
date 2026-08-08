// Public booking flow. The reference code is the guest's only credential —
// there are no accounts, so every /manage call is keyed on it.

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export interface Studio {
  k: string;
  no: string;
  name: string;
  short: string;
  address: string;
  hours: string;
}

export interface Treatment {
  number: string;
  label: string;
  title: string;
  dur: number;
  price: number;
  description: string;
  isActive: boolean;
}

export interface Therapist {
  id: string;
  name: string;
  role: string;
  studio: string;
  /** Treatment labels this therapist is qualified for. */
  cats?: string[];
}

export interface Slot {
  time: string;
  ok: boolean;
  staffId: string | null;
}

export interface Booking {
  ref: string;
  studio: string;
  treatment: string;
  staffId: string;
  date: string;
  time: string;
  dur: number;
  price: number;
  deposit: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "declined";
  paid: boolean;
  channel: string;
  createdAt: string;
}

export interface BookingDetail {
  booking: Booking;
  treatment: Treatment | null;
  therapist: { id: string; name: string } | null;
  studio: Studio | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    ...init,
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong. Please try again.");
  }

  return data as T;
}

export function getBookingConfig() {
  return request<{
    studios: Studio[];
    treatments: Treatment[];
    categories: string[];
    staff: Therapist[];
  }>("/booking/config");
}

export function getSlots(params: {
  studio: string;
  date: string;
  treatment: string;
  staff?: string;
}) {
  const query = new URLSearchParams({
    studio: params.studio,
    date: params.date,
    treatment: params.treatment,
    staff: params.staff || "any",
  });

  return request<{ treatment: Treatment; staff: Therapist[]; slots: Slot[] }>(
    `/booking/slots?${query}`
  );
}

export function createBooking(body: {
  studio: string;
  treatment: string;
  staffId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  paid: boolean;
}) {
  return request<Booking>("/booking", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function findBooking(ref: string) {
  return request<BookingDetail>(`/booking/${encodeURIComponent(ref.trim())}`);
}

export function getMoveSlots(ref: string, date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<{ date: string; slots: Slot[] }>(
    `/booking/${encodeURIComponent(ref)}/slots${query}`
  );
}

export function moveBooking(ref: string, date: string, time: string) {
  return request<Booking>(`/booking/${encodeURIComponent(ref)}`, {
    method: "PATCH",
    body: JSON.stringify({ date, time }),
  });
}

export function cancelBooking(ref: string) {
  return request<Booking>(`/booking/${encodeURIComponent(ref)}`, {
    method: "DELETE",
  });
}
