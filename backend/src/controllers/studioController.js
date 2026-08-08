// Studio console: the day calendar, booking requests, client records, roster,
// treatment menu, closures and reporting. Admin-only — see studioRoutes.js.

const pool = require("../config/db");
const { STUDIOS } = require("../db/salon-data");
const {
  formatBlock,
  formatBooking,
  formatStaff,
  formatTreatment,
  getBookingByRef,
  getDay,
  getStaff,
  getTreatment,
  getTreatments,
} = require("../models/bookingModel");
const {
  SHIFT_HOURS,
  TIMES,
  depositFor,
  freeAt,
  fromSqlDate,
  isoDate,
  makeRef,
  t2m,
} = require("../utils/schedule");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ["pending", "confirmed", "completed", "cancelled", "declined"];

const scopeOf = (req) => {
  const studio = req.query.studio;
  return studio && studio !== "all" ? studio : null;
};

/** Who is signed in — stamped on notes and stock movements. */
const actorOf = (req) => req.admin?.username || req.admin?.role || "admin";

async function getDayView(req, res, next) {
  try {
    const date = DATE_RE.test(String(req.query.date))
      ? req.query.date
      : isoDate(new Date());
    const studio = scopeOf(req);

    const [staff, day, pending] = await Promise.all([
      getStaff({ studio }),
      getDay(date),
      pool.query(
        `
        SELECT COUNT(*)::int AS n
        FROM bookings
        WHERE status = 'pending' AND ($1::text IS NULL OR studio = $1)
        `,
        [studio]
      ),
    ]);

    const inScope = (b) => !studio || b.studio === studio;
    const onFloor = day.bookings.filter(
      (b) => inScope(b) && b.status !== "cancelled" && b.status !== "declined"
    );

    const minutes = onFloor.reduce((n, b) => n + b.dur, 0);
    const capacity = Math.max(1, staff.length * 9 * 60);
    const confirmed = onFloor.filter((b) => b.status !== "pending");

    res.json({
      date,
      times: TIMES,
      staff,
      bookings: onFloor,
      blocks: day.blocks.filter((b) => !studio || b.studio === "all" || b.studio === studio),
      kpis: {
        bookings: onFloor.length,
        pendingToday: onFloor.filter((b) => b.status === "pending").length,
        revenue: confirmed.reduce((n, b) => n + b.price, 0),
        utilisation: Math.round((minutes / capacity) * 100),
        therapists: staff.length,
        awaiting: pending.rows[0].n,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getRequests(req, res, next) {
  try {
    const studio = scopeOf(req);

    const result = await pool.query(
      `
      SELECT b.*, t.title AS treatment_title, s.name AS staff_name
      FROM bookings b
      JOIN treatments t ON t.number = b.treatment_number
      JOIN staff s ON s.id = b.staff_id
      WHERE b.status = 'pending' AND ($1::text IS NULL OR b.studio = $1)
      ORDER BY b.booking_date ASC, b.booking_time ASC
      `,
      [studio]
    );

    res.json(
      result.rows.map((row) => ({
        ...formatBooking(row),
        treatmentTitle: row.treatment_title,
        staffName: row.staff_name,
      }))
    );
  } catch (error) {
    next(error);
  }
}

/** Full detail for the calendar drawer and the QR scanner. */
async function getBookingDetail(req, res, next) {
  try {
    const booking = await getBookingByRef(req.params.ref);

    if (!booking) {
      return res.status(404).json({ error: "No booking found for that code" });
    }

    const [treatment, staff] = await Promise.all([
      getTreatment(booking.treatment),
      getStaff(),
    ]);

    res.json({
      booking,
      treatment,
      therapist: staff.find((s) => s.id === booking.staffId) || null,
      studio: STUDIOS.find((s) => s.k === booking.studio) || null,
    });
  } catch (error) {
    next(error);
  }
}

/** Approve, decline, complete, or drag onto a different slot / therapist. */
async function updateBooking(req, res, next) {
  try {
    const { status, date, time, staffId } = req.body || {};
    const booking = await getBookingByRef(req.params.ref);

    if (!booking) {
      return res.status(404).json({ error: "No booking found for that code" });
    }

    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ error: "Unknown status" });
    }

    const nextDate = DATE_RE.test(String(date)) ? date : booking.date;
    const nextTime = time || booking.time;
    const nextStaff = staffId || booking.staffId;
    const moving =
      nextDate !== booking.date ||
      nextTime !== booking.time ||
      nextStaff !== booking.staffId;

    if (moving) {
      const [staff, day] = await Promise.all([getStaff(), getDay(nextDate)]);
      const therapist = staff.find((s) => s.id === nextStaff);

      if (!therapist) {
        return res.status(400).json({ error: "Unknown therapist" });
      }

      if (
        !freeAt(
          therapist,
          nextDate,
          t2m(nextTime),
          booking.dur,
          day.bookings,
          day.blocks,
          booking.ref
        )
      ) {
        return res
          .status(409)
          .json({ error: `${therapist.name} is not free at that time` });
      }
    }

    const updated = await pool.query(
      `
      UPDATE bookings
      SET status = $2, booking_date = $3, booking_time = $4, staff_id = $5
      WHERE ref = $1
      RETURNING *
      `,
      [booking.ref, status || booking.status, nextDate, nextTime, nextStaff]
    );

    res.json(formatBooking(updated.rows[0]));
  } catch (error) {
    next(error);
  }
}

/** Walk-in or phone booking: confirmed on the spot, no deposit taken. */
async function createWalkIn(req, res, next) {
  try {
    const { studio, treatment: treatmentNumber, staffId, date, time, name, phone } =
      req.body || {};

    if (!studio || !treatmentNumber || !DATE_RE.test(String(date)) || !time) {
      return res
        .status(400)
        .json({ error: "studio, treatment, date and time are required" });
    }

    if (!String(name || "").trim()) {
      return res.status(400).json({ error: "Client name is required" });
    }

    const treatment = await getTreatment(treatmentNumber);

    if (!treatment) {
      return res.status(400).json({ error: "Unknown treatment" });
    }

    const [staff, day] = await Promise.all([getStaff(), getDay(date)]);
    const therapist =
      staff.find((s) => s.id === staffId) || staff.find((s) => s.studio === studio);

    if (!therapist) {
      return res.status(400).json({ error: "No therapist at that studio" });
    }

    if (!freeAt(therapist, date, t2m(time), treatment.dur, day.bookings, day.blocks)) {
      return res
        .status(409)
        .json({ error: `${therapist.name} is not free at that time` });
    }

    const inserted = await pool.query(
      `
      INSERT INTO bookings (
        ref, studio, treatment_number, staff_id, booking_date, booking_time,
        dur, price, deposit, client_name, client_phone, status, paid, channel
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, 'confirmed', FALSE, 'phone')
      RETURNING *
      `,
      [
        makeRef(),
        studio,
        treatment.number,
        therapist.id,
        date,
        time,
        treatment.dur,
        treatment.price,
        String(name).trim(),
        String(phone || "").trim() || "—",
      ]
    );

    res.status(201).json(formatBooking(inserted.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function getClients(req, res, next) {
  try {
    const studio = scopeOf(req);

    const result = await pool.query(
      `
      SELECT
        client_phone AS phone,
        MAX(client_name) AS name,
        MAX(client_email) AS email,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS visits,
        COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0) AS spend,
        MAX(booking_date) FILTER (WHERE status = 'completed') AS last_seen
      FROM bookings
      WHERE $1::text IS NULL OR studio = $1
      GROUP BY client_phone
      ORDER BY spend DESC, name ASC
      `,
      [studio]
    );

    res.json(
      result.rows.map((row) => ({
        phone: row.phone,
        name: row.name,
        email: row.email,
        visits: row.visits,
        spend: Number(row.spend),
        lastSeen: row.last_seen ? fromSqlDate(row.last_seen) : null,
      }))
    );
  } catch (error) {
    next(error);
  }
}

async function getClient(req, res, next) {
  try {
    const { phone } = req.params;

    const [history, notes] = await Promise.all([
      pool.query(
        `
        SELECT b.*, t.title AS treatment_title, s.name AS staff_name
        FROM bookings b
        JOIN treatments t ON t.number = b.treatment_number
        JOIN staff s ON s.id = b.staff_id
        WHERE b.client_phone = $1
        ORDER BY b.booking_date DESC, b.booking_time DESC
        LIMIT 20
        `,
        [phone]
      ),
      pool.query(
        `
        SELECT * FROM client_notes
        WHERE client_phone = $1
        ORDER BY created_at DESC
        `,
        [phone]
      ),
    ]);

    if (history.rowCount === 0) {
      return res.status(404).json({ error: "No client with that mobile" });
    }

    res.json({
      phone,
      name: history.rows[0].client_name,
      email: history.rows[0].client_email,
      history: history.rows.map((row) => ({
        ...formatBooking(row),
        treatmentTitle: row.treatment_title,
        staffName: row.staff_name,
      })),
      notes: notes.rows.map((row) => ({
        id: row.id,
        body: row.body,
        author: row.author,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function addClientNote(req, res, next) {
  try {
    const body = String(req.body?.body || "").trim();

    if (!body) {
      return res.status(400).json({ error: "Note cannot be empty" });
    }

    const inserted = await pool.query(
      `
      INSERT INTO client_notes (client_phone, body, author)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [req.params.phone, body, actorOf(req)]
    );

    res.status(201).json({
      id: inserted.rows[0].id,
      body: inserted.rows[0].body,
      author: inserted.rows[0].author,
      createdAt: inserted.rows[0].created_at,
    });
  } catch (error) {
    next(error);
  }
}

async function getRoster(req, res, next) {
  try {
    res.json({
      staff: await getStaff({ studio: scopeOf(req) }),
      hourOptions: SHIFT_HOURS,
    });
  } catch (error) {
    next(error);
  }
}

/** Replaces a therapist's whole week — the roster editor sends the full map. */
async function updateStaffHours(req, res, next) {
  try {
    const { hours } = req.body || {};

    if (!hours || typeof hours !== "object" || Array.isArray(hours)) {
      return res.status(400).json({ error: "hours must be an object" });
    }

    const invalid = Object.entries(hours).find(
      ([day, span]) =>
        !/^[0-6]$/.test(day) ||
        !Array.isArray(span) ||
        span.length !== 2 ||
        t2m(span[0]) >= t2m(span[1])
    );

    if (invalid) {
      return res
        .status(400)
        .json({ error: "Each day must be [from, to] with from before to" });
    }

    const updated = await pool.query(
      `UPDATE staff SET hours = $2 WHERE id = $1 RETURNING *`,
      [req.params.id, JSON.stringify(hours)]
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ error: "Unknown therapist" });
    }

    res.json(formatStaff(updated.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function getMenu(req, res, next) {
  try {
    res.json(await getTreatments());
  } catch (error) {
    next(error);
  }
}

async function updateTreatment(req, res, next) {
  try {
    const { dur, price, isActive, title, label, description } = req.body || {};

    if (dur !== undefined && (!Number.isFinite(Number(dur)) || Number(dur) <= 0)) {
      return res.status(400).json({ error: "Duration must be a positive number" });
    }

    if (price !== undefined && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return res.status(400).json({ error: "Price cannot be negative" });
    }

    // Title and category are what the public menu reads — blanking either
    // would leave an unnamed row on /services and in the booking flow.
    if (title !== undefined && !String(title).trim()) {
      return res.status(400).json({ error: "Treatment name cannot be empty" });
    }

    if (label !== undefined && !String(label).trim()) {
      return res.status(400).json({ error: "Category cannot be empty" });
    }

    const updated = await pool.query(
      `
      UPDATE treatments
      SET dur = COALESCE($2, dur),
          price = COALESCE($3, price),
          is_active = COALESCE($4, is_active),
          title = COALESCE($5, title),
          label = COALESCE($6, label),
          description = COALESCE($7, description)
      WHERE number = $1
      RETURNING *
      `,
      [
        req.params.number,
        dur === undefined ? null : Math.round(Number(dur)),
        price === undefined ? null : Number(price),
        isActive === undefined ? null : Boolean(isActive),
        title === undefined ? null : String(title).trim().slice(0, 160),
        label === undefined ? null : String(label).trim().slice(0, 80),
        description === undefined ? null : String(description).trim(),
      ]
    );

    if (updated.rowCount === 0) {
      return res.status(404).json({ error: "Unknown treatment" });
    }

    res.json(formatTreatment(updated.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function getBlocks(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT * FROM blocks
      WHERE block_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY block_date ASC, from_time ASC
      `
    );

    res.json(result.rows.map(formatBlock));
  } catch (error) {
    next(error);
  }
}

async function createBlock(req, res, next) {
  try {
    const {
      studio = "all",
      staffId = "all",
      date,
      from,
      to,
      reason,
    } = req.body || {};

    if (!DATE_RE.test(String(date)) || !from || !to) {
      return res.status(400).json({ error: "date, from and to are required" });
    }

    if (t2m(from) >= t2m(to)) {
      return res.status(400).json({ error: "The end time must be after the start" });
    }

    const inserted = await pool.query(
      `
      INSERT INTO blocks (studio, staff_id, block_date, from_time, to_time, reason)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [studio, staffId, date, from, to, String(reason || "").trim() || "Blocked"]
    );

    res.status(201).json(formatBlock(inserted.rows[0]));
  } catch (error) {
    next(error);
  }
}

async function deleteBlock(req, res, next) {
  try {
    const deleted = await pool.query(`DELETE FROM blocks WHERE id = $1`, [
      req.params.id,
    ]);

    if (deleted.rowCount === 0) {
      return res.status(404).json({ error: "Unknown closure" });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

async function getReports(req, res, next) {
  try {
    const studio = scopeOf(req);

    const [totals, byStudio, byTreatment, staff] = await Promise.all([
      pool.query(
        `
        SELECT
          COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0) AS completed_revenue,
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_count,
          COALESCE(SUM(price) FILTER (WHERE status = 'confirmed'), 0) AS booked_revenue,
          COUNT(*) FILTER (WHERE status = 'confirmed')::int AS confirmed_count,
          COUNT(*) FILTER (WHERE status IN ('cancelled', 'declined'))::int AS lost_count,
          COUNT(*)::int AS total_count
        FROM bookings
        WHERE $1::text IS NULL OR studio = $1
        `,
        [studio]
      ),
      pool.query(
        `
        SELECT studio, COALESCE(SUM(price), 0) AS revenue
        FROM bookings
        WHERE status IN ('completed', 'confirmed')
          AND booking_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY studio
        `
      ),
      pool.query(
        `
        SELECT t.number, t.title, COUNT(*)::int AS bookings, COALESCE(SUM(b.price), 0) AS revenue
        FROM bookings b
        JOIN treatments t ON t.number = b.treatment_number
        WHERE b.status IN ('completed', 'confirmed')
          AND ($1::text IS NULL OR b.studio = $1)
        GROUP BY t.number, t.title
        ORDER BY revenue DESC
        LIMIT 6
        `,
        [studio]
      ),
      pool.query(
        `
        SELECT s.id, s.name, s.studio,
               COALESCE(SUM(b.dur) FILTER (
                 WHERE b.status IN ('pending', 'confirmed')
                   AND b.booking_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 6
               ), 0)::int AS booked_minutes
        FROM staff s
        LEFT JOIN bookings b ON b.staff_id = s.id
        WHERE s.is_active = TRUE AND ($1::text IS NULL OR s.studio = $1)
        GROUP BY s.id, s.name, s.studio
        ORDER BY s.id
        `,
        [studio]
      ),
    ]);

    const t = totals.rows[0];
    const studioRevenue = Object.fromEntries(
      byStudio.rows.map((row) => [row.studio, Number(row.revenue)])
    );

    // Six trading days a week, nine hours a day, as the design assumes.
    const weekCapacity = 60 * 9 * 6;

    res.json({
      kpis: {
        completedRevenue: Number(t.completed_revenue),
        completedCount: t.completed_count,
        bookedRevenue: Number(t.booked_revenue),
        confirmedCount: t.confirmed_count,
        averageTicket: t.completed_count
          ? Number(t.completed_revenue) / t.completed_count
          : 0,
        lostCount: t.lost_count,
        cancellationRate: t.total_count
          ? Math.round((t.lost_count / t.total_count) * 100)
          : 0,
      },
      studios: STUDIOS.map((s) => ({
        key: s.k,
        name: s.short,
        revenue: studioRevenue[s.k] || 0,
      })),
      treatments: byTreatment.rows.map((row) => ({
        number: row.number,
        title: row.title,
        bookings: row.bookings,
        revenue: Number(row.revenue),
      })),
      staff: staff.rows.map((row) => ({
        id: row.id,
        name: row.name,
        studio: row.studio,
        utilisation: Math.min(99, Math.round((row.booked_minutes / weekCapacity) * 100)),
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function getStudios(req, res, next) {
  try {
    res.json({
      studios: STUDIOS,
      treatments: await getTreatments(),
      staff: await getStaff(),
      times: TIMES,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDayView,
  getRequests,
  getBookingDetail,
  updateBooking,
  createWalkIn,
  getClients,
  getClient,
  addClientNote,
  getRoster,
  updateStaffHours,
  getMenu,
  updateTreatment,
  getBlocks,
  createBlock,
  deleteBlock,
  getReports,
  getStudios,
  depositFor,
};
