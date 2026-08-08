// Studio console API. Every call is admin-only and carries the admin token.

import { getAdminAuthHeaders } from "./adminAuthApi";
import type { Booking, Studio, Therapist, Treatment } from "./bookingApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export interface RosterTherapist extends Therapist {
  /** Working window per weekday index ("0".."6"). Missing key = day off. */
  hours: Record<string, [string, string]>;
  cats: string[];
}

export interface Block {
  id: number;
  studio: string;
  staffId: string;
  date: string;
  from: string;
  to: string;
  reason: string;
}

export interface DayView {
  date: string;
  times: string[];
  staff: RosterTherapist[];
  bookings: Booking[];
  blocks: Block[];
  kpis: {
    bookings: number;
    pendingToday: number;
    revenue: number;
    utilisation: number;
    therapists: number;
    awaiting: number;
  };
}

export interface RequestRow extends Booking {
  treatmentTitle: string;
  staffName: string;
}

export interface ClientRow {
  phone: string;
  name: string;
  email: string;
  visits: number;
  spend: number;
  lastSeen: string | null;
}

export interface ClientDetail {
  phone: string;
  name: string;
  email: string;
  history: RequestRow[];
  notes: { id: number; body: string; author: string; createdAt: string }[];
}

export interface InventoryRow {
  id: string;
  name: string;
  cat: string;
  sku: string;
  unit: string;
  cost: number;
  retail: number;
  par: number;
  supplier: string;
  onHand: number;
  onOrder: number;
  state: "ok" | "low" | "out";
  atCost: number;
  suggested: number;
  split: { key: string; qty: number; low: boolean }[];
}

export interface InventoryView {
  scope: string;
  kpis: {
    tracked: number;
    needing: number;
    out: number;
    atCost: number;
    onOrder: number;
    openOrders: number;
  };
  rows: InventoryRow[];
  orders: {
    id: number;
    itemId: string;
    itemName: string;
    supplier: string;
    studio: string;
    qty: number;
    value: number;
    placed: string;
    eta: string | null;
    status: string;
  }[];
  moves: {
    id: number;
    itemName: string;
    studio: string;
    qty: number;
    kind: string;
    movedOn: string;
    who: string;
  }[];
}

export interface Reports {
  kpis: {
    completedRevenue: number;
    completedCount: number;
    bookedRevenue: number;
    confirmedCount: number;
    averageTicket: number;
    lostCount: number;
    cancellationRate: number;
  };
  studios: { key: string; name: string; revenue: number }[];
  treatments: {
    number: string;
    title: string;
    bookings: number;
    revenue: number;
  }[];
  staff: { id: string; name: string; studio: string; utilisation: number }[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/studio${path}`, {
    ...init,
    headers: {
      ...getAdminAuthHeaders(),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "The studio console could not reach the server.");
  }

  return data as T;
}

const scope = (studio: string) => (studio && studio !== "all" ? `studio=${studio}` : "");

export function getStudioContext() {
  return request<{
    studios: Studio[];
    treatments: Treatment[];
    staff: RosterTherapist[];
    times: string[];
  }>("/context");
}

export function getDayView(date: string, studio: string) {
  return request<DayView>(`/day?date=${date}&${scope(studio)}`);
}

export function getRequests(studio: string) {
  return request<RequestRow[]>(`/requests?${scope(studio)}`);
}

export function getBookingDetail(ref: string) {
  return request<{
    booking: Booking;
    treatment: Treatment | null;
    therapist: RosterTherapist | null;
    studio: Studio | null;
  }>(`/bookings/${encodeURIComponent(ref)}`);
}

export function updateBooking(
  ref: string,
  body: { status?: string; date?: string; time?: string; staffId?: string }
) {
  return request<Booking>(`/bookings/${encodeURIComponent(ref)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function createWalkIn(body: {
  studio: string;
  treatment: string;
  staffId: string;
  date: string;
  time: string;
  name: string;
  phone: string;
}) {
  return request<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getClients(studio: string) {
  return request<ClientRow[]>(`/clients?${scope(studio)}`);
}

export function getClient(phone: string) {
  return request<ClientDetail>(`/clients/${encodeURIComponent(phone)}`);
}

export function addClientNote(phone: string, body: string) {
  return request<{ id: number; body: string; author: string; createdAt: string }>(
    `/clients/${encodeURIComponent(phone)}/notes`,
    { method: "POST", body: JSON.stringify({ body }) }
  );
}

export function getRoster(studio: string) {
  return request<{ staff: RosterTherapist[]; hourOptions: string[] }>(
    `/roster?${scope(studio)}`
  );
}

export function updateStaffHours(
  id: string,
  hours: Record<string, [string, string]>
) {
  return request<RosterTherapist>(`/staff/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ hours }),
  });
}

export function getTreatments() {
  return request<Treatment[]>("/treatments");
}

export function updateTreatment(
  number: string,
  body: {
    dur?: number;
    price?: number;
    isActive?: boolean;
    title?: string;
    label?: string;
    description?: string;
  }
) {
  return request<Treatment>(`/treatments/${number}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function getBlocks() {
  return request<Block[]>("/blocks");
}

export function createBlock(body: {
  studio: string;
  staffId: string;
  date: string;
  from: string;
  to: string;
  reason: string;
}) {
  return request<Block>("/blocks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteBlock(id: number) {
  return request<void>(`/blocks/${id}`, { method: "DELETE" });
}

export function getReports(studio: string) {
  return request<Reports>(`/reports?${scope(studio)}`);
}

export function getInventory(params: {
  studio: string;
  tab: string;
  q: string;
}) {
  const query = new URLSearchParams({
    studio: params.studio,
    tab: params.tab,
    q: params.q,
  });

  return request<InventoryView>(`/inventory?${query}`);
}

export function adjustStock(
  id: string,
  body: { studio: string; qty: number; kind: string }
) {
  return request<{ delta: number }>(`/inventory/${id}/move`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function setPar(id: string, par: number) {
  return request<InventoryRow>(`/inventory/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ par }),
  });
}

export function orderStock(id: string, body: { studio: string; qty: number }) {
  return request<{ id: number; qty: number }>(`/inventory/${id}/order`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function receiveOrder(id: number) {
  return request<{ delta: number }>(`/inventory/orders/${id}/receive`, {
    method: "POST",
  });
}

export function cancelOrder(id: number) {
  return request<void>(`/inventory/orders/${id}`, { method: "DELETE" });
}
