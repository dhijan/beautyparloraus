// Scheduling rules, shared by the public booking flow and the studio console so
// both agree on what "free" means. Times are minutes past midnight internally.

const pad2 = (n) => String(n).padStart(2, "0");

const t2m = (t) => {
  const [h, m] = String(t).split(":");
  return Number(h) * 60 + Number(m);
};

const m2t = (m) => `${Math.floor(m / 60)}:${pad2(m % 60)}`;

const t12 = (t) => {
  const total = t2m(t);
  const h = Math.floor(total / 60);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad2(total % 60)}${h >= 12 ? "pm" : "am"}`;
};

const isoDate = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Parses yyyy-mm-dd as a local date — `new Date(str)` would read it as UTC. */
const dParts = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Postgres hands back TIME as "09:30:00"; the rest of the app uses "9:30". */
const fromSqlTime = (t) => m2t(t2m(String(t).slice(0, 5)));

/** Postgres hands back DATE as a Date object in the server's timezone. */
const fromSqlDate = (d) => (d instanceof Date ? isoDate(d) : String(d).slice(0, 10));

/** Bookable starts, every half hour. */
const TIMES = (() => {
  const out = [];
  for (let m = 9 * 60; m <= 20 * 60 + 30; m += 30) out.push(m2t(m));
  return out;
})();

/** Every half hour a shift could plausibly start or end — for the roster editor. */
const SHIFT_HOURS = (() => {
  const out = [];
  for (let m = 7 * 60; m <= 21 * 60; m += 30) out.push(m2t(m));
  return out;
})();

const HOLDS_CHAIR = new Set(["pending", "confirmed"]);

/** 20% of the treatment price, rounded to $5, never under $10. */
const depositFor = (price) => Math.max(10, Math.round((Number(price) * 0.2) / 5) * 5);

/**
 * Can `staff` take a `dur`-minute appointment starting at `start` on `date`?
 * `bookings` and `blocks` are that day's rows; `ignoreRef` excludes the booking
 * being rescheduled so it does not clash with itself.
 */
function freeAt(staff, date, start, dur, bookings, blocks, ignoreRef) {
  const shift = (staff.hours || {})[String(dParts(date).getDay())];
  if (!shift) return false;
  if (start < t2m(shift[0]) || start + dur > t2m(shift[1])) return false;

  const blocked = blocks.some(
    (b) =>
      (b.staffId === "all" || b.staffId === staff.id) &&
      (b.studio === "all" || b.studio === staff.studio) &&
      start < t2m(b.to) &&
      start + dur > t2m(b.from)
  );
  if (blocked) return false;

  return !bookings.some(
    (b) =>
      b.staffId === staff.id &&
      b.ref !== ignoreRef &&
      HOLDS_CHAIR.has(b.status) &&
      start < t2m(b.time) + b.dur &&
      start + dur > t2m(b.time)
  );
}

/**
 * Every half-hourly start on `date`, flagged open or taken. `pool` is the list
 * of therapists in play — one specific person, or everyone qualified.
 */
function slotsFor({ pool, date, dur, bookings, blocks, ignoreRef, now = new Date() }) {
  const today = isoDate(now);
  const passed = now.getHours() * 60 + now.getMinutes();

  return TIMES.map((time) => {
    // Never offer a start that has already been and gone today.
    if (date === today && t2m(time) <= passed) {
      return { time, ok: false, staffId: null };
    }
    const hit = pool.find((s) =>
      freeAt(s, date, t2m(time), dur, bookings, blocks, ignoreRef)
    );
    return { time, ok: Boolean(hit), staffId: hit ? hit.id : null };
  });
}

/** Reference codes skip I, O, 0 and 1 so they survive being read down a phone. */
const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRef() {
  let ref = "BBH-";
  for (let i = 0; i < 5; i++) {
    ref += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  }
  return ref;
}

module.exports = {
  pad2,
  t2m,
  m2t,
  t12,
  isoDate,
  dParts,
  fromSqlTime,
  fromSqlDate,
  TIMES,
  SHIFT_HOURS,
  depositFor,
  freeAt,
  slotsFor,
  makeRef,
};
