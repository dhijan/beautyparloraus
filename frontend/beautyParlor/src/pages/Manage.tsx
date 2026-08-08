import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  cancelBooking,
  findBooking,
  getMoveSlots,
  moveBooking,
} from "../api/bookingApi";
import type { BookingDetail, Slot } from "../api/bookingApi";
import { STATUS_LABEL, dLabel, money, nextDays, t12 } from "../lib/booking";
import QrPass from "../components/QrPass";

function Manage() {
  const [params] = useSearchParams();
  const initialRef = (params.get("ref") || "").toUpperCase();

  const [code, setCode] = useState(initialRef);
  const [found, setFound] = useState<BookingDetail | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);

  const booking = found?.booking || null;
  const active = booking?.status === "pending" || booking?.status === "confirmed";
  const dateOptions = nextDays(14);

  async function lookup(ref: string) {
    if (!ref.trim()) return;

    setBusy(true);
    setNotice("");

    try {
      const detail = await findBooking(ref);
      setFound(detail);
      setDate(detail.booking.date);
      setTime(detail.booking.time);
      setError("");
    } catch (e) {
      setFound(null);
      setError(
        `${(e as Error).message} Check the code on your confirmation, or call the studio.`
      );
    } finally {
      setBusy(false);
    }
  }

  // Deep link from the confirmation screen and the QR pass.
  useEffect(() => {
    if (initialRef) lookup(initialRef);

  }, [initialRef]);

  // Which times are still free on the chosen day, for this therapist.
  useEffect(() => {
    if (!booking || !active || !date) {
      setSlots([]);
      return;
    }

    let live = true;

    getMoveSlots(booking.ref, date)
      .then((data) => {
        if (live) setSlots(data.slots.filter((s) => s.ok || s.time === booking.time));
      })
      .catch(() => {
        if (live) setSlots([]);
      });

    return () => {
      live = false;
    };
  }, [booking, active, date]);

  // Changing the day can strip the chosen time out of the list — fall back to
  // the first slot still open rather than submitting an empty select.
  const resolvedTime = slots.some((s) => s.time === time)
    ? time
    : slots[0]?.time || "";

  async function reschedule() {
    if (!booking || !resolvedTime) return;

    setBusy(true);

    try {
      const moved = await moveBooking(booking.ref, date, resolvedTime);
      setFound({ ...found!, booking: moved });
      setError("");
      setNotice(
        `Moved to ${dLabel(moved.date)} at ${t12(moved.time)}. A new confirmation is on its way.`
      );
    } catch (e) {
      setNotice("");
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!booking) return;

    setBusy(true);

    try {
      const cancelled = await cancelBooking(booking.ref);
      setFound({ ...found!, booking: cancelled });
      setError("");
      setNotice("Appointment cancelled. We hope to see you soon.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const badgeClass =
    booking?.status === "confirmed"
      ? "ok"
      : booking?.status === "cancelled" || booking?.status === "declined"
        ? "off"
        : "";

  return (
    <main className="bbh-page bbh-mg">
      <Link to="/" className="bbh-back">
        ← Back home
      </Link>

      <h1 className="bbh-display bbh-h1 bbh-fade-up" style={{ marginTop: 18 }}>
        Manage your <em>booking</em>
      </h1>

      <p className="bbh-lede" style={{ maxWidth: 520, marginTop: 16 }}>
        Enter the reference code from your confirmation to move or cancel your
        appointment. Free changes up to 24 hours before.
      </p>

      <form
        className="bbh-mg-lookup"
        onSubmit={(e) => {
          e.preventDefault();
          lookup(code);
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="BBH-XXXXX"
          aria-label="Booking reference"
        />
        <button type="submit" disabled={busy}>
          {busy ? "Looking…" : "Find booking"}
        </button>
      </form>

      {error && <p className="bbh-mg-error">{error}</p>}

      {booking && (
        <div className="bbh-mg-card">
          <div className="bbh-mg-head">
            <div>
              <span className={`bbh-mg-badge ${badgeClass}`}>
                {STATUS_LABEL[booking.status]}
              </span>

              <h2>
                {found?.treatment?.title} · {dLabel(booking.date)} at{" "}
                {t12(booking.time)}
              </h2>

              <p>
                {found?.therapist?.name} at {found?.studio?.short} · {booking.name}
              </p>
            </div>

            <div className="bbh-mg-ref">
              <div className="lbl">Reference</div>
              <div className="code">{booking.ref}</div>
            </div>
          </div>

          {active && (
            <>
              <div className="bbh-mg-move">
                <span className="bbh-meta">Move it</span>

                <div className="row">
                  <label className="bbh-bk-field">
                    <span style={{ fontSize: 12.5, color: "rgba(23,20,15,.5)" }}>
                      New date
                    </span>
                    <select
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setNotice("");
                      }}
                    >
                      {dateOptions.map((d) => (
                        <option key={d} value={d}>
                          {dLabel(d)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="bbh-bk-field">
                    <span style={{ fontSize: 12.5, color: "rgba(23,20,15,.5)" }}>
                      New time
                    </span>
                    <select
                      value={resolvedTime}
                      onChange={(e) => {
                        setTime(e.target.value);
                        setNotice("");
                      }}
                    >
                      {slots.map((s) => (
                        <option key={s.time} value={s.time}>
                          {t12(s.time)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button onClick={reschedule} disabled={busy || !resolvedTime}>
                    Reschedule
                  </button>
                </div>

                <div className="bbh-mg-cancel">
                  <p>
                    Cancelling inside 24 hours forfeits the{" "}
                    {money(booking.deposit)} deposit. Outside that window it is
                    refunded to the same card within three business days.
                  </p>

                  <button onClick={cancel} disabled={busy}>
                    Cancel appointment
                  </button>
                </div>
              </div>

              <div className="bbh-mg-pass">
                <QrPass reference={booking.ref} caption="Scan at reception" />
              </div>
            </>
          )}

          {notice && <p className="bbh-mg-notice">{notice}</p>}
        </div>
      )}
    </main>
  );
}

export default Manage;
