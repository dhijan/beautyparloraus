import { useEffect, useState } from "react";

import { getReports, getStudioContext } from "../api/studioApi";
import type { Reports } from "../api/studioApi";
import type { Studio } from "../api/bookingApi";
import StudioBar from "../components/admin/StudioBar";
import { useStudioScope } from "../lib/studioScope";
import { money } from "../lib/booking";

/** Bar width as a share of the biggest value in the set. */
const share = (value: number, max: number) =>
  `${Math.round((value / Math.max(1, max)) * 100)}%`;

function AdminReports() {
  const [studio, setStudio] = useStudioScope();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [data, setData] = useState<Reports | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudioContext()
      .then((ctx) => setStudios(ctx.studios))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    setLoading(true);

    getReports(studio)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [studio]);

  const maxStudio = Math.max(1, ...(data?.studios.map((s) => s.revenue) || [1]));

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">Studio console</div>
          <h1>Performance</h1>
        </div>

        <StudioBar studios={studios} studio={studio} onChange={setStudio} />
      </header>

      {error && <p className="studio-error">{error}</p>}

      {loading || !data ? (
        <p className="studio-muted">Crunching the numbers…</p>
      ) : (
        <>
          <div className="studio-kpis">
            {[
              {
                label: "Completed revenue",
                value: money(data.kpis.completedRevenue),
                sub: `${data.kpis.completedCount} appointments`,
              },
              {
                label: "Booked ahead",
                value: money(data.kpis.bookedRevenue),
                sub: `${data.kpis.confirmedCount} confirmed`,
              },
              {
                label: "Average ticket",
                value: money(data.kpis.averageTicket),
                sub: "Per completed visit",
              },
              {
                label: "Cancellation rate",
                value: `${data.kpis.cancellationRate}%`,
                sub: `${data.kpis.lostCount} cancelled or declined`,
              },
            ].map((k) => (
              <div className="studio-kpi" key={k.label}>
                <div className="studio-eyebrow">{k.label}</div>
                <div className="studio-kpi-value">
                  <span>{k.value}</span>
                </div>
                <div className="studio-muted">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="studio-split even">
            <div className="studio-card">
              <span className="studio-eyebrow">Revenue by studio · last 30 days</span>

              <div className="studio-bars">
                {data.studios.map((s, index) => (
                  <div key={s.key}>
                    <div className="studio-bar-top">
                      <span>{s.name}</span>
                      <em>{money(s.revenue)}</em>
                    </div>
                    <div className="studio-bar">
                      <span
                        style={{
                          width: share(s.revenue, maxStudio),
                          background: index % 2 ? "#cba37c" : "#8a5c33",
                        }}
                      ></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="studio-card">
              <span className="studio-eyebrow">Chair utilisation · this week</span>

              <div className="studio-bars">
                {data.staff.map((s) => (
                  <div key={s.id}>
                    <div className="studio-bar-top">
                      <span>
                        {s.name} ·{" "}
                        {studios.find((x) => x.k === s.studio)?.short || s.studio}
                      </span>
                      <em className="mono">{s.utilisation}%</em>
                    </div>
                    <div className="studio-bar">
                      <span
                        style={{
                          width: `${s.utilisation}%`,
                          background: s.utilisation > 70 ? "#8a5c33" : "#96a79e",
                        }}
                      ></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="studio-card">
            <span className="studio-eyebrow">Top treatments by revenue</span>

            <div className="studio-top-grid">
              {data.treatments.map((t) => (
                <div key={t.number}>
                  <span className="studio-ref">{t.number}</span>
                  <span className="studio-top-body">
                    <span>{t.title}</span>
                    <span className="studio-eyebrow">{t.bookings} booked</span>
                  </span>
                  <span className="studio-top-value">{money(t.revenue)}</span>
                </div>
              ))}

              {data.treatments.length === 0 && (
                <p className="studio-muted">No completed bookings yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminReports;
