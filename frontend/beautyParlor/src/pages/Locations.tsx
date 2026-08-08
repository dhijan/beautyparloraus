import { Link } from "react-router-dom";
import { locationCards } from "../data/pageData";

function Locations() {
  return (
    <main className="bbh-page">
      <div className="bbh-page-head">
        <div>
          <Link to="/" className="bbh-back">
            ← Back home
          </Link>

          <h1 className="bbh-display bbh-h1 bbh-fade-up">
            Our <em>studios</em>
          </h1>

          <p
            className="bbh-lede bbh-fade-up"
            style={{ maxWidth: 450, marginTop: 18, animationDelay: "0.12s" }}
          >
            Four locations across Sydney, all inside major centres with parking
            and rail on the doorstep. Same team standards, same menu, same
            aftercare.
          </p>
        </div>

        <div
          className="bbh-fade-up"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            textAlign: "right",
            animationDelay: "0.2s",
          }}
        >
          <span className="bbh-meta">Opening hours</span>
          <span
            style={{
              fontFamily: "var(--bbh-serif)",
              fontSize: 26,
              lineHeight: 1.2,
            }}
          >
            Mon–Sat 9am – 7pm
          </span>
          <span style={{ fontSize: 13.5, color: "rgba(23,20,15,.55)" }}>
            Sunday 10am – 5pm · Walk-ins subject to availability
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          marginTop: 52,
        }}
      >
        {locationCards.map((studio, index) => (
          <article
            key={studio.name}
            className="bbh-studio bbh-glass bbh-lift"
            data-reveal={index}
          >
            <div className="shot">
              <img src={studio.image} alt={studio.name} loading="lazy" />
              <span className="bbh-chip">Studio {studio.no}</span>
            </div>

            <div className="body">
              <h2>{studio.name}</h2>

              <p className="addr">{studio.address.replace("\n", ", ")}</p>

              <dl className="bbh-facts">
                <div>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${studio.tel}`}>{studio.phone}</a>
                  </dd>
                </div>
                <div>
                  <dt>Hours</dt>
                  <dd>{studio.hours}</dd>
                </div>
                <div>
                  <dt>Getting here</dt>
                  <dd>{studio.transit}</dd>
                </div>
              </dl>

              <div className="bbh-tags" style={{ marginTop: 22 }}>
                {studio.tags.map((tag) => (
                  <span className="bbh-tag" key={tag}>
                    <i>✓</i>
                    {tag}
                  </span>
                ))}
              </div>

              {studio.note && (
                <p
                  style={{
                    margin: "16px 0 0",
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "rgba(23,20,15,.5)",
                  }}
                >
                  {studio.note}
                </p>
              )}

              <div className="actions">
                <a
                  className="bbh-btn sm"
                  href={studio.bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Book this studio ↗
                </a>

                <a
                  className="bbh-btn sm ghost"
                  href={studio.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get directions ↗
                </a>

                <a className="bbh-btn sm outline" href={`tel:${studio.tel}`}>
                  Call
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="bbh-policy bbh-glass" data-reveal="0">
        <h4>Cancellation policy</h4>
        <p>
          In the event that you need to cancel your scheduled appointment with
          us, we ask that you please call us in advance as a courtesy to the
          staff member, so that we may possibly accommodate the needs of other
          clients. If you have an appointment for a Beauty Hub treatment, this
          time is reserved exclusively for you. Thank you!
        </p>
      </div>

      <div
        className="bbh-dark bbh-cta-split"
        data-reveal="0"
        style={{ marginTop: 24 }}
      >
        <div className="bbh-dark-glow" data-parallax="-0.05"></div>

        <div>
          <div className="bbh-eyebrow light">Not sure which studio</div>

          <h2
            className="bbh-display"
            style={{ marginTop: 18, fontSize: "clamp(30px,3.6vw,50px)" }}
          >
            Book the <em style={{ color: "var(--bbh-brass)" }}>artist</em>, not
            the address
          </h2>

          <p
            style={{
              margin: "16px 0 0",
              maxWidth: 470,
              fontSize: 15,
              lineHeight: 1.62,
              color: "rgba(242,239,233,.62)",
            }}
          >
            Tell us the treatment and we will place you with the right
            specialist at the closest studio that has a chair.
          </p>
        </div>

        <Link className="bbh-btn cream" to="/book">
          Book an appointment
        </Link>
      </div>
    </main>
  );
}

export default Locations;
