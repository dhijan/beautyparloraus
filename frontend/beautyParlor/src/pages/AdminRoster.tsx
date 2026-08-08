import { useCallback, useEffect, useState } from "react";

import { getRoster, getStudioContext, updateStaffHours } from "../api/studioApi";
import type { RosterTherapist } from "../api/studioApi";
import type { Studio } from "../api/bookingApi";
import StudioBar from "../components/admin/StudioBar";
import { useStudioScope } from "../lib/studioScope";
import { WD, t12 } from "../lib/booking";

/** Monday first — how a roster is actually read. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_SHIFT: [string, string] = ["9:30", "17:30"];

/** The shift to fall back on when switching a day back on. */
const baseShift = (staff: RosterTherapist): [string, string] => {
  const firstOn = WEEK.find((d) => staff.hours[String(d)]);
  return firstOn === undefined ? DEFAULT_SHIFT : staff.hours[String(firstOn)];
};

function AdminRoster() {
  const [studio, setStudio] = useStudioScope();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [staff, setStaff] = useState<RosterTherapist[]>([]);
  const [hourOptions, setHourOptions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getRoster(studio);
      setStaff(data.staff);
      setHourOptions(data.hourOptions);
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

  async function save(id: string, hours: Record<string, [string, string]>) {
    // Optimistic: the grid is a lot of small toggles and waiting on each one
    // makes the roster feel broken.
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, hours } : s)));

    try {
      await updateStaffHours(id, hours);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      await load();
    }
  }

  function toggleDay(s: RosterTherapist, day: number) {
    const hours = { ...s.hours };

    if (hours[String(day)]) delete hours[String(day)];
    else hours[String(day)] = baseShift(s);

    save(s.id, hours);
  }

  /** The editor sets one span across every working day, as the design does. */
  function setSpan(s: RosterTherapist, index: 0 | 1, value: string) {
    const hours: Record<string, [string, string]> = {};

    Object.entries(s.hours).forEach(([day, span]) => {
      hours[day] = index === 0 ? [value, span[1]] : [span[0], value];
    });

    const bad = Object.values(hours).find(
      (span) => Number(span[0].replace(":", ".")) >= Number(span[1].replace(":", "."))
    );

    if (bad) {
      setError("A shift has to finish after it starts.");
      return;
    }

    save(s.id, hours);
  }

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">Studio console</div>
          <h1>Staff roster</h1>
        </div>

        <StudioBar studios={studios} studio={studio} onChange={setStudio} />
      </header>

      {error && <p className="studio-error">{error}</p>}

      <div className="studio-stack">
        {loading ? (
          <p className="studio-muted">Loading the roster…</p>
        ) : (
          staff.map((s) => {
            const span = baseShift(s);

            return (
              <div className="studio-card studio-roster-row" key={s.id}>
                <div className="studio-cell-name">
                  <span className="studio-avatar">{s.name.slice(0, 1)}</span>
                  <span>
                    <strong>{s.name}</strong>
                    <span className="studio-eyebrow">
                      {s.role} ·{" "}
                      {studios.find((x) => x.k === s.studio)?.short || s.studio}
                    </span>
                  </span>
                </div>

                <div className="studio-week">
                  {WEEK.map((day) => {
                    const shift = s.hours[String(day)];

                    return (
                      <button
                        key={day}
                        className={`studio-day-toggle ${shift ? "on" : ""}`}
                        onClick={() => toggleDay(s, day)}
                      >
                        <span>{WD[day]}</span>
                        <span>
                          {shift
                            ? `${shift[0].split(":")[0]}–${shift[1].split(":")[0]}`
                            : "Off"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="studio-span">
                  <select
                    value={span[0]}
                    onChange={(e) => setSpan(s, 0, e.target.value)}
                  >
                    {hourOptions.map((h) => (
                      <option key={h} value={h}>
                        {t12(h)}
                      </option>
                    ))}
                  </select>

                  <span className="studio-muted">to</span>

                  <select
                    value={span[1]}
                    onChange={(e) => setSpan(s, 1, e.target.value)}
                  >
                    {hourOptions.map((h) => (
                      <option key={h} value={h}>
                        {t12(h)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminRoster;
