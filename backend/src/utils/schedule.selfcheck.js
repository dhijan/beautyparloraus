// Self-check for the scheduling rules. No test runner — run it directly:
//
//   npm run check:schedule

const assert = require("node:assert/strict");

const {
  TIMES,
  depositFor,
  freeAt,
  isoDate,
  slotsFor,
  t12,
  t2m,
} = require("./schedule");
const { STAFF } = require("../db/salon-data");

const simran = STAFF[0]; // Roselands, brows.
const nadia = STAFF[1]; // Roselands, lashes and skin.

/** A Thursday: the long day, 9:30–21:00, so late slots stay open. */
const thursday = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (d.getDay() !== 4) d.setDate(d.getDate() + 1);
  return isoDate(d);
})();

const booking = (over = {}) => ({
  ref: "BBH-TEST1",
  staffId: simran.id,
  time: "11:00",
  dur: 60,
  status: "confirmed",
  ...over,
});

/* time helpers */

assert.equal(t2m("9:30"), 570);
assert.equal(t12("9:30"), "9:30am");
assert.equal(t12("13:05"), "1:05pm");
assert.equal(t12("12:00"), "12:00pm");
assert.equal(t12("0:30"), "12:30am");

/* deposits */

assert.equal(depositFor(99), 20, "20% of 99 rounds to the nearest $5");
assert.equal(depositFor(600), 120);
assert.equal(depositFor(10), 10, "never below the $10 floor");

/* overlap detection */

const held = [booking({ time: "11:00", dur: 60 })]; // 11:00–12:00

assert.equal(
  freeAt(simran, thursday, t2m("10:00"), 60, held, []),
  true,
  "10:00–11:00 ends exactly as the held slot starts"
);
assert.equal(
  freeAt(simran, thursday, t2m("12:00"), 60, held, []),
  true,
  "12:00 starts exactly as the held slot ends"
);
assert.equal(
  freeAt(simran, thursday, t2m("10:30"), 60, held, []),
  false,
  "10:30–11:30 runs into the held slot"
);
assert.equal(
  freeAt(simran, thursday, t2m("11:30"), 60, held, []),
  false,
  "11:30 starts inside the held slot"
);
assert.equal(
  freeAt(simran, thursday, t2m("10:00"), 180, held, []),
  false,
  "a long treatment straddles the held slot"
);

/* statuses and exclusions */

assert.equal(
  freeAt(simran, thursday, t2m("11:00"), 60, [booking({ status: "cancelled" })], []),
  true,
  "a cancelled appointment releases the chair"
);
assert.equal(
  freeAt(simran, thursday, t2m("11:00"), 60, held, [], "BBH-TEST1"),
  true,
  "the booking being rescheduled does not block itself"
);
assert.equal(
  freeAt(simran, thursday, t2m("11:00"), 60, [booking({ staffId: "s2" })], []),
  true,
  "another therapist's appointment is not a clash"
);

/* closures */

const drill = [
  { studio: "all", staffId: "all", from: "13:00", to: "15:00", reason: "Fire drill" },
];

assert.equal(freeAt(simran, thursday, t2m("13:00"), 30, [], drill), false);
assert.equal(freeAt(simran, thursday, t2m("12:30"), 30, [], drill), true);
assert.equal(
  freeAt(simran, thursday, t2m("13:00"), 30, [], [
    { studio: "all", staffId: "s7", from: "13:00", to: "15:00" },
  ]),
  true,
  "a closure aimed at one therapist does not block another"
);
assert.equal(
  freeAt(simran, thursday, t2m("13:00"), 30, [], [
    { studio: "HB", staffId: "all", from: "13:00", to: "15:00" },
  ]),
  true,
  "a closure at another studio does not block Roselands"
);

/* trading hours */

assert.equal(
  freeAt(simran, thursday, t2m("9:00"), 30, [], []),
  false,
  "9:00 is before the 9:30 open"
);
assert.equal(
  freeAt(simran, thursday, t2m("20:30"), 60, [], []),
  false,
  "a 60 min treatment at 20:30 would run past the 21:00 close"
);
assert.equal(freeAt(simran, thursday, t2m("20:00"), 60, [], []), true);

/* slot grid */

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const midnight = new Date(thursday + "T00:00:00");

const open = slotsFor({
  pool: [simran],
  date: thursday,
  dur: 60,
  bookings: [],
  blocks: [],
  now: midnight,
});

assert.equal(open.length, TIMES.length);
assert.equal(open.find((s) => s.time === "11:00").staffId, simran.id);
assert.equal(open.find((s) => s.time === "9:00").ok, false, "before opening");

const withHold = slotsFor({
  pool: [simran],
  date: thursday,
  dur: 60,
  bookings: held,
  blocks: [],
  now: midnight,
});

assert.equal(withHold.find((s) => s.time === "11:00").ok, false);
assert.equal(withHold.find((s) => s.time === "12:00").ok, true);

// "any" searches the whole qualified pool, so one busy therapist does not
// close the slot at a studio with cover.
const pooled = slotsFor({
  pool: [simran, nadia],
  date: thursday,
  dur: 30,
  bookings: held,
  blocks: [],
  now: midnight,
});

assert.equal(
  pooled.find((s) => s.time === "11:00").staffId,
  nadia.id,
  "Nadia takes the slot while Simran is booked"
);

/* today's past slots are closed */

const noon = new Date(thursday + "T12:00:00");
const todayish = slotsFor({
  pool: [simran],
  date: isoDate(noon),
  dur: 30,
  bookings: [],
  blocks: [],
  now: noon,
});

assert.equal(
  todayish.filter((s) => t2m(s.time) <= 12 * 60).every((s) => !s.ok),
  true,
  "slots that have already started today are closed"
);

console.log("schedule self-check passed");
