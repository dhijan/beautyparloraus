import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  createBooking,
  getBookingConfig,
  getSlots,
} from "../api/bookingApi";
import type {
  Booking,
  Slot,
  Studio,
  Therapist,
  Treatment,
} from "../api/bookingApi";
import { BIZ } from "../data/salonData";
import {
  MON,
  WD,
  dLabel,
  dParts,
  depositFor,
  icsFor,
  money,
  nextDays,
  t12,
} from "../lib/booking";
import QrPass from "../components/QrPass";

const STEP_LABELS = [
  "Studio",
  "Treatment",
  "Therapist",
  "Date & time",
  "Details",
  "Payment",
  "Confirmed",
];

const DAYS_AHEAD = 12;

function Book() {
  const [params] = useSearchParams();

  const [studios, setStudios] = useState<Studio[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [roster, setRoster] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState(0);
  const [cat, setCat] = useState(params.get("cat") || "all");
  const [studio, setStudio] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState("any");
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  const [pay, setPay] = useState<"deposit" | "studio">("deposit");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");

  const [booked, setBooked] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const svc = treatments.find((t) => t.number === serviceId) || null;
  const studioRec = studios.find((s) => s.k === studio) || null;
  const staffPick = staffId === "any" ? null : roster.find((s) => s.id === staffId);
  const deposit = svc ? depositFor(svc.price) : 0;
  const days = nextDays(DAYS_AHEAD);

  const staffPool = roster.filter(
    (s) => s.studio === studio && (!svc || (s.cats || []).includes(svc.label))
  );

  useEffect(() => {
    getBookingConfig()
      .then((config) => {
        setStudios(config.studios);
        setTreatments(config.treatments);
        setCategories(config.categories);
        setRoster(config.staff);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Availability is the server's call, not ours — re-ask whenever the shape of
  // the appointment changes.
  useEffect(() => {
    if (!studio || !serviceId || !date) {
      setSlots([]);
      return;
    }

    let live = true;
    setSlotsLoading(true);

    getSlots({ studio, date, treatment: serviceId, staff: staffId })
      .then((data) => {
        if (live) setSlots(data.slots);
      })
      .catch((e: Error) => {
        if (live) {
          setSlots([]);
          setError(e.message);
        }
      })
      .finally(() => {
        if (live) setSlotsLoading(false);
      });

    return () => {
      live = false;
    };
  }, [studio, serviceId, date, staffId]);

  const openCount = slots.filter((s) => s.ok).length;

  const stepReady = [
    Boolean(studio),
    Boolean(serviceId),
    staffPool.length > 0,
    Boolean(date && time),
    Boolean(name.trim() && phone.trim() && email.trim() && consent),
    pay === "studio" || card.replace(/\s/g, "").length > 6,
  ];

  // A chip is reachable once every step before it has what it needs.
  const reachable = (target: number) =>
    target <= step || stepReady.slice(0, target).every(Boolean);

  const ready = step === 6 || stepReady[step];

  async function confirm() {
    if (!studio || !serviceId || !date || !time) return;

    setSaving(true);
    setError("");

    try {
      setBooked(
        await createBooking({
          studio,
          treatment: serviceId,
          staffId,
          date,
          time,
          name,
          phone,
          email,
          notes,
          paid: pay === "deposit",
        })
      );
      setStep(6);
    } catch (e) {
      // Most likely the slot went while the form was being filled in.
      setError((e as Error).message);
      setTime(null);
      setStep(3);
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (step === 6 || !ready || saving) return;
    if (step === 5) {
      confirm();
      return;
    }
    setStep(step + 1);
  }

  function restart() {
    setBooked(null);
    setStep(0);
    setStudio(null);
    setServiceId(null);
    setStaffId("any");
    setDate(null);
    setTime(null);
    setConsent(false);
    setCard("");
    setExp("");
    setCvc("");
    setError("");
  }

  const picked = [
    { k: "Studio", v: studioRec?.name, empty: !studioRec },
    {
      k: "Treatment",
      v: svc ? `${svc.title} · ${svc.dur} min` : null,
      empty: !svc,
    },
    {
      k: "Therapist",
      v: staffPick ? staffPick.name : serviceId ? "First available" : null,
      empty: !serviceId,
    },
    {
      k: "When",
      v: date && time ? `${dLabel(date)} · ${t12(time)}` : null,
      empty: !(date && time),
    },
    {
      k: "Guest",
      v: name.trim() ? `${name} · ${phone}` : null,
      empty: !name.trim(),
    },
  ];

  const bookedSvc = booked
    ? treatments.find((t) => t.number === booked.treatment) || null
    : null;
  const bookedStaff = booked ? roster.find((s) => s.id === booked.staffId) : null;
  const bookedStudio = booked
    ? studios.find((s) => s.k === booked.studio) || null
    : null;

  const hint =
    step === 6
      ? "Keep the reference code — you will need it to move or cancel."
      : step === 5
        ? "Requests are confirmed by the studio, usually within the hour."
        : "You can change any earlier step from the chips above.";

  if (loading) {
    return (
      <main className="bbh-page">
        <p className="bbh-state">Loading the booking diary…</p>
      </main>
    );
  }

  return (
    <main className="bbh-page">
      <Link to="/" className="bbh-back">
        ← Back home
      </Link>

      <div className="bbh-page-head" style={{ marginTop: 18 }}>
        <h1 className="bbh-display bbh-h1 bbh-fade-up">
          Book an <em>appointment</em>
        </h1>

        <p
          className="bbh-lede bbh-fade-up"
          style={{ maxWidth: 390, animationDelay: "0.12s" }}
        >
          Booked with us directly — no third party. You will get a reference code
          and a QR pass to show at reception.
        </p>
      </div>

      <div className="bbh-bk-steps">
        {STEP_LABELS.map((label, index) => (
          <button
            key={label}
            className={index === step ? "active" : ""}
            disabled={!reachable(index)}
            onClick={() => reachable(index) && setStep(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="bbh-bk-shell">
        <div className="bbh-bk-card">
          {step === 0 && (
            <div>
              <h2>Choose your studio</h2>
              <p>
                All four studios run the same menu and the same standards — pick
                whichever is easiest to reach.
              </p>

              <div className="bbh-bk-grid">
                {studios.map((s) => (
                  <button
                    key={s.k}
                    className={`bbh-bk-option ${studio === s.k ? "selected" : ""}`}
                    onClick={() => {
                      setStudio(s.k);
                      setStaffId("any");
                      setDate(null);
                      setTime(null);
                      setStep(1);
                    }}
                  >
                    <span className="bbh-bk-dot">
                      <i></i>Studio {s.no}
                    </span>
                    <strong>{s.name}</strong>
                    <span className="addr">{s.address}</span>
                    <span className="bbh-meta">{s.hours}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2>Select a treatment</h2>
              <p>Durations are the real window we hold for you. {BIZ.policy}</p>

              <div className="bbh-bk-cats">
                {["all", ...categories].map((key) => (
                  <button
                    key={key}
                    className={cat === key ? "active" : ""}
                    onClick={() => setCat(key)}
                  >
                    {key === "all" ? "All treatments" : key}
                  </button>
                ))}
              </div>

              <div className="bbh-bk-list">
                {treatments
                  .filter((t) => cat === "all" || t.label === cat)
                  .map((t) => (
                    <button
                      key={t.number}
                      className={`bbh-bk-svc ${serviceId === t.number ? "selected" : ""}`}
                      onClick={() => {
                        setServiceId(t.number);
                        setStaffId("any");
                        setTime(null);
                        setStep(2);
                      }}
                    >
                      <i></i>
                      <span className="name">
                        <strong>{t.title}</strong>
                        <span className="bbh-meta">{t.label}</span>
                      </span>
                      <span className="dur">{t.dur} min</span>
                      <span className="price">{money(t.price)}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2>Pick your therapist</h2>
              <p>
                {!svc
                  ? "Choose a treatment first."
                  : staffPool.length
                    ? `Specialists at ${studioRec?.short} qualified for ${svc.title}.`
                    : `${svc.title} is not offered at ${studioRec?.short || "this studio"} — go back to step 01 and pick another location.`}
              </p>

              <div className="bbh-bk-grid">
                {(staffPool.length
                  ? [
                      {
                        id: "any",
                        name: "First available",
                        role: "Fastest way in",
                        initial: "✳",
                        meta: "Any specialist",
                      },
                    ]
                  : []
                )
                  .concat(
                    staffPool.map((s) => ({
                      id: s.id,
                      name: s.name,
                      role: s.role,
                      initial: s.name.slice(0, 1),
                      meta: studioRec?.short || "",
                    }))
                  )
                  .map((s) => (
                    <button
                      key={s.id}
                      className={`bbh-bk-option bbh-bk-person ${staffId === s.id ? "selected" : ""}`}
                      onClick={() => {
                        setStaffId(s.id);
                        setTime(null);
                        setStep(3);
                      }}
                    >
                      <span className="bbh-bk-avatar">{s.initial}</span>
                      <span className="who">
                        <strong>{s.name}</strong>
                        <span className="role">{s.role}</span>
                        <span className="bbh-meta">{s.meta}</span>
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2>Choose a date &amp; time</h2>
              <p>
                Live availability for{" "}
                {staffPick ? staffPick.name : "the first available specialist"}.
                Greyed slots are already taken.
              </p>

              {error && <p className="bbh-bk-warn">{error}</p>}

              <div className="bbh-bk-days">
                {days.map((d) => {
                  const parsed = dParts(d);
                  return (
                    <button
                      key={d}
                      className={`bbh-bk-day ${date === d ? "selected" : ""}`}
                      onClick={() => {
                        setDate(d);
                        setTime(null);
                      }}
                    >
                      <span className="wd">{WD[parsed.getDay()]}</span>
                      <span className="dd">{parsed.getDate()}</span>
                      <span className="mon">{MON[parsed.getMonth()]}</span>
                    </button>
                  );
                })}
              </div>

              <div className="bbh-bk-daybar">
                <span className="bbh-meta">
                  {date ? dLabel(date) : "Pick a day"}
                </span>
                <hr />
                <span className="count">
                  {!date
                    ? ""
                    : slotsLoading
                      ? "Checking the diary…"
                      : `${openCount} of ${slots.length} slots open`}
                </span>
              </div>

              <div className="bbh-bk-slots">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    className={`bbh-bk-slot ${time === s.time ? "selected" : ""}`}
                    disabled={!s.ok}
                    onClick={() => setTime(s.time)}
                  >
                    {t12(s.time)}
                  </button>
                ))}
              </div>

              {date && !slotsLoading && openCount === 0 && (
                <p className="bbh-bk-warn">
                  Nothing left on this day for that therapist. Try the next date,
                  or choose <em>first available</em> back in step 03.
                </p>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h2>Your details</h2>
              <p>
                No account needed. We send your reference code to the number and
                inbox below.
              </p>

              <div className="bbh-bk-fields">
                <label className="bbh-bk-field">
                  <span className="bbh-meta">Full name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Amelia Reid"
                    autoComplete="name"
                  />
                </label>

                <label className="bbh-bk-field">
                  <span className="bbh-meta">Mobile</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0412 345 678"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </label>

                <label className="bbh-bk-field wide">
                  <span className="bbh-meta">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                  />
                </label>

                <label className="bbh-bk-field wide">
                  <span className="bbh-meta">Anything we should know</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Allergies, first visit, event date, preferred shape…"
                  />
                </label>
              </div>

              <button
                className={`bbh-bk-consent ${consent ? "on" : ""}`}
                aria-pressed={consent}
                onClick={() => setConsent(!consent)}
              >
                <i>{consent ? "✓" : ""}</i>I understand cancellations inside 24
                hours forfeit the deposit.
              </button>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2>Secure the slot</h2>
              <p>
                A deposit holds the chair and comes off your final bill. Or pay
                the whole thing in studio.
              </p>

              <div className="bbh-bk-grid">
                {(
                  [
                    {
                      k: "deposit" as const,
                      tag: "Pay deposit now",
                      amount: money(deposit),
                      copy: "Holds the chair instantly and comes off your final bill.",
                    },
                    {
                      k: "studio" as const,
                      tag: "Pay in studio",
                      amount: "On the day",
                      copy: "Slot held for 30 minutes past your start time.",
                    },
                  ]
                ).map((p) => (
                  <button
                    key={p.k}
                    className={`bbh-bk-option ${pay === p.k ? "selected" : ""}`}
                    onClick={() => setPay(p.k)}
                  >
                    <span className="bbh-bk-dot">
                      <i></i>
                      {p.tag}
                    </span>
                    <strong>{p.amount}</strong>
                    <span className="addr">{p.copy}</span>
                  </button>
                ))}
              </div>

              {pay === "deposit" && (
                <div className="bbh-bk-card-box">
                  <header>
                    <span className="bbh-meta">Card details</span>
                    <span className="bbh-meta">Visa · Mastercard · Amex</span>
                  </header>

                  <div className="row">
                    <label className="bbh-bk-field mono">
                      <input
                        value={card}
                        onChange={(e) => setCard(e.target.value)}
                        placeholder="Card number"
                        inputMode="numeric"
                        autoComplete="cc-number"
                      />
                    </label>
                    <label className="bbh-bk-field mono">
                      <input
                        value={exp}
                        onChange={(e) => setExp(e.target.value)}
                        placeholder="MM/YY"
                        autoComplete="cc-exp"
                      />
                    </label>
                    <label className="bbh-bk-field mono">
                      <input
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        placeholder="CVC"
                        autoComplete="cc-csc"
                      />
                    </label>
                  </div>

                  {/* No payment provider is wired up — the card is never sent
                      anywhere, and the studio takes the deposit on confirming. */}
                  <p
                    className="bbh-bk-hint"
                    style={{ marginTop: 14, color: "rgba(23,20,15,.5)" }}
                  >
                    Card details are not charged online yet — the studio takes the
                    deposit when it confirms your request.
                  </p>
                </div>
              )}

              {error && <p className="bbh-bk-warn">{error}</p>}

              <div className="bbh-bk-note">
                <span>✳</span>
                <p>
                  Reschedule free up to 24 hours before with your reference code.
                  Inside 24 hours the deposit is retained — the therapist's time
                  is already blocked.
                </p>
              </div>
            </div>
          )}

          {step === 6 && booked && (
            <div className="bbh-bk-done">
              <div>
                <span className="bbh-bk-status">
                  <i></i>Awaiting studio confirmation
                </span>

                <h2 className="bbh-display">
                  You are booked in,{" "}
                  <em>{booked.name.split(" ")[0] || "guest"}</em>
                </h2>

                <p
                  className="bbh-lede"
                  style={{ maxWidth: 430, marginTop: 12, fontSize: 14 }}
                >
                  Show the QR pass or quote your reference at reception. A
                  confirmation is on its way to {booked.email || "your inbox"}.
                </p>

                <div className="bbh-bk-refbox">
                  <div className="lbl">Your reference</div>
                  <div className="code">{booked.ref}</div>
                </div>

                <dl className="bbh-bk-summary">
                  {[
                    {
                      k: "Treatment",
                      v: `${bookedSvc?.title} · ${booked.dur} min`,
                    },
                    { k: "Therapist", v: bookedStaff?.name || "" },
                    { k: "Studio", v: bookedStudio?.name || "" },
                    {
                      k: "When",
                      v: `${dLabel(booked.date)} at ${t12(booked.time)}`,
                    },
                    {
                      k: "Paid today",
                      v: booked.paid
                        ? `${money(booked.deposit)} deposit`
                        : "Nothing — pay in studio",
                    },
                    {
                      k: "Balance",
                      v: `${money(booked.price - (booked.paid ? booked.deposit : 0))} on the day`,
                    },
                  ].map((row) => (
                    <div key={row.k}>
                      <dt>{row.k}</dt>
                      <dd>{row.v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="bbh-bk-actions">
                  <a
                    className="bbh-btn sm"
                    href={icsFor(booked, bookedSvc, bookedStudio)}
                    download="brow-beauty-hub.ics"
                  >
                    Add to calendar
                  </a>

                  <Link
                    className="bbh-btn sm outline"
                    to={`/manage?ref=${booked.ref}`}
                  >
                    Manage booking
                  </Link>

                  <button className="bbh-btn sm ghost" onClick={restart}>
                    Book another
                  </button>
                </div>
              </div>

              <QrPass reference={booked.ref} caption="Scan at reception" />
            </div>
          )}
        </div>

        <aside className="bbh-bk-aside">
          <div className="head">Your appointment</div>

          <dl className="bbh-bk-picked">
            {picked.map((p) => (
              <div key={p.k}>
                <dt>{p.k}</dt>
                <dd className={p.empty ? "empty" : ""}>
                  {p.v || (p.k === "Guest" ? "Not entered" : "Not chosen")}
                </dd>
              </div>
            ))}
          </dl>

          <div className="bbh-bk-totals">
            <div>
              <div className="lbl">Deposit today</div>
              <div className="deposit">
                {money(pay === "studio" ? 0 : deposit)}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div className="lbl">Total</div>
              <div className="total">{money(svc ? svc.price : 0)}</div>
            </div>
          </div>

          {step === 6 ? (
            <Link className="bbh-bk-next" to="/">
              Back to site
            </Link>
          ) : (
            <button
              className="bbh-bk-next"
              disabled={!ready || saving}
              onClick={next}
            >
              {saving
                ? "Booking…"
                : step === 5
                  ? "Confirm booking"
                  : "Continue"}
            </button>
          )}

          {step > 0 && step < 6 && (
            <button className="bbh-bk-prev" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}

          <p className="bbh-bk-hint">{hint}</p>
        </aside>
      </div>
    </main>
  );
}

export default Book;
