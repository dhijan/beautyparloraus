// Row loading and shaping for the studio schedule. Controllers stay thin and
// both the public flow and the admin console read the same shapes.

const pool = require("../config/db");
const { fromSqlDate, fromSqlTime } = require("../utils/schedule");

function formatTreatment(row) {
  return {
    number: row.number,
    label: row.label,
    title: row.title,
    dur: row.dur,
    price: Number(row.price),
    description: row.description,
    isActive: row.is_active,
  };
}

function formatStaff(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    studio: row.studio,
    cats: row.cats || [],
    hours: row.hours || {},
    isActive: row.is_active,
  };
}

function formatBooking(row) {
  return {
    ref: row.ref,
    studio: row.studio,
    treatment: row.treatment_number,
    staffId: row.staff_id,
    date: fromSqlDate(row.booking_date),
    time: fromSqlTime(row.booking_time),
    dur: row.dur,
    price: Number(row.price),
    deposit: Number(row.deposit),
    name: row.client_name,
    phone: row.client_phone,
    email: row.client_email,
    notes: row.notes,
    status: row.status,
    paid: row.paid,
    channel: row.channel,
    createdAt: row.created_at,
  };
}

function formatBlock(row) {
  return {
    id: row.id,
    studio: row.studio,
    staffId: row.staff_id,
    date: fromSqlDate(row.block_date),
    from: fromSqlTime(row.from_time),
    to: fromSqlTime(row.to_time),
    reason: row.reason,
  };
}

async function getTreatments({ activeOnly = false } = {}) {
  const result = await pool.query(
    `
    SELECT * FROM treatments
    ${activeOnly ? "WHERE is_active = TRUE" : ""}
    ORDER BY number ASC
    `
  );

  return result.rows.map(formatTreatment);
}

async function getTreatment(number) {
  const result = await pool.query(`SELECT * FROM treatments WHERE number = $1`, [
    number,
  ]);

  return result.rows[0] ? formatTreatment(result.rows[0]) : null;
}

async function getStaff({ studio } = {}) {
  const result = await pool.query(
    `
    SELECT * FROM staff
    WHERE is_active = TRUE
      AND ($1::text IS NULL OR studio = $1)
    ORDER BY id ASC
    `,
    [studio && studio !== "all" ? studio : null]
  );

  return result.rows.map(formatStaff);
}

/** Appointments and closures for one day — everything availability depends on. */
async function getDay(date) {
  const [bookings, blocks] = await Promise.all([
    pool.query(`SELECT * FROM bookings WHERE booking_date = $1`, [date]),
    pool.query(`SELECT * FROM blocks WHERE block_date = $1`, [date]),
  ]);

  return {
    bookings: bookings.rows.map(formatBooking),
    blocks: blocks.rows.map(formatBlock),
  };
}

async function getBookingByRef(ref) {
  const result = await pool.query(`SELECT * FROM bookings WHERE ref = $1`, [
    String(ref).trim().toUpperCase(),
  ]);

  return result.rows[0] ? formatBooking(result.rows[0]) : null;
}

module.exports = {
  formatTreatment,
  formatStaff,
  formatBooking,
  formatBlock,
  getTreatments,
  getTreatment,
  getStaff,
  getDay,
  getBookingByRef,
};
