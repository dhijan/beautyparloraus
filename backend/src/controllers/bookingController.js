// Public booking flow: browse the menu, find a slot, book it, then move or
// cancel it with the reference code.

const pool = require("../config/db");
const { STUDIOS } = require("../db/salon-data");
const {
  formatBooking,
  getBookingByRef,
  getDay,
  getStaff,
  getTreatment,
  getTreatments,
} = require("../models/bookingModel");
const {
  depositFor,
  freeAt,
  isoDate,
  makeRef,
  slotsFor,
  t2m,
} = require("../utils/schedule");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Therapists at `studio` qualified for `treatment`. */
function eligible(staff, studio, treatment) {
  return staff.filter(
    (s) => s.studio === studio && (!treatment || s.cats.includes(treatment.label))
  );
}

async function getConfig(req, res, next) {
  try {
    const [treatments, staff] = await Promise.all([
      getTreatments({ activeOnly: true }),
      getStaff(),
    ]);

    // Categories are the menu's own labels, in menu order — no second list to
    // keep in step when a treatment is added.
    const categories = [];
    treatments.forEach((t) => {
      if (!categories.includes(t.label)) categories.push(t.label);
    });

    res.json({
      studios: STUDIOS,
      treatments,
      categories,
      // Enough for the client to show who is qualified before a date is picked.
      staff: staff.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        studio: s.studio,
        cats: s.cats,
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function getSlots(req, res, next) {
  try {
    const { studio, date, treatment: treatmentNumber, staff: staffId } = req.query;

    if (!studio || !DATE_RE.test(String(date)) || !treatmentNumber) {
      return res.status(400).json({
        error: "studio, date (yyyy-mm-dd) and treatment are required",
      });
    }

    const treatment = await getTreatment(treatmentNumber);

    if (!treatment) {
      return res.status(404).json({ error: "Unknown treatment" });
    }

    const [allStaff, day] = await Promise.all([getStaff(), getDay(date)]);
    const qualified = eligible(allStaff, studio, treatment);

    const pool_ =
      staffId && staffId !== "any"
        ? qualified.filter((s) => s.id === staffId)
        : qualified;

    res.json({
      treatment,
      staff: qualified.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        studio: s.studio,
      })),
      slots: slotsFor({
        pool: pool_,
        date,
        dur: treatment.dur,
        bookings: day.bookings,
        blocks: day.blocks,
      }),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Writes the appointment. The overlap check and the insert run inside one
 * transaction with the therapist's row locked, so two guests racing for the
 * last slot cannot both win it.
 */
async function createBooking(req, res, next) {
  const client = await pool.connect();

  try {
    const {
      studio,
      treatment: treatmentNumber,
      staffId = "any",
      date,
      time,
      name,
      phone,
      email = "",
      notes = "",
      paid = false,
    } = req.body || {};

    if (!studio || !treatmentNumber || !DATE_RE.test(String(date)) || !time) {
      return res
        .status(400)
        .json({ error: "studio, treatment, date and time are required" });
    }

    if (!String(name).trim() || !String(phone).trim()) {
      return res.status(400).json({ error: "Name and mobile are required" });
    }

    if (!STUDIOS.some((s) => s.k === studio)) {
      return res.status(400).json({ error: "Unknown studio" });
    }

    const treatment = await getTreatment(treatmentNumber);

    if (!treatment || !treatment.isActive) {
      return res.status(400).json({ error: "That treatment is not bookable" });
    }

    const [allStaff, day] = await Promise.all([getStaff(), getDay(date)]);
    const qualified = eligible(allStaff, studio, treatment);

    if (qualified.length === 0) {
      return res
        .status(400)
        .json({ error: "That treatment is not offered at this studio" });
    }

    const candidates =
      staffId === "any" ? qualified : qualified.filter((s) => s.id === staffId);

    const chosen = candidates.find((s) =>
      freeAt(s, date, t2m(time), treatment.dur, day.bookings, day.blocks)
    );

    if (!chosen) {
      return res.status(409).json({ error: "That slot is no longer free" });
    }

    await client.query("BEGIN");

    // Serialises bookings per therapist for the length of the insert.
    await client.query(`SELECT id FROM staff WHERE id = $1 FOR UPDATE`, [chosen.id]);

    const clash = await client.query(
      `
      SELECT 1 FROM bookings
      WHERE staff_id = $1
        AND booking_date = $2
        AND status IN ('pending', 'confirmed')
        AND booking_time < ($3::time + ($4 || ' minutes')::interval)
        AND (booking_time + (dur || ' minutes')::interval) > $3::time
      LIMIT 1
      `,
      [chosen.id, date, time, treatment.dur]
    );

    if (clash.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "That slot is no longer free" });
    }

    const inserted = await client.query(
      `
      INSERT INTO bookings (
        ref, studio, treatment_number, staff_id, booking_date, booking_time,
        dur, price, deposit, client_name, client_phone, client_email, notes,
        status, paid, channel
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', $14, 'online')
      RETURNING *
      `,
      [
        makeRef(),
        studio,
        treatment.number,
        chosen.id,
        date,
        time,
        treatment.dur,
        treatment.price,
        depositFor(treatment.price),
        String(name).trim(),
        String(phone).trim(),
        String(email).trim(),
        String(notes).trim(),
        Boolean(paid),
      ]
    );

    await client.query("COMMIT");

    res.status(201).json(formatBooking(inserted.rows[0]));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    client.release();
  }
}

async function lookupBooking(req, res, next) {
  try {
    const booking = await getBookingByRef(req.params.ref);

    if (!booking) {
      return res.status(404).json({ error: "No booking found for that code" });
    }

    const [treatment, staff] = await Promise.all([
      getTreatment(booking.treatment),
      getStaff(),
    ]);

    const therapist = staff.find((s) => s.id === booking.staffId) || null;
    const studio = STUDIOS.find((s) => s.k === booking.studio) || null;

    res.json({
      booking,
      treatment,
      therapist: therapist && { id: therapist.id, name: therapist.name },
      studio,
    });
  } catch (error) {
    next(error);
  }
}

/** Slots the guest could move an existing appointment into. */
async function getMoveSlots(req, res, next) {
  try {
    const booking = await getBookingByRef(req.params.ref);

    if (!booking) {
      return res.status(404).json({ error: "No booking found for that code" });
    }

    const date = DATE_RE.test(String(req.query.date)) ? req.query.date : booking.date;
    const [allStaff, day] = await Promise.all([getStaff(), getDay(date)]);
    const therapist = allStaff.filter((s) => s.id === booking.staffId);

    res.json({
      date,
      slots: slotsFor({
        pool: therapist,
        date,
        dur: booking.dur,
        bookings: day.bookings,
        blocks: day.blocks,
        ignoreRef: booking.ref,
      }),
    });
  } catch (error) {
    next(error);
  }
}

async function moveBooking(req, res, next) {
  try {
    const { date, time } = req.body || {};

    if (!DATE_RE.test(String(date)) || !time) {
      return res.status(400).json({ error: "date and time are required" });
    }

    const booking = await getBookingByRef(req.params.ref);

    if (!booking) {
      return res.status(404).json({ error: "No booking found for that code" });
    }

    if (booking.status !== "pending" && booking.status !== "confirmed") {
      return res
        .status(409)
        .json({ error: "This appointment can no longer be changed" });
    }

    const [allStaff, day] = await Promise.all([getStaff(), getDay(date)]);
    const therapist = allStaff.find((s) => s.id === booking.staffId);

    if (
      !therapist ||
      !freeAt(therapist, date, t2m(time), booking.dur, day.bookings, day.blocks, booking.ref)
    ) {
      return res.status(409).json({ error: "That slot is not free" });
    }

    const updated = await pool.query(
      `
      UPDATE bookings
      SET booking_date = $2, booking_time = $3, status = 'pending'
      WHERE ref = $1
      RETURNING *
      `,
      [booking.ref, date, time]
    );

    res.json(formatBooking(updated.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const updated = await pool.query(
      `
      UPDATE bookings
      SET status = 'cancelled'
      WHERE ref = $1 AND status IN ('pending', 'confirmed')
      RETURNING *
      `,
      [String(req.params.ref).trim().toUpperCase()]
    );

    if (updated.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "No active booking found for that code" });
    }

    res.json(formatBooking(updated.rows[0]));
  } catch (error) {
    next(error);
  }
}

/** Days the date picker offers, starting today. */
function upcomingDays(count) {
  const out = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(isoDate(d));
  }

  return out;
}

module.exports = {
  getConfig,
  getSlots,
  createBooking,
  lookupBooking,
  getMoveSlots,
  moveBooking,
  cancelBooking,
  eligible,
  upcomingDays,
};
