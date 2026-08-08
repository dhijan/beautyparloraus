import { useCallback, useEffect, useState } from "react";

import {
  addClientNote,
  getClient,
  getClients,
  getStudioContext,
} from "../api/studioApi";
import type { ClientDetail, ClientRow } from "../api/studioApi";
import type { Studio } from "../api/bookingApi";
import StudioBar from "../components/admin/StudioBar";
import { useStudioScope } from "../lib/studioScope";
import { dLabel, money } from "../lib/booking";

function AdminClients() {
  const [studio, setStudio] = useStudioScope();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [selected, setSelected] = useState<ClientDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await getClients(studio));
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

  async function open(phone: string) {
    try {
      setSelected(await getClient(phone));
      setDraft("");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function saveNote() {
    if (!selected || !draft.trim()) return;

    try {
      const note = await addClientNote(selected.phone, draft);
      setSelected({ ...selected, notes: [note, ...selected.notes] });
      setDraft("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">Studio console</div>
          <h1>Client records</h1>
        </div>

        <StudioBar studios={studios} studio={studio} onChange={setStudio} />
      </header>

      {error && <p className="studio-error">{error}</p>}

      <div className={`studio-split ${selected ? "with-drawer" : ""}`}>
        <div className="studio-card studio-table-card">
          <div className="studio-table-head studio-client-row">
            <span>Client</span>
            <span>Mobile</span>
            <span>Visits</span>
            <span>Spend</span>
            <span>Last seen</span>
          </div>

          {loading ? (
            <p className="studio-muted studio-pad">Loading clients…</p>
          ) : rows.length === 0 ? (
            <p className="studio-muted studio-pad">
              No clients yet. They appear here after their first booking.
            </p>
          ) : (
            rows.map((c) => (
              <button
                key={c.phone}
                className={`studio-table-row studio-client-row ${selected?.phone === c.phone ? "active" : ""}`}
                onClick={() => open(c.phone)}
              >
                <span className="studio-cell-name">
                  <span className="studio-avatar sm">{c.name.slice(0, 1)}</span>
                  {c.name}
                </span>
                <span>{c.phone}</span>
                <span>{c.visits}</span>
                <span>{money(c.spend)}</span>
                <span>{c.lastSeen ? dLabel(c.lastSeen) : "—"}</span>
              </button>
            ))
          )}
        </div>

        {selected && (
          <aside className="studio-card studio-drawer">
            <div className="studio-card-head">
              <div>
                <h3>{selected.name}</h3>
                <span className="studio-eyebrow">
                  {selected.phone} · {selected.email || "no email"}
                </span>
              </div>
              <button className="studio-icon-btn" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>

            <span className="studio-eyebrow">Visit history</span>
            <div className="studio-history">
              {selected.history.slice(0, 6).map((h) => (
                <div key={h.ref}>
                  <span className={`studio-dot ${h.status}`}></span>
                  <span className="studio-history-body">
                    <span>{h.treatmentTitle}</span>
                    <span className="studio-eyebrow">
                      {dLabel(h.date)} · {h.staffName} · {h.status}
                    </span>
                  </span>
                  <span className="studio-history-price">{money(h.price)}</span>
                </div>
              ))}
            </div>

            <div className="studio-notes">
              <span className="studio-eyebrow">Therapist notes</span>

              {selected.notes.map((n) => (
                <div className="studio-note" key={n.id}>
                  <div>{n.body}</div>
                  <div className="studio-eyebrow">
                    {n.author} · {dLabel(n.createdAt.slice(0, 10))}
                  </div>
                </div>
              ))}

              <form
                className="studio-note-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveNote();
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add a note…"
                />
                <button className="studio-btn" type="submit">
                  Save
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default AdminClients;
