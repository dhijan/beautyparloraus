import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getBookingConfig } from "../api/bookingApi";
import type { Treatment } from "../api/bookingApi";
import { money } from "../lib/booking";
import { treatmentImage } from "../data/salonData";

function Services() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // The bookable menu is the service list — one source, so /services can never
  // drift from what /book will actually take a booking for.
  useEffect(() => {
    getBookingConfig()
      .then((config) => {
        setTreatments(config.treatments);
        setCategories(config.categories);
      })
      .catch(() => setTreatments([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = searchQuery.toLowerCase().trim();

    return treatments.filter((t) => {
      const haystack = `${t.title} ${t.label} ${t.description}`.toLowerCase();

      return (
        haystack.includes(needle) &&
        (selectedFilter === "all" || t.label === selectedFilter)
      );
    });
  }, [treatments, searchQuery, selectedFilter]);

  return (
    <main className="bbh-page">
      <Link to="/" className="bbh-back">
        ← Back home
      </Link>

      <div className="bbh-page-head" style={{ marginTop: 20 }}>
        <h1 className="bbh-display bbh-h1 bbh-fade-up">
          Every <em>treatment</em>
        </h1>

        <p
          className="bbh-lede bbh-fade-up"
          style={{ maxWidth: 400, animationDelay: "0.12s" }}
        >
          Each service is performed by a specialist therapist. Every treatment
          here is bookable online — prices confirmed at consultation.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 40,
        }}
      >
        <label className="bbh-search" style={{ flex: "1 1 280px" }}>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            type="search"
            placeholder="Search services…"
            aria-label="Search services"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="bbh-filters">
          {["all", ...categories].map((filter) => (
            <button
              key={filter}
              className={selectedFilter === filter ? "active" : ""}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter === "all" ? "All" : filter}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="bbh-state">Loading services…</p>
      ) : filtered.length === 0 ? (
        <p className="bbh-state">
          No services found. Try another search or filter.
        </p>
      ) : (
        <div className="bbh-svc-rows">
          {filtered.map((t, index) => (
            <article
              key={t.number}
              className="bbh-svc-row bbh-glass bbh-lift"
              data-reveal={index % 4}
            >
              <div className="bbh-thumb">
                <img
                  src={treatmentImage(t.label)}
                  alt={t.title}
                  loading="lazy"
                />
              </div>

              <div style={{ paddingTop: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    className="bbh-meta"
                    style={{ color: "var(--bbh-brass-deep)" }}
                  >
                    {t.number}
                  </span>
                  <span className="bbh-meta">{t.label}</span>
                </div>

                <h2>{t.title}</h2>

                {t.description && <p className="blurb">{t.description}</p>}
              </div>

              <div className="includes-col" style={{ paddingTop: 10 }}>
                <div className="bbh-meta">Appointment</div>

                <div className="bbh-includes">
                  <span>
                    <i>✓</i>
                    {t.dur} min
                  </span>
                  <span>
                    <i>✓</i>
                    {money(t.price)}
                  </span>
                </div>

                <Link
                  className="bbh-btn sm"
                  to={`/book?cat=${encodeURIComponent(t.label)}`}
                  style={{ marginTop: 22 }}
                >
                  Book this
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Services;
