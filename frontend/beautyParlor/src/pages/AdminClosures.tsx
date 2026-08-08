import { useEffect, useState } from "react";

import {
  createBlock,
  deleteBlock,
  getBlocks,
  getStudioContext,
} from "../api/studioApi";
import type { Block, RosterTherapist } from "../api/studioApi";
import type { Studio } from "../api/bookingApi";
import { dLabel, isoDate, nextDays, t12 } from "../lib/booking";

const HOURS = (() => {
  const out: string[] = [];
  for (let m = 7 * 60; m <= 21 * 60; m += 30) {
    out.push(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
})();

function AdminClosures() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [staff, setStaff] = useState<RosterTherapist[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState({
    studio: "all",
    staffId: "all",
    date: isoDate(new Date()),
    from: "13:00",
    to: "15:00",
    reason: "",
  });

  async function load() {
    try {
      setBlocks(await getBlocks());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getStudioContext()
      .then((ctx) => {
        setStudios(ctx.studios);
        setStaff(ctx.staff);
      })
      .catch((e: Error) => setError(e.message));

    load();
  }, []);

  async function add() {
    try {
      await createBlock(draft);
      setDraft({ ...draft, reason: "" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: number) {
    try {
      await deleteBlock(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const labelFor = (block: Block) =>
    [
      dLabel(block.date),
      `${t12(block.from)}–${t12(block.to)}`,
      block.studio === "all"
        ? "All studios"
        : studios.find((s) => s.k === block.studio)?.short || block.studio,
      block.staffId === "all"
        ? "Everyone"
        : staff.find((s) => s.id === block.staffId)?.name || block.staffId,
    ].join(" · ");

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">Studio console</div>
          <h1>Closures &amp; blocked time</h1>
        </div>

        <span className="studio-muted">
          Blocked time disappears from the public booking flow immediately.
        </span>
      </header>

      {error && <p className="studio-error">{error}</p>}

      <div className="studio-split narrow-left">
        <div className="studio-card">
          <span className="studio-eyebrow">Add a closure</span>

          <div className="studio-field-stack">
            <label className="studio-field">
              <span>Studio</span>
              <select
                value={draft.studio}
                onChange={(e) => setDraft({ ...draft, studio: e.target.value })}
              >
                <option value="all">All studios</option>
                {studios.map((s) => (
                  <option key={s.k} value={s.k}>
                    {s.short}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>Therapist</span>
              <select
                value={draft.staffId}
                onChange={(e) => setDraft({ ...draft, staffId: e.target.value })}
              >
                <option value="all">Everyone</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>Date</span>
              <select
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              >
                {nextDays(30).map((d) => (
                  <option key={d} value={d}>
                    {dLabel(d)}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>From</span>
              <select
                value={draft.from}
                onChange={(e) => setDraft({ ...draft, from: e.target.value })}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {t12(h)}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>To</span>
              <select
                value={draft.to}
                onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {t12(h)}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>Reason</span>
              <input
                value={draft.reason}
                onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
                placeholder="Training, stocktake, public holiday…"
              />
            </label>

            <button className="studio-btn full" onClick={add}>
              Block this time
            </button>
          </div>
        </div>

        <div className="studio-stack">
          {loading ? (
            <p className="studio-muted">Loading closures…</p>
          ) : blocks.length === 0 ? (
            <div className="studio-card studio-empty">
              <h3>Nothing blocked</h3>
              <p>Every chair is open for the next fortnight.</p>
            </div>
          ) : (
            blocks.map((b) => (
              <div className="studio-card studio-block-row" key={b.id}>
                <span className="studio-mark">◷</span>

                <div>
                  <strong>{b.reason}</strong>
                  <div className="studio-eyebrow">{labelFor(b)}</div>
                </div>

                <button className="studio-btn ghost" onClick={() => remove(b.id)}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminClosures;
