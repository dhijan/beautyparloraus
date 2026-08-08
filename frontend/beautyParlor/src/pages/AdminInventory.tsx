import { useCallback, useEffect, useState } from "react";

import {
  adjustStock,
  cancelOrder,
  getInventory,
  getStudioContext,
  orderStock,
  receiveOrder,
  setPar,
} from "../api/studioApi";
import type { InventoryView } from "../api/studioApi";
import type { Studio } from "../api/bookingApi";
import StudioBar from "../components/admin/StudioBar";
import { useStudioScope } from "../lib/studioScope";
import { dLabel, money } from "../lib/booking";

const TABS = [
  ["all", "All items"],
  ["retail", "Retail"],
  ["back", "Back bar"],
  ["low", "Needs attention"],
] as const;

const KINDS = [
  ["receive", "Receive"],
  ["sale", "Sale"],
  ["usage", "Used"],
  ["wastage", "Wastage"],
  ["count", "Count"],
] as const;

const KIND_LABEL: Record<string, string> = {
  receive: "Received",
  sale: "Sold",
  usage: "Used in service",
  wastage: "Wastage",
  count: "Stocktake",
};

function AdminInventory() {
  const [studio, setStudio] = useStudioScope();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [tab, setTab] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<InventoryView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const [move, setMove] = useState({ kind: "receive", itemId: "", studio: "R", qty: "6" });

  const load = useCallback(async () => {
    try {
      const view = await getInventory({ studio, tab, q: query });
      setData(view);
      setMove((m) => ({ ...m, itemId: m.itemId || view.rows[0]?.id || "" }));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [studio, tab, query]);

  useEffect(() => {
    getStudioContext()
      .then((ctx) => setStudios(ctx.studios))
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // With "All studios" selected there is no single shelf to add to, so the
  // movement form asks which one.
  const oneStudio = studio !== "all";
  const target = oneStudio ? studio : move.studio;

  async function run(action: () => Promise<unknown>, message?: string) {
    try {
      await action();
      setNotice(message || "");
      setError("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function applyMove() {
    const qty = Math.abs(Math.round(Number(move.qty)));

    if (!move.itemId || (!qty && move.kind !== "count")) {
      setNotice("Enter a quantity first.");
      return;
    }

    const signed = move.kind === "receive" || move.kind === "count" ? qty : -qty;
    const item = data?.rows.find((r) => r.id === move.itemId);

    await run(
      () => adjustStock(move.itemId, { studio: target, qty: signed, kind: move.kind }),
      `${KIND_LABEL[move.kind]} · ${item?.name || "item"} at ${
        studios.find((s) => s.k === target)?.short || target
      }.`
    );
  }

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">Studio console</div>
          <h1>Stock &amp; inventory</h1>
        </div>

        <StudioBar studios={studios} studio={studio} onChange={setStudio} />
      </header>

      {error && <p className="studio-error">{error}</p>}

      {data && (
        <div className="studio-kpis">
          {[
            {
              label: "Items tracked",
              value: String(data.kpis.tracked),
              sub: oneStudio
                ? studios.find((s) => s.k === studio)?.short || studio
                : "All studios",
            },
            {
              label: "Needs reordering",
              value: String(data.kpis.needing),
              sub: `${data.kpis.out} out of stock`,
              warn: data.kpis.needing > 0,
            },
            {
              label: "Stock at cost",
              value: money(data.kpis.atCost),
              sub: "Retail + back bar",
            },
            {
              label: "On order",
              value: String(data.kpis.onOrder),
              sub: `${data.kpis.openOrders} open purchase orders`,
            },
          ].map((k) => (
            <div className="studio-kpi" key={k.label}>
              <div className="studio-eyebrow">{k.label}</div>
              <div className={`studio-kpi-value ${k.warn ? "warn" : ""}`}>
                <span>{k.value}</span>
              </div>
              <div className="studio-muted">{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="studio-card studio-toolbar">
        <div className="studio-pills">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          className="studio-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search item or SKU"
        />
      </div>

      <div className="studio-card studio-table-card scroll-x">
        <div className="studio-table-head studio-inv-row">
          <span>Item</span>
          <span>Type</span>
          <span>On hand</span>
          <span>Par</span>
          <span>At cost</span>
          <span>Status</span>
          <span>Reorder</span>
        </div>

        {loading ? (
          <p className="studio-muted studio-pad">Counting the shelves…</p>
        ) : data?.rows.length === 0 ? (
          <p className="studio-muted studio-pad">Nothing matches that filter.</p>
        ) : (
          data?.rows.map((r) => (
            <div className="studio-table-row studio-inv-row" key={r.id}>
              <span className="studio-cell-stack">
                <span>{r.name}</span>
                <span className="studio-eyebrow">
                  {r.sku} · {r.unit} · {r.supplier}
                </span>
              </span>

              <span className="studio-muted">{r.cat}</span>

              {oneStudio ? (
                <span className="studio-stepper">
                  <button
                    onClick={() =>
                      run(() =>
                        adjustStock(r.id, { studio, qty: -1, kind: "count" })
                      )
                    }
                  >
                    −
                  </button>
                  <em>{r.onHand}</em>
                  <button
                    onClick={() =>
                      run(() => adjustStock(r.id, { studio, qty: 1, kind: "count" }))
                    }
                  >
                    ＋
                  </button>
                  {r.onOrder > 0 && (
                    <span className="studio-eyebrow">+{r.onOrder} in</span>
                  )}
                </span>
              ) : (
                <span className="studio-split-stock">
                  <em>{r.onHand}</em>
                  {r.split.map((s) => (
                    <span key={s.key} className={s.low ? "low" : ""}>
                      {s.key} {s.qty}
                    </span>
                  ))}
                </span>
              )}

              <input
                className="studio-par"
                type="number"
                min="0"
                defaultValue={r.par}
                onBlur={(e) => {
                  const par = Number(e.target.value);
                  if (par !== r.par) run(() => setPar(r.id, par));
                }}
              />

              <span className="mono">{money(r.atCost)}</span>

              <span className={`studio-stock-state ${r.state}`}>
                {r.state === "ok" ? "In stock" : r.state === "low" ? "Low" : "Out"}
              </span>

              <button
                className={`studio-reorder ${r.state === "ok" ? "" : "urgent"}`}
                onClick={() =>
                  run(
                    () => orderStock(r.id, { studio: target, qty: r.suggested }),
                    `${r.suggested} units ordered for ${
                      studios.find((s) => s.k === target)?.short || target
                    }.`
                  )
                }
              >
                {r.state === "ok" ? "Order" : "Reorder"} {r.suggested}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="studio-split narrow-left">
        <div className="studio-card">
          <span className="studio-eyebrow">Log a stock movement</span>

          <div className="studio-pills tight">
            {KINDS.map(([key, label]) => (
              <button
                key={key}
                className={move.kind === key ? "active" : ""}
                onClick={() => {
                  setMove({ ...move, kind: key });
                  setNotice("");
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="studio-field-stack">
            <label className="studio-field">
              <span>Item</span>
              <select
                value={move.itemId}
                onChange={(e) => setMove({ ...move, itemId: e.target.value })}
              >
                {data?.rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>Studio</span>
              <select
                value={target}
                disabled={oneStudio}
                onChange={(e) => setMove({ ...move, studio: e.target.value })}
              >
                {studios.map((s) => (
                  <option key={s.k} value={s.k}>
                    {s.short}
                  </option>
                ))}
              </select>
            </label>

            <label className="studio-field">
              <span>{move.kind === "count" ? "Counted on hand" : "Quantity"}</span>
              <input
                type="number"
                min="0"
                value={move.qty}
                onChange={(e) => setMove({ ...move, qty: e.target.value })}
              />
            </label>

            <button className="studio-btn full" onClick={applyMove}>
              {move.kind === "count"
                ? "Set counted quantity"
                : move.kind === "receive"
                  ? "Add to stock"
                  : "Deduct from stock"}
            </button>

            <span className="studio-muted">{notice}</span>
          </div>
        </div>

        <div className="studio-stack">
          <div className="studio-card">
            <div className="studio-card-head">
              <span className="studio-eyebrow">Purchase orders</span>
              <span className="studio-muted">
                {data?.kpis.openOrders
                  ? `${data.kpis.openOrders} awaiting delivery`
                  : "Nothing on the way"}
              </span>
            </div>

            <div className="studio-order-list">
              {data?.orders.length === 0 && (
                <p className="studio-muted">
                  No open orders. Hit reorder on any low line above.
                </p>
              )}

              {data?.orders.map((o) => (
                <div className="studio-order" key={o.id}>
                  <span className="studio-mark">
                    {o.status === "ordered" ? "◷" : "✓"}
                  </span>

                  <div>
                    <strong>
                      {o.qty} × {o.itemName}
                    </strong>
                    <div className="studio-eyebrow">
                      {studios.find((s) => s.k === o.studio)?.short || o.studio} ·{" "}
                      {o.supplier} · {money(o.value)}
                      {o.eta ? ` · eta ${dLabel(o.eta)}` : ""}
                    </div>
                  </div>

                  {o.status === "ordered" ? (
                    <div className="studio-order-actions">
                      <button
                        className="studio-btn solid"
                        onClick={() => run(() => receiveOrder(o.id))}
                      >
                        Receive
                      </button>
                      <button
                        className="studio-btn ghost"
                        onClick={() => run(() => cancelOrder(o.id))}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="studio-stock-state ok">Received</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="studio-card">
            <span className="studio-eyebrow">Recent movements</span>

            <div className="studio-moves">
              {data?.moves.length === 0 && (
                <p className="studio-muted">Nothing logged yet.</p>
              )}

              {data?.moves.map((m) => (
                <div key={m.id}>
                  <div>
                    <span>{m.itemName}</span>
                    <div className="studio-eyebrow">
                      {KIND_LABEL[m.kind] || m.kind} ·{" "}
                      {studios.find((s) => s.k === m.studio)?.short || m.studio} ·{" "}
                      {dLabel(m.movedOn)} · {m.who}
                    </div>
                  </div>
                  <span className={`mono ${m.qty > 0 ? "up" : "down"}`}>
                    {m.qty > 0 ? "+" : ""}
                    {m.qty}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminInventory;
