import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import { getFeaturedReviews } from "../api/reviewApi";
import { getHomepageStats } from "../api/homepageApi";
import { getBookingConfig } from "../api/bookingApi";
import { getShopProducts } from "../api/shopApi";

import type { Review } from "../types/review";
import type { HomepageStat } from "../types/homepage";
import type { Treatment } from "../api/bookingApi";
import type { ShopProduct } from "../types/shop";

import { CAT_IMAGES, CAT_LABELS, fmtPrice, splitVariant } from "../data/shopProducts";
import { locationCards } from "../data/pageData";
import { treatmentImage } from "../data/salonData";
import {
  contactRows,
  glimpseCards,
  heroStatsFallback,
  introPills,
  introSentence,
  values,
} from "../data/bbhData";

type HeroStat = Pick<HomepageStat, "id" | "value" | "suffix" | "label">;

// The four categories the design leads with, in order — the first bookable
// treatment of each. Anything missing from the menu falls back to whatever
// else came back, so the grid is never short.
const FEATURED_LABELS = [
  "EYELASH EXTENSION",
  "BROW TATTOO",
  "ASAP FACIALS (AUSTRALIAN KIT)",
  "HENNA MEHENDI",
];

function pickFeatured(treatments: Treatment[]) {
  const wanted = FEATURED_LABELS.map((label) =>
    treatments.find((t) => t.label === label)
  ).filter((t): t is Treatment => Boolean(t));

  const rest = treatments.filter((t) => !wanted.includes(t));

  return [...wanted, ...rest].slice(0, 4);
}

function IntroCopy() {
  const words = introSentence.split(" ");

  return (
    <div className="bbh-hl" data-hl-wrap>
      <span className="mark">✳</span>

      {words.map((word, index) => {
        const pill = introPills.find((slot) => slot.after === index);

        return (
          <Fragment key={index}>
            <span style={{ "--i": index } as CSSProperties}>{word} </span>

            {pill && (
              <span className="pill">
                <img src={pill.image} alt={pill.alt} loading="lazy" />
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Home() {
  const [stats, setStats] = useState<HeroStat[]>(heroStatsFallback);
  const [services, setServices] = useState<Treatment[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    getHomepageStats()
      .then((data) => {
        if (data.length) setStats(data);
      })
      .catch(() => {});

    getBookingConfig()
      .then((config) => setServices(config.treatments))
      .catch(() => {});

    getShopProducts()
      .then(setProducts)
      .catch(() => {});

    getFeaturedReviews()
      .then(setReviews)
      .catch(() => {});
  }, []);

  // Safari and iOS ignore the autoplay attribute unless the element is
  // muted before play() is called.
  useEffect(() => {
    const element = video.current;
    if (!element) return;

    element.muted = true;
    element.play().catch(() => {});
  }, []);

  const featured = pickFeatured(services);
  const preview = products.slice(0, 4);
  const quotes = reviews.slice(0, 4);

  return (
    <main id="top">
      <section className="bbh-hero" data-hero>
        <video
          ref={video}
          data-hero-media
          src="/Final_5sec.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onEnded={(event) => {
            // Freeze on the final frame rather than looping or going black.
            const element = event.currentTarget;
            element.pause();
            if (element.duration) {
              element.currentTime = Math.max(0, element.duration - 0.04);
            }
          }}
        />

        <div className="bbh-hero-scrim v"></div>
        <div className="bbh-hero-scrim h"></div>

        <div className="bbh-hero-inner" data-hero-inner>
          <div className="bbh-hero-badge bbh-fade-up">
            <i></i>
            Welcome to Brow Beauty Hub · Sydney
          </div>

          <h1 className="bbh-hero-title">
            <span>
              <span>Precision brows.</span>
            </span>
            <span>
              <span>
                <em>Flawless</em> results.
              </span>
            </span>
          </h1>

          <div className="bbh-hero-row">
            <div
              className="bbh-hero-actions bbh-fade-up"
              style={{ animationDelay: "0.58s" }}
            >
              <Link className="bbh-btn cream" to="/book">
                Book now
              </Link>

              <Link className="bbh-btn glass" to="/services">
                Our services →
              </Link>
            </div>

            <p
              className="bbh-hero-blurb bbh-fade-up"
              style={{ animationDelay: "0.46s" }}
            >
              Expert brow &amp; lash treatments, advanced skin care and premium
              beauty services — delivered with precision and care across Sydney.
            </p>
          </div>

          <div
            className="bbh-hero-foot bbh-fade-up"
            style={{ animationDelay: "0.72s" }}
          >
            <div className="bbh-hero-stats">
              {stats.map((stat) => (
                <div key={stat.id}>
                  <div className="bbh-stat-value">
                    {stat.value}
                    <span>{stat.suffix}</span>
                  </div>
                  <div className="bbh-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bbh-hero-open">
              <span className="pip"></span>
              <span className="txt">
                Open today <em>9am – 7pm</em>
              </span>
              <span className="note">Walk-ins welcome</span>
            </div>
          </div>
        </div>
      </section>

      <div className="bbh-overlap">
        <section className="bbh-intro" id="intro">
          <div className="bbh-eyebrow brass">About the studio</div>

          <IntroCopy />

          <p className="bbh-intro-note" data-reveal="2">
            Four studios across Roselands, Hurstville and Hornsby. One artist
            per guest, start to finish, every single appointment.
          </p>
        </section>

        <section className="bbh-section" style={{ paddingTop: 104 }}>
          <div className="bbh-glimpse">
            {glimpseCards.map((card, index) => (
              <Link
                key={card.key}
                to="/lookbook"
                data-reveal={index}
                className={`bbh-glimpse-card ${
                  card.variant === "ink"
                    ? "ink"
                    : card.variant === "pale"
                    ? "pale"
                    : ""
                }`}
              >
                {card.image && (
                  <>
                    <img src={card.image} alt="" loading="lazy" />
                    <span className="shade"></span>
                  </>
                )}

                <span className="bbh-chip">{card.chip}</span>
                <span className="pip"></span>

                <h3>
                  {card.title[0]}
                  <br />
                  {card.title[1]}
                </h3>

                <p>{card.copy}</p>
              </Link>
            ))}
          </div>

          <div className="bbh-glimpse-cta" data-reveal="0">
            <span className="bbh-note">Recent work · four studios</span>
            <Link className="bbh-btn" to="/lookbook">
              Open the lookbook
            </Link>
          </div>
        </section>

        <section
          className="bbh-section"
          id="services"
          style={{ paddingTop: 120 }}
        >
          <div className="bbh-head">
            <div>
              <div className="bbh-eyebrow" data-reveal="0">
                The experience
              </div>
              <h2 className="bbh-display bbh-h2" data-reveal="1">
                Salon <em>treatments</em>
              </h2>
            </div>

            <Link className="bbh-btn ghost" to="/services" data-reveal="2">
              View all {services.length || 9} services →
            </Link>
          </div>

          <div className="bbh-grid-4">
            {featured.map((service, index) => (
              <Link
                key={service.number}
                to="/services"
                className="bbh-svc-card bbh-glass bbh-lift"
                data-reveal={index}
              >
                <div className="bbh-thumb">
                  <img
                    src={treatmentImage(service.label)}
                    alt={service.title}
                    loading="lazy"
                  />
                  <span className="tag">{service.label}</span>
                </div>

                <h3>{service.title}</h3>
                <p>{service.description}</p>

                <div className="bbh-card-foot">
                  <span>{service.number}</span>
                  <span>Know more →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bbh-section" id="shop" style={{ paddingTop: 150 }}>
          <div className="bbh-head">
            <div>
              <div className="bbh-eyebrow" data-reveal="0">
                Our products
              </div>
              <h2 className="bbh-display bbh-h2" data-reveal="1">
                Shop <em>premium</em> beauty
              </h2>
              <p data-reveal="2">
                Take the Brow Beauty Hub experience home — brow, lash and skin
                care chosen to maintain your results.
              </p>
            </div>

            <Link className="bbh-btn ghost" to="/shop" data-reveal="3">
              Visit full shop →
            </Link>
          </div>

          <div className="bbh-grid-4">
            {preview.map((product, index) => (
              <article
                key={product.id}
                className="bbh-prod bbh-glass bbh-lift"
                data-reveal={index}
              >
                <div className="bbh-thumb">
                  <img
                    src={product.imageUrl || CAT_IMAGES[product.cat]}
                    alt={product.name}
                    loading="lazy"
                  />
                  {product.tag && (
                    <span className="tag ink">{product.tag}</span>
                  )}
                </div>

                <span className="cat">{CAT_LABELS[product.cat]}</span>
                <h4>{splitVariant(product.name).base}</h4>
                <p>{product.desc}</p>

                <div className="bbh-card-foot">
                  <span className="bbh-price">{fmtPrice(product.price)}</span>
                  <span className="bbh-rating">
                    {splitVariant(product.name).size || ""}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {quotes.length > 0 && (
          <section className="bbh-section" style={{ paddingTop: 140 }}>
            <div className="bbh-split">
              <div className="bbh-sticky">
                <div className="bbh-eyebrow" data-reveal="0">
                  Client love
                </div>
                <h2 className="bbh-display bbh-h2" data-reveal="1">
                  What our clients
                  <br />
                  <em>are saying</em>
                </h2>
                <div
                  data-reveal="2"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginTop: 26,
                  }}
                >
                  <div className="bbh-stars" style={{ fontSize: 15 }}>
                    ★★★★★
                  </div>
                  <span style={{ fontSize: 14, color: "rgba(23,20,15,.55)" }}>
                    4.9 average across 5,000+ clients
                  </span>
                </div>
              </div>

              <div className="bbh-quotes">
                {quotes.map((review, index) => (
                  <figure
                    key={review.id}
                    className="bbh-quote bbh-glass bbh-lift"
                    data-reveal={index % 2}
                  >
                    <div className="bbh-stars">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(Math.max(0, 5 - review.rating))}
                    </div>

                    <blockquote>“{review.reviewText}”</blockquote>

                    <figcaption>
                      <span className="bbh-avatar">
                        {review.avatarLetter || review.clientName.charAt(0)}
                      </span>
                      <span>
                        <strong>{review.clientName}</strong>
                        <span>
                          {review.serviceName || "Beauty client"}
                          {review.location ? ` — ${review.location}` : ""}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bbh-section" id="about" style={{ paddingTop: 150 }}>
          <div className="bbh-about">
            <div style={{ position: "relative" }}>
              <div className="bbh-about-main" data-reveal="0">
                <img
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80"
                  alt="Salon interior"
                  loading="lazy"
                />
              </div>

              <div className="bbh-about-accent" data-reveal="1">
                <div className="shot">
                  <img
                    src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80"
                    alt="Therapist at work"
                    loading="lazy"
                  />
                </div>

                <div className="bbh-badge">
                  <b>8+</b>
                  <div className="bbh-meta" style={{ marginTop: 5 }}>
                    Years of excellence
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bbh-eyebrow" data-reveal="0">
                Who we are
              </div>

              <h2 className="bbh-display bbh-h2" data-reveal="1" style={{ marginTop: 18 }}>
                Dedicated to beauty,
                <br />
                <em>driven by precision</em>
              </h2>

              <p
                data-reveal="2"
                style={{
                  margin: "26px 0 0",
                  maxWidth: 560,
                  fontSize: 17,
                  lineHeight: 1.6,
                  color: "rgba(23,20,15,.72)",
                }}
              >
                A dedicated team of experienced beauty professionals committed
                to delivering high-quality, results-driven treatments.
              </p>

              <p
                data-reveal="3"
                style={{
                  margin: "16px 0 0",
                  maxWidth: 560,
                  fontSize: 15,
                  lineHeight: 1.68,
                  color: "rgba(23,20,15,.55)",
                }}
              >
                Our focus is on enhancing natural beauty through precision
                techniques, premium products and personalised care in a clean
                and welcoming environment. We pride ourselves on consistency,
                attention to detail, and creating a relaxing experience for
                every client who walks through our doors.
              </p>

              <div className="bbh-mission bbh-glass bbh-lift" data-reveal="4">
                <div className="icon">✳</div>
                <div>
                  <h4>Our mission</h4>
                  <p>
                    To enhance every client's natural beauty through precision
                    techniques, premium products and a deeply personalised
                    experience — delivered consistently across all of our Sydney
                    locations.
                  </p>
                </div>
              </div>

              <div className="bbh-tags" data-reveal="5">
                {values.map((value) => (
                  <span className="bbh-tag" key={value}>
                    <i>✓</i>
                    {value}
                  </span>
                ))}
              </div>

              <Link
                className="bbh-btn"
                to="/about"
                data-reveal="6"
                style={{ marginTop: 30 }}
              >
                Read our full story →
              </Link>
            </div>
          </div>
        </section>

        <section
          className="bbh-section"
          id="booking"
          style={{ marginTop: 150 }}
        >
          <div
            className="bbh-dark bbh-book-panel"
            data-reveal="0"
          >
            <div className="bbh-dark-glow" data-parallax="-0.06"></div>

            <div className="bbh-book">
              <div>
                <div className="bbh-eyebrow light">Book with us</div>

                <h2
                  className="bbh-display"
                  style={{
                    margin: "20px 0 0",
                    fontSize: "clamp(38px,5vw,72px)",
                    lineHeight: 0.98,
                    letterSpacing: "-0.025em",
                  }}
                >
                  Ready to book your
                  <br />
                  <em style={{ color: "var(--bbh-brass)" }}>appointment?</em>
                </h2>

                <p
                  style={{
                    margin: "22px 0 0",
                    maxWidth: 440,
                    fontSize: 15,
                    lineHeight: 1.62,
                    color: "rgba(242,239,233,.62)",
                  }}
                >
                  Select your preferred location, service and date online — or
                  call us directly. Walk-ins welcome, subject to availability.
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    marginTop: 34,
                  }}
                >
                  <Link className="bbh-btn cream" to="/book">
                    Book an appointment
                  </Link>

                  <Link className="bbh-btn outline-light" to="/locations">
                    View all locations
                  </Link>
                </div>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {contactRows.map((row) => (
                  <div className="bbh-contact-row" key={row.label}>
                    <div>
                      <div className="bbh-eyebrow light">{row.label}</div>
                      <div className="val">{row.value}</div>
                    </div>
                    <span className="mark">{row.mark}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="bbh-section"
          id="locations"
          style={{ padding: "132px 24px 120px" }}
        >
          <div className="bbh-head">
            <h2 className="bbh-display bbh-h2" data-reveal="0">
              Find us <em>across Sydney</em>
            </h2>

            <div
              data-reveal="1"
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              <p style={{ margin: 0, maxWidth: 280 }}>
                Four studios, one standard of care.
              </p>
              <Link className="bbh-btn ghost" to="/locations">
                All studio details →
              </Link>
            </div>
          </div>

          <div className="bbh-grid-4">
            {locationCards.map((studio, index) => (
              <div
                key={studio.name}
                className="bbh-loc-card bbh-glass bbh-lift"
                data-reveal={index}
              >
                <span className="bbh-meta" style={{ color: "var(--bbh-brass-deep)" }}>
                  {studio.no}
                </span>

                <h3>{studio.name}</h3>

                <p>{studio.address.replace("\n", ", ")}</p>

                <div className="lines">
                  <a href={`tel:${studio.tel}`}>{studio.phone}</a>
                  <span className="bbh-meta">{studio.hours}</span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <a
                    className="bbh-btn sm"
                    href={studio.bookingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Book
                  </a>
                  <a
                    className="bbh-btn sm outline"
                    href={studio.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Home;
