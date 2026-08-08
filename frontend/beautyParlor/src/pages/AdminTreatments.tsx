import { useEffect, useMemo, useState } from "react";

import { getTreatments, updateTreatment } from "../api/studioApi";
import type { Treatment } from "../api/bookingApi";

const DURATIONS = [5, 10, 15, 20, 30, 40, 45, 60, 75, 90, 120, 150];

type Patch = Partial<
  Pick<Treatment, "dur" | "price" | "isActive" | "title" | "label" | "description">
>;

function AdminTreatments() {
  const [rows, setRows] = useState<Treatment[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", label: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTreatments()
      .then(setRows)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Categories drive the filters on /services and step 1 of /book, so the
  // field suggests the ones already in use instead of inviting a typo.
  const labels = useMemo(
    () => Array.from(new Set(rows.map((r) => r.label))).sort(),
    [rows]
  );

  async function save(number: string, patch: Patch) {
    const before = rows;
    setRows(rows.map((r) => (r.number === number ? { ...r, ...patch } : r)));

    try {
      await updateTreatment(number, patch);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setRows(before);
    }
  }

  function startEdit(t: Treatment) {
    setEditing(t.number);
    setDraft({ title: t.title, label: t.label, description: t.description });
  }

  async function saveEdit(number: string) {
    if (!draft.title.trim() || !draft.label.trim()) {
      setError("Name and category cannot be empty.");
      return;
    }

    await save(number, {
      title: draft.title.trim(),
      label: draft.label.trim(),
      description: draft.description.trim(),
    });

    setEditing(null);
  }

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">Studio console</div>
          <h1>Service menu</h1>
        </div>

        <span className="studio-muted">
          One menu for both — this drives /services and the public booking flow.
        </span>
      </header>

      {error && <p className="studio-error">{error}</p>}

      <div className="studio-card studio-table-card">
        <div className="studio-table-head studio-menu-row">
          <span>Treatment</span>
          <span>Category</span>
          <span>Duration</span>
          <span>Price</span>
          <span>Status</span>
          <span></span>
        </div>

        {loading ? (
          <p className="studio-muted studio-pad">Loading the menu…</p>
        ) : (
          rows.map((t) =>
            editing === t.number ? (
              <div className="studio-table-row" key={t.number}>
                <div className="studio-field-stack" style={{ width: "100%" }}>
                  <label className="studio-field">
                    <span>Name</span>
                    <input
                      value={draft.title}
                      onChange={(e) =>
                        setDraft({ ...draft, title: e.target.value })
                      }
                    />
                  </label>

                  <label className="studio-field">
                    <span>Category</span>
                    <input
                      list="studio-menu-labels"
                      value={draft.label}
                      onChange={(e) =>
                        setDraft({ ...draft, label: e.target.value })
                      }
                    />
                  </label>

                  <label className="studio-field">
                    <span>Description shown on /services</span>
                    <textarea
                      rows={3}
                      value={draft.description}
                      onChange={(e) =>
                        setDraft({ ...draft, description: e.target.value })
                      }
                    />
                  </label>

                  <div className="studio-drawer-actions">
                    <button
                      className="studio-btn solid"
                      onClick={() => saveEdit(t.number)}
                    >
                      Save
                    </button>
                    <button
                      className="studio-btn ghost"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="studio-table-row studio-menu-row" key={t.number}>
                <span className="studio-cell-name">
                  <span className="studio-ref">{t.number}</span>
                  {t.title}
                </span>

                <span className="studio-muted">{t.label}</span>

                <select
                  value={t.dur}
                  onChange={(e) => save(t.number, { dur: Number(e.target.value) })}
                >
                  {/* A duration already set outside the list still shows. */}
                  {(DURATIONS.includes(t.dur)
                    ? DURATIONS
                    : [t.dur, ...DURATIONS]
                  ).map((d) => (
                    <option key={d} value={d}>
                      {d} min
                    </option>
                  ))}
                </select>

                <span className="studio-price">
                  <em>$</em>
                  <input
                    type="number"
                    min="0"
                    value={t.price}
                    onChange={(e) =>
                      setRows(
                        rows.map((r) =>
                          r.number === t.number
                            ? { ...r, price: Number(e.target.value) }
                            : r
                        )
                      )
                    }
                    onBlur={(e) =>
                      save(t.number, { price: Number(e.target.value) })
                    }
                  />
                </span>

                <button
                  className={`studio-status ${t.isActive ? "on" : ""}`}
                  onClick={() => save(t.number, { isActive: !t.isActive })}
                >
                  {t.isActive ? "Bookable" : "Hidden"}
                </button>

                <button className="studio-btn ghost" onClick={() => startEdit(t)}>
                  Edit
                </button>
              </div>
            )
          )
        )}
      </div>

      <datalist id="studio-menu-labels">
        {labels.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
    </div>
  );
}

export default AdminTreatments;
