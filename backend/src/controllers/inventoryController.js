// Stock and inventory for the studio console: on-hand counts per studio,
// reorder points, purchase orders and the movement log.

const pool = require("../config/db");
const { STUDIOS } = require("../db/salon-data");
const { fromSqlDate } = require("../utils/schedule");

const STUDIO_KEYS = STUDIOS.map((s) => s.k);
const KINDS = ["receive", "sale", "usage", "wastage", "count"];

const actorOf = (req) => req.admin?.username || req.admin?.role || "admin";

function formatItem(row) {
  return {
    id: row.id,
    name: row.name,
    cat: row.cat,
    sku: row.sku,
    unit: row.unit,
    cost: Number(row.cost),
    retail: Number(row.retail),
    par: row.par,
    supplier: row.supplier,
    stock: row.stock || {},
  };
}

const stockIn = (item, studio) =>
  studio
    ? Number(item.stock[studio] || 0)
    : STUDIO_KEYS.reduce((n, k) => n + Number(item.stock[k] || 0), 0);

const parIn = (item, studio) => (studio ? item.par : item.par * STUDIO_KEYS.length);

function stateOf(item, studio) {
  const on = stockIn(item, studio);
  if (on === 0) return "out";
  return on <= parIn(item, studio) ? "low" : "ok";
}

async function getInventory(req, res, next) {
  try {
    const studio =
      req.query.studio && req.query.studio !== "all" ? req.query.studio : null;
    const tab = req.query.tab || "all";
    const query = String(req.query.q || "").trim().toLowerCase();

    const [items, orders, moves] = await Promise.all([
      pool.query(`SELECT * FROM inventory_items ORDER BY id ASC`),
      pool.query(
        `
        SELECT o.*, i.name AS item_name, i.supplier, i.cost
        FROM purchase_orders o
        JOIN inventory_items i ON i.id = o.item_id
        ORDER BY o.status ASC, o.placed DESC
        LIMIT 12
        `
      ),
      pool.query(
        `
        SELECT m.*, i.name AS item_name
        FROM stock_moves m
        JOIN inventory_items i ON i.id = m.item_id
        ORDER BY m.created_at DESC
        LIMIT 8
        `
      ),
    ]);

    const all = items.rows.map(formatItem);

    const onOrderFor = (id) =>
      orders.rows
        .filter(
          (o) =>
            o.status === "ordered" && o.item_id === id && (!studio || o.studio === studio)
        )
        .reduce((n, o) => n + o.qty, 0);

    const rows = all
      .filter((item) => {
        if (tab === "retail" && item.cat !== "Retail") return false;
        if (tab === "back" && item.cat !== "Back bar") return false;
        if (tab === "low" && stateOf(item, studio) === "ok") return false;
        if (query && !`${item.name} ${item.sku}`.toLowerCase().includes(query))
          return false;
        return true;
      })
      .map((item) => ({
        ...item,
        onHand: stockIn(item, studio),
        onOrder: onOrderFor(item.id),
        state: stateOf(item, studio),
        atCost: stockIn(item, studio) * item.cost,
        // How many to order back up to twice par, never less than par.
        suggested: Math.max(
          item.par * 2 - Number(item.stock[studio || STUDIO_KEYS[0]] || 0),
          item.par
        ),
        split: STUDIOS.map((s) => ({
          key: s.k,
          qty: Number(item.stock[s.k] || 0),
          low: Number(item.stock[s.k] || 0) <= item.par,
        })),
      }));

    const needing = all.filter((item) => stateOf(item, studio) !== "ok");
    const out = all.filter((item) => stateOf(item, studio) === "out");
    const open = orders.rows.filter((o) => o.status === "ordered");

    res.json({
      scope: studio || "all",
      kpis: {
        tracked: all.length,
        needing: needing.length,
        out: out.length,
        atCost: all.reduce((n, item) => n + stockIn(item, studio) * item.cost, 0),
        onOrder: open.reduce((n, o) => n + o.qty, 0),
        openOrders: open.length,
      },
      rows,
      orders: orders.rows.map((o) => ({
        id: o.id,
        itemId: o.item_id,
        itemName: o.item_name,
        supplier: o.supplier,
        studio: o.studio,
        qty: o.qty,
        value: Number(o.cost) * o.qty,
        placed: fromSqlDate(o.placed),
        eta: o.eta ? fromSqlDate(o.eta) : null,
        status: o.status,
      })),
      moves: moves.rows.map((m) => ({
        id: m.id,
        itemName: m.item_name,
        studio: m.studio,
        qty: m.qty,
        kind: m.kind,
        movedOn: fromSqlDate(m.moved_on),
        who: m.who,
      })),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Applies a stock change and logs it. `qty` is signed for receives and
 * deductions; for a stocktake ("count") it is the absolute counted figure.
 * Stock never goes below zero.
 */
async function moveStock(itemId, studio, qty, kind, who) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const locked = await client.query(
      `SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE`,
      [itemId]
    );

    if (locked.rowCount === 0) {
      await client.query("ROLLBACK");
      return { error: "Unknown item" };
    }

    const item = formatItem(locked.rows[0]);
    const before = Number(item.stock[studio] || 0);
    const after =
      kind === "count" ? Math.max(0, qty) : Math.max(0, before + qty);
    const delta = after - before;

    const updated = await client.query(
      `
      UPDATE inventory_items
      SET stock = jsonb_set(stock, ARRAY[$2::text], to_jsonb($3::int), TRUE)
      WHERE id = $1
      RETURNING *
      `,
      [itemId, studio, after]
    );

    if (delta !== 0) {
      await client.query(
        `
        INSERT INTO stock_moves (item_id, studio, qty, kind, who)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [itemId, studio, delta, kind, who]
      );
    }

    await client.query("COMMIT");

    return { item: formatItem(updated.rows[0]), delta };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function adjustStock(req, res, next) {
  try {
    const { studio, qty, kind = "count" } = req.body || {};

    if (!STUDIO_KEYS.includes(studio)) {
      return res.status(400).json({ error: "Unknown studio" });
    }

    if (!KINDS.includes(kind)) {
      return res.status(400).json({ error: "Unknown movement type" });
    }

    const amount = Math.round(Number(qty));

    if (!Number.isFinite(amount)) {
      return res.status(400).json({ error: "Quantity must be a number" });
    }

    const result = await moveStock(
      req.params.id,
      studio,
      amount,
      kind,
      actorOf(req)
    );

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function setPar(req, res, next) {
  try {
    const par = Math.round(Number(req.body?.par));

    if (!Number.isFinite(par) || par < 0) {
      return res.status(400).json({ error: "Par must be zero or more" });
    }

    const updated = await pool.query(
      `UPDATE inventory_items SET par = $2 WHERE id = $1 RETURNING *`,
      [req.params.id, par]
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ error: "Unknown item" });
    }

    res.json(formatItem(updated.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const { studio, qty } = req.body || {};

    if (!STUDIO_KEYS.includes(studio)) {
      return res.status(400).json({ error: "Unknown studio" });
    }

    const amount = Math.round(Number(qty));

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Order at least one unit" });
    }

    const inserted = await pool.query(
      `
      INSERT INTO purchase_orders (item_id, studio, qty, eta)
      VALUES ($1, $2, $3, CURRENT_DATE + 4)
      RETURNING *
      `,
      [req.params.id, studio, amount]
    );

    res.status(201).json({ id: inserted.rows[0].id, qty: amount, studio });
  } catch (error) {
    next(error);
  }
}

/** Marks a purchase order delivered and books the units into stock. */
async function receiveOrder(req, res, next) {
  try {
    const found = await pool.query(
      `
      UPDATE purchase_orders
      SET status = 'received'
      WHERE id = $1 AND status = 'ordered'
      RETURNING *
      `,
      [req.params.id]
    );

    if (found.rowCount === 0) {
      return res.status(404).json({ error: "No open order with that id" });
    }

    const order = found.rows[0];

    const result = await moveStock(
      order.item_id,
      order.studio,
      order.qty,
      "receive",
      actorOf(req)
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const deleted = await pool.query(
      `DELETE FROM purchase_orders WHERE id = $1 AND status = 'ordered'`,
      [req.params.id]
    );

    if (deleted.rowCount === 0) {
      return res.status(404).json({ error: "No open order with that id" });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getInventory,
  adjustStock,
  setPar,
  createOrder,
  receiveOrder,
  cancelOrder,
};
