// Seeds the bookable menu, the roster and the opening stock take.
// Safe to re-run: existing rows are left alone, so edits made in the admin
// console survive a reseed.
//
//   npm run db:salon

const pool = require("../config/db");
const { TREATMENTS, STAFF, INVENTORY } = require("./salon-data");

async function seed() {
  for (const t of TREATMENTS) {
    await pool.query(
      `
      INSERT INTO treatments (number, label, title, dur, price, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (number) DO NOTHING
      `,
      [t.number, t.label, t.title, t.dur, t.price, t.description]
    );
  }

  for (const s of STAFF) {
    await pool.query(
      `
      INSERT INTO staff (id, name, role, studio, cats, hours)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
      `,
      [s.id, s.name, s.role, s.studio, JSON.stringify(s.cats), JSON.stringify(s.hours)]
    );
  }

  for (const i of INVENTORY) {
    await pool.query(
      `
      INSERT INTO inventory_items (id, name, cat, sku, unit, cost, retail, par, supplier, stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO NOTHING
      `,
      [i.id, i.name, i.cat, i.sku, i.unit, i.cost, i.retail, i.par, i.supplier, JSON.stringify(i.stock)]
    );
  }

  console.log(
    `Seeded ${TREATMENTS.length} treatments, ${STAFF.length} therapists, ${INVENTORY.length} stock items.`
  );
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
