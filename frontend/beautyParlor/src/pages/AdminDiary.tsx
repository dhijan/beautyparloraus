import { useCallback, useEffect, useState } from "react";

import {
  createWalkIn,
  getBookingDetail,
  getDayView,
  getStudioContext,
  updateBooking,
} from "../api/studioApi";
import type { DayView } from "../api/studioApi";
import type { Booking, Studio, Treatment } from "../api/bookingApi";
import StudioBar from "../components/admin/StudioBar";
import { useStudioScope } from "../lib/studioScope";
import QrScanner from "../components/admin/QrScanner";
import { STATUS_LABEL, dLabel, isoDate, m2t, money, nextDays, t12, t2m } from "../lib/booking";

/** Pixel height of one half-hour row in the calendar. */
const CELL = 38;
const GRID_START = 9 * 60;

const topFor = (time: string) => ((t2m(time) - GRID_START) / 30) * CELL;
const heightFor = (dur: number) => Math.max(CELL, (dur / 30) * CELL) - 3;

function AdminDiary() {
  const [studio, setStudio] = useStudioScope();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  const [date, setDate] = useState(isoDate(new Date()));
  const [day, setDay] = useState<DayView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<Booking | null>(null);
  const [moveDate, setMoveDate] = useState("");
  const [moveTime, setMoveTime] = useState("");

  const [scanning, setScanning] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [walkIn, setWalkIn] = useState({
    studio: "R",
    treatment: "01",
    staffId: "",
    date: isoDate(new Date()),
    time: "10:00",
    name: "",
    phone: "",
  });
  const [walkInNotice, setWalkInNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setDay(await getDayView(date, studio));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [date, studio]);

  useEffect(() => {
    getStudioContext()
      .then((ctx) => {
        setStudios(ctx.studios);
        setTreatments(ctx.treatments);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function shiftDay(days: number) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + days);
    setDate(isoDate(d));
    setSelected(null);
  }

  function openBooking(booking: Booking) {
    setSelected(booking);
    setMoveDate(booking.date);
    setMoveTime(booking.time);
  }

  async function act(ref: string, body: Parameters<typeof updateBooking>[1]) {
    try {
      const updated = await updateBooking(ref, body);
      setSelected(updated.status === "declined" ? null : updated);
      setError("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onScan(ref: string) {
    setScanning(false);

    try {
      const detail = await getBookingDetail(ref);
      setDate(detail.booking.date);
      openBooking(detail.booking);
      setError("");
    } catch (e) {
      setError(`${ref}: ${(e as Error).message}`);
    }
  }

  async function submitWalkIn() {
    try {
      const created = await createWalkIn(walkIn);
      setWalkInNotice(
        `Booked ${created.name} — ${created.ref} · ${dLabel(created.date)} ${t12(created.time)}`
      );
      setDate(created.date);
      await load();
    } catch (e) {
      setWalkInNotice((e as Error).message);
    }
  }

  const today = isoDate(new Date());
  const times = day?.times || [];
  const staff = day?.staff || [];

  const actionsFor = (booking: Booking) => {
    if (booking.status === "pending") {
      return [
        { label: "Approve", status: "confirmed", tone: "solid" },
        { label: "Decline", status: "declined", tone: "danger" },
      ];
    }

    if (booking.status === "confirmed") {
      return [
        { label: "Mark complete", status: "completed", tone: "solid" },
        { label: "Cancel", status: "cancelled", tone: "danger" },
      ];
    }

    return [{ label: "Reopen", status: "confirmed", tone: "ghost" }];
  };

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">
            Studio console ·{" "}
            {studio === "all"
              ? "All studios"
              : studios.find((s) => s.k === studio)?.short || studio}
          </div>
          <h1>Today at a glance</h1>
        </div>

        <div className="studio-head-actions">
          <StudioBar studios={studios} studio={studio} onChange={setStudio} />

          <button className="studio-btn ghost" onClick={() => setScanning(!scanning)}>
            {scanning ? "Close scanner" : "Scan pass"}
          </button>

          <button
            className="studio-btn"
            onClick={() => {
              setNewOpen(!newOpen);
              setWalkInNotice("");
            }}
          >
            {newOpen ? "Close" : "＋ New booking"}
          </button>
        </div>
      </header>

      {error && <p className="studio-error">{error}</p>}

      {scanning && <QrScanner onScan={onScan} onClose={() => setScanning(false)} />}

      {newOpen && (
        <div className="studio-card studio-walkin">
          <div className="studio-card-head">
            <span className="studio-eyebrow">Walk-in / phone booking</span>
            <span className="studio-muted">Confirmed instantly, no deposit taken</span>
          </div>

          <div className="studio-field-grid">
            <label className="studio-field">
              <span>Studio</span>
              <select
                value={walkIn.studio}
                onChange={(e) =>
                  setWalkIn({ ...walkIn, studio: e.target.value, staffId: "" })
                }
              >
                {studios.map((s) => (
                  <option key={s.k} value={s.k}>
                    {s.short}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>Treatment</span>
              <select
                value={walkIn.treatment}
                onChange={(e) => setWalkIn({ ...walkIn, treatment: e.target.value })}
              >
                {treatments.map((t) => (
                  <option key={t.number} value={t.number}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>Therapist</span>
              <select
                value={walkIn.staffId}
                onChange={(e) => setWalkIn({ ...walkIn, staffId: e.target.value })}
              >
                <option value="">First on the floor</option>
                {staff
                  .filter((s) => s.studio === walkIn.studio)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="studio-field">
              <span>Date</span>
              <select
                value={walkIn.date}
                onChange={(e) => setWalkIn({ ...walkIn, date: e.target.value })}
              >
                {nextDays(14).map((d) => (
                  <option key={d} value={d}>
                    {dLabel(d)}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>Time</span>
              <select
                value={walkIn.time}
                onChange={(e) => setWalkIn({ ...walkIn, time: e.target.value })}
              >
                {times.map((t) => (
                  <option key={t} value={t}>
                    {t12(t)}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>Client name</span>
              <input
                value={walkIn.name}
                onChange={(e) => setWalkIn({ ...walkIn, name: e.target.value })}
                placeholder="Walk-in guest"
              />
            </label>

            <label className="studio-field">
              <span>Mobile</span>
              <input
                value={walkIn.phone}
                onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })}
                placeholder="0412 000 000"
              />
            </label>
          </div>

          <div className="studio-card-foot">
            <button className="studio-btn" onClick={submitWalkIn}>
              Create booking
            </button>
            <span className="studio-muted">{walkInNotice}</span>
          </div>
        </div>
      )}

      {day && (
        <div className="studio-kpis">
          {[
            {
              label: "Bookings",
              value: String(day.kpis.bookings),
              delta: day.kpis.pendingToday
                ? `${day.kpis.pendingToday} pending`
                : "",
              sub: date === today ? "Today" : dLabel(date),
            },
            {
              label: "Expected revenue",
              value: money(day.kpis.revenue),
              delta: "",
              sub: "Confirmed only",
            },
            {
              label: "Chair utilisation",
              value: `${day.kpis.utilisation}%`,
              delta: "",
              sub: `${day.kpis.therapists} therapists on floor`,
            },
            {
              label: "Awaiting action",
              value: String(day.kpis.awaiting),
              delta: "",
              sub: "Across all dates",
            },
          ].map((k) => (
            <div className="studio-kpi" key={k.label}>
              <div className="studio-eyebrow">{k.label}</div>
              <div className="studio-kpi-value">
                <span>{k.value}</span>
                {k.delta && <em>{k.delta}</em>}
              </div>
              <div className="studio-muted">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className={`studio-split ${selected ? "with-drawer" : ""}`}>
        <div className="studio-card">
          <div className="studio-card-head">
            <div className="studio-daynav">
              <button className="studio-icon-btn" onClick={() => shiftDay(-1)}>
                ‹
              </button>
              <span className="studio-day">
                {date === today ? `Today · ${dLabel(date)}` : dLabel(date)}
              </span>
              <button className="studio-icon-btn" onClick={() => shiftDay(1)}>
                ›
              </button>
              <button className="studio-chip" onClick={() => setDate(today)}>
                Today
              </button>
            </div>
            <span className="studio-eyebrow">Drag a card to reschedule</span>
          </div>

          {loading ? (
            <p className="studio-muted">Loading the diary…</p>
          ) : staff.length === 0 ? (
            <p className="studio-muted">No therapists rostered at this studio.</p>
          ) : (
            <div className="studio-cal">
              <div className="studio-cal-times">
                {times.map((t) => (
                  <div key={t}>{t12(t)}</div>
                ))}
              </div>

              {staff.map((column) => (
                <div className="studio-cal-col" key={column.id}>
                  <div className="studio-cal-colhead">
                    <span>{column.name}</span>
                    <span className="studio-eyebrow">
                      {studios.find((s) => s.k === column.studio)?.short ||
                        column.studio}
                    </span>
                  </div>

                  <div className="studio-cal-body">
                    {times.map((t) => (
                      <div
                        key={t}
                        className="studio-cal-cell"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const ref = e.dataTransfer.getData("text/plain");
                          if (ref) act(ref, { date, time: t, staffId: column.id });
                        }}
                        onClick={() => {
                          setNewOpen(true);
                          setWalkIn({
                            ...walkIn,
                            studio: column.studio,
                            staffId: column.id,
                            date,
                            time: t,
                          });
                        }}
                      ></div>
                    ))}

                    {day?.bookings
                      .filter((b) => b.staffId === column.id)
                      .map((b) => (
                        <div
                          key={b.ref}
                          className={`studio-chip-booking ${b.status}`}
                          style={{
                            top: topFor(b.time),
                            height: heightFor(b.dur),
                          }}
                          draggable
                          onDragStart={(e) =>
                            e.dataTransfer.setData("text/plain", b.ref)
                          }
                          onClick={() => openBooking(b)}
                        >
                          <strong>{b.name}</strong>
                          <span>
                            {treatments.find((t) => t.number === b.treatment)
                              ?.title || ""}
                          </span>
                          <span>
                            {t12(b.time)}–{t12(m2t(t2m(b.time) + b.dur))}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <aside className="studio-card studio-drawer">
            <div className="studio-card-head">
              <div>
                <span className={`studio-badge ${selected.status}`}>
                  {STATUS_LABEL[selected.status]}
                </span>
                <h3>{selected.name}</h3>
              </div>
              <button className="studio-icon-btn" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>

            <dl className="studio-rows">
              {[
                {
                  k: "Treatment",
                  v: `${treatments.find((t) => t.number === selected.treatment)?.title || ""} · ${selected.dur} min`,
                },
                {
                  k: "Therapist",
                  v: staff.find((s) => s.id === selected.staffId)?.name || "",
                },
                {
                  k: "Studio",
                  v:
                    studios.find((s) => s.k === selected.studio)?.short ||
                    selected.studio,
                },
                { k: "When", v: `${dLabel(selected.date)} · ${t12(selected.time)}` },
                { k: "Mobile", v: selected.phone },
                { k: "Reference", v: selected.ref },
                {
                  k: "Payment",
                  v: `${selected.paid ? `${money(selected.deposit)} deposit paid` : "Unpaid"} · ${money(selected.price)} total`,
                },
                {
                  k: "Channel",
                  v: selected.channel === "phone" ? "Phone / walk-in" : "Online booking",
                },
              ].map((row) => (
                <div key={row.k}>
                  <dt>{row.k}</dt>
                  <dd>{row.v}</dd>
                </div>
              ))}
            </dl>

            {selected.notes && (
              <p className="studio-note">“{selected.notes}”</p>
            )}

            <div className="studio-drawer-actions">
              {actionsFor(selected).map((a) => (
                <button
                  key={a.label}
                  className={`studio-btn ${a.tone}`}
                  onClick={() => act(selected.ref, { status: a.status })}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <div className="studio-drawer-move">
              <span className="studio-eyebrow">Move to</span>

              <div className="studio-move-row">
                <select value={moveDate} onChange={(e) => setMoveDate(e.target.value)}>
                  {nextDays(14).map((d) => (
                    <option key={d} value={d}>
                      {dLabel(d)}
                    </option>
                  ))}
                </select>

                <select value={moveTime} onChange={(e) => setMoveTime(e.target.value)}>
                  {times.map((t) => (
                    <option key={t} value={t}>
                      {t12(t)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="studio-btn ghost full"
                onClick={() =>
                  act(selected.ref, { date: moveDate, time: moveTime })
                }
              >
                Apply move
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default AdminDiary;
