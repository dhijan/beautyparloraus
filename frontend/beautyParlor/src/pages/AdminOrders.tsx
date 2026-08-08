import { useEffect, useMemo, useState } from "react";

import { getOrders, notifyOrder, setOrderStatus } from "../api/adminShopApi";
import type { AdminOrder } from "../types/adminOrder";
import { dLabel, money } from "../lib/booking";

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
];

// Which states still need someone to act — drives the "needs action" filter
// and the top counter.
const OPEN = ["pending", "confirmed", "processing"];

function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [tab, setTab] = useState("open");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setOrders(await getOrders());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const needle = query.toLowerCase().trim();

    return orders.filter((o) => {
      const matchesTab =
        tab === "all" ? true : tab === "open" ? OPEN.includes(o.status) : o.status === tab;

      const haystack = [
        o.orderNumber,
        o.customer.firstName,
        o.customer.lastName,
        o.customer.email,
        o.customer.phone || "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesTab && haystack.includes(needle);
    });
  }, [orders, tab, query]);

  const openCount = orders.filter((o) => OPEN.includes(o.status)).length;
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  async function changeStatus(id: number, status: string) {
    setBusyId(id);

    try {
      await setOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      setNotice("");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function notify(order: AdminOrder) {
    setBusyId(order.id);

    try {
      await notifyOrder(order.id);
      setNotice(`${order.customer.email} emailed about ${order.orderNumber}.`);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">Studio console</div>
          <h1>Shop orders</h1>
        </div>

        <span className="studio-muted">
          Orders arrive from Stripe checkout. Open one to see the items and the
          delivery address.
        </span>
      </header>

      {error && <p className="studio-error">{error}</p>}

      <div className="studio-kpis">
        {[
          { label: "Orders", value: String(orders.length), sub: "All time" },
          {
            label: "Needs action",
            value: String(openCount),
            sub: "Pending, confirmed or processing",
            warn: openCount > 0,
          },
          {
            label: "Order value",
            value: money(revenue),
            sub: "Excludes cancelled",
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

      <div className="studio-card studio-toolbar">
        <div className="studio-pills">
          {["open", "all", ...STATUSES].map((key) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {key === "open" ? "Needs action" : key === "all" ? "All" : key}
            </button>
          ))}
        </div>

        <input
          className="studio-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order, name or email"
        />
      </div>

      <div className="studio-stack">
        {loading ? (
          <p className="studio-muted">Loading orders…</p>
        ) : rows.length === 0 ? (
          <div className="studio-card studio-empty">
            <h3>Nothing here</h3>
            <p>No orders match that filter.</p>
          </div>
        ) : (
          rows.map((o) => {
            const expanded = openId === o.id;

            return (
              <div className="studio-card studio-request" key={o.id}>
                <span className="studio-avatar">
                  {(o.customer.firstName || "?").slice(0, 1)}
                </span>

                <div className="studio-request-body">
                  <div className="studio-request-top">
                    <strong>
                      {o.customer.firstName} {o.customer.lastName}
                    </strong>
                    <span className="studio-ref">{o.orderNumber}</span>
                    <span className="studio-eyebrow">
                      {dLabel(String(o.createdAt).slice(0, 10))}
                    </span>
                  </div>

                  <div className="studio-muted">
                    {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                    {money(o.total)} · {o.customer.email}
                  </div>

                  {expanded && (
                    <div className="studio-drawer-move">
                      <div className="studio-moves">
                        {o.items.map((item, index) => (
                          <div key={`${item.name}-${index}`}>
                            <div>
                              <span>{item.name}</span>
                              <div className="studio-eyebrow">
                                {item.qty} × {money(item.price)}
                              </div>
                            </div>
                            <span className="mono">
                              {money(item.qty * item.price)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="studio-muted" style={{ marginTop: 12 }}>
                        {o.customer.address}, {o.customer.city}{" "}
                        {o.customer.postcode}
                        {o.customer.phone ? ` · ${o.customer.phone}` : ""}
                      </p>

                      {o.customer.notes && (
                        <p className="studio-note">{o.customer.notes}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="studio-request-actions">
                  <select
                    value={o.status}
                    disabled={busyId === o.id}
                    onChange={(e) => changeStatus(o.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <button
                    className="studio-btn solid"
                    disabled={busyId === o.id}
                    onClick={() => notify(o)}
                  >
                    {busyId === o.id ? "Sending…" : "Email guest"}
                  </button>

                  <button
                    className="studio-btn ghost"
                    onClick={() => setOpenId(expanded ? null : o.id)}
                  >
                    {expanded ? "Hide" : "Details"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {notice && <p className="studio-muted">{notice}</p>}
    </div>
  );
}

export default AdminOrders;
