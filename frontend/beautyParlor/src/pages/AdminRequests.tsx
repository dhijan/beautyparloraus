import { useCallback, useEffect, useState } from "react";

import { getRequests, getStudioContext, updateBooking } from "../api/studioApi";
import type { RequestRow } from "../api/studioApi";
import type { Studio } from "../api/bookingApi";
import StudioBar from "../components/admin/StudioBar";
import { useStudioScope } from "../lib/studioScope";
import { dLabel, money, t12 } from "../lib/booking";

/** Minutes since the request landed, in words. */
function ago(createdAt: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / (60 * 24))} d ago`;
}

function AdminRequests() {
  const [studio, setStudio] = useStudioScope();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await getRequests(studio));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [studio]);

  useEffect(() => {
    getStudioContext()
      .then((ctx) => setStudios(ctx.studios))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(ref: string, status: "confirmed" | "declined") {
    try {
      await updateBooking(ref, { status });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">Studio console</div>
          <h1>Booking requests</h1>
        </div>

        <StudioBar studios={studios} studio={studio} onChange={setStudio} />
      </header>

      {error && <p className="studio-error">{error}</p>}

      <div className="studio-stack">
        {loading ? (
          <p className="studio-muted">Loading requests…</p>
        ) : rows.length === 0 ? (
          <div className="studio-card studio-empty">
            <h3>Inbox clear</h3>
            <p>Every request has been actioned. New online bookings land here first.</p>
          </div>
        ) : (
          rows.map((r) => (
            <div className="studio-card studio-request" key={r.ref}>
              <span className="studio-avatar">{r.name.slice(0, 1)}</span>

              <div className="studio-request-body">
                <div className="studio-request-top">
                  <strong>{r.name}</strong>
                  <span className="studio-ref">{r.ref}</span>
                  <span className="studio-eyebrow">{ago(r.createdAt)}</span>
                </div>

                <div className="studio-muted">
                  {r.treatmentTitle} · {dLabel(r.date)} at {t12(r.time)} ·{" "}
                  {r.staffName} · {money(r.price)}
                </div>
              </div>

              <div className="studio-request-actions">
                <button
                  className="studio-btn solid"
                  onClick={() => decide(r.ref, "confirmed")}
                >
                  Approve
                </button>
                <button
                  className="studio-btn danger"
                  onClick={() => decide(r.ref, "declined")}
                >
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminRequests;
