import { Link } from "react-router-dom";
import { milestones, principles, team } from "../data/bbhData";

function About() {
  return (
    <main className="bbh-page">
      <Link to="/" className="bbh-back">
        ← Back home
      </Link>

      <div className="bbh-page-head" style={{ marginTop: 20 }}>
        <h1 className="bbh-display bbh-h1 bbh-fade-up">
          Our <em>story</em>
        </h1>

        <p
          className="bbh-lede bbh-fade-up"
          style={{ maxWidth: 400, animationDelay: "0.12s" }}
        >
          One chair, one artist, one guest at a time — since 2018. Four studios
          later, that has not changed.
        </p>
      </div>

      <div className="bbh-story" data-reveal="0">
        <img
          src="https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=1400&q=80"
          alt="Brow Beauty Hub studio floor"
          loading="lazy"
        />

        <span className="shade"></span>

        <div className="cap">
          <p>
            “We would rather run late than rush a shape. That is the whole
            philosophy.”
          </p>
          <span
            className="bbh-meta"
            style={{ color: "rgba(242,239,233,.6)", whiteSpace: "nowrap" }}
          >
            Founder · Roselands
          </span>
        </div>
      </div>

      <div className="bbh-split" style={{ marginTop: 96 }}>
        <div className="bbh-sticky">
          <div className="bbh-eyebrow" data-reveal="0">
            How we got here
          </div>

          <h2 className="bbh-display bbh-h2" data-reveal="1" style={{ marginTop: 18 }}>
            Eight years,
            <br />
            <em>four studios</em>
          </h2>

          <p
            className="bbh-lede"
            data-reveal="2"
            style={{ marginTop: 22, maxWidth: 380 }}
          >
            We grew by referral, not advertising. Every new studio opened
            because the last one had a waitlist we could not honour.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {milestones.map((milestone, index) => (
            <div
              key={milestone.year}
              className="bbh-milestone bbh-glass bbh-lift"
              data-reveal={index}
            >
              <span className="year">{milestone.year}</span>
              <div>
                <h3>{milestone.title}</h3>
                <p>{milestone.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section style={{ marginTop: 110 }}>
        <div className="bbh-head">
          <h2 className="bbh-display bbh-h2" data-reveal="0">
            The <em>people</em>
          </h2>

          <p data-reveal="1" style={{ maxWidth: 300 }}>
            Ten specialists. One artist stays with you from consult to
            aftercare.
          </p>
        </div>

        <div className="bbh-grid-4">
          {team.map((person, index) => (
            <article key={person.name} className="bbh-person" data-reveal={index}>
              <div className="bbh-thumb">
                <img src={person.image} alt={person.name} loading="lazy" />
                <span className="tag">{person.studio}</span>
              </div>

              <h3>{person.name}</h3>
              <span className="bbh-meta" style={{ marginTop: 6 }}>
                {person.role}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 110 }}>
        <div className="bbh-eyebrow" data-reveal="0">
          What we hold to
        </div>

        <div className="bbh-grid-3" style={{ marginTop: 30 }}>
          {principles.map((principle, index) => (
            <div
              key={principle.no}
              className="bbh-principle bbh-glass bbh-lift"
              data-reveal={index % 3}
            >
              <span
                className="bbh-meta"
                style={{ color: "var(--bbh-brass-deep)" }}
              >
                {principle.no}
              </span>
              <h3>{principle.title}</h3>
              <p>{principle.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <div
        className="bbh-dark bbh-cta-split"
        data-reveal="0"
        style={{ marginTop: 96 }}
      >
        <div className="bbh-dark-glow" data-parallax="-0.05"></div>

        <div>
          <h2
            className="bbh-display"
            style={{ fontSize: "clamp(32px,4vw,56px)" }}
          >
            Come and see the{" "}
            <em style={{ color: "var(--bbh-brass)" }}>difference</em>
          </h2>

          <p
            style={{
              margin: "16px 0 0",
              maxWidth: 460,
              fontSize: 15,
              lineHeight: 1.62,
              color: "rgba(242,239,233,.62)",
            }}
          >
            Book with any of our four Sydney studios — or drop in and we will
            find you a chair if we can.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="bbh-btn cream" to="/book">
            Book now
          </Link>

          <Link className="bbh-btn outline-light" to="/locations">
            Locations
          </Link>
        </div>
      </div>
    </main>
  );
}

export default About;
