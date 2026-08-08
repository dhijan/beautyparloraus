import { useState } from "react";
import { Link } from "react-router-dom";
import { lookbookFilters, lookbookShots } from "../data/bbhData";

function Lookbook() {
  const [filter, setFilter] = useState("all");

  const shots = lookbookShots.filter(
    (shot) => filter === "all" || shot.cat === filter
  );

  return (
    <main className="bbh-page">
      <div className="bbh-page-head">
        <div>
          <Link to="/" className="bbh-back">
            ← Back home
          </Link>

          <h1 className="bbh-display bbh-h1 bbh-fade-up">
            The <em>lookbook</em>
          </h1>

          <p
            className="bbh-lede bbh-fade-up"
            style={{ maxWidth: 430, marginTop: 18, animationDelay: "0.12s" }}
          >
            Recent work from our Roselands, Hurstville and Hornsby studios.
            Browse for direction — every shape is mapped to one face.
          </p>
        </div>

        <div className="bbh-filters">
          {lookbookFilters.map((option) => (
            <button
              key={option.key}
              className={filter === option.key ? "active" : ""}
              onClick={() => setFilter(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bbh-masonry">
        {shots.map((shot, index) => (
          <figure
            key={shot.tag}
            className="bbh-shot"
            data-reveal={index % 4}
            style={{ height: shot.height }}
          >
            <img src={shot.image} alt={shot.tag} loading="lazy" />

            <figcaption>
              <span>{shot.tag}</span>
              <span className="bbh-meta">{shot.studio}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
        <Link className="bbh-btn" to="/book">
          Book this look
        </Link>
      </div>
    </main>
  );
}

export default Lookbook;
