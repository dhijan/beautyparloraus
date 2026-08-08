import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/images/logo.png";
import { BIZ } from "../data/salonData";

const LINKS = [
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/lookbook", label: "Lookbook" },
  { to: "/shop", label: "Shop" },
  { to: "/locations", label: "Locations" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  // Never leave the body scroll-locked, even if the drawer unmounts open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="bbh-header" data-header>
      <nav className={`bbh-nav ${menuOpen ? "open" : ""}`}>
        <div className="bbh-nav-top">
          <Link to="/" className="bbh-brand" onClick={close}>
            <img src={logo} alt="Brow Beauty Hub" />
            <span>Brow Beauty Hub</span>
          </Link>

          <button
            className={`bbh-burger ${menuOpen ? "open" : ""}`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <ul className="bbh-nav-links">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                onClick={close}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <Link className="bbh-btn sm" to="/book" onClick={close}>
          Book now
          <span className="dot"></span>
        </Link>

        {/* Secondary entry point — only surfaced in the mobile sheet, as the
            desktop bar has no room for it. */}
        <div className="bbh-nav-secondary">
          <Link to="/manage" onClick={close}>
            Manage booking
          </Link>

          <a href={BIZ.tel}>{BIZ.phone}</a>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
