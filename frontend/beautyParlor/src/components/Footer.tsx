import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png";

function Footer() {
  return (
    <footer className="bbh-footer">
      <div className="bbh-section">
        <div className="bbh-footer-grid">
          <div>
            <Link to="/">
              <img src={logo} alt="Brow Beauty Hub" />
            </Link>

            <p>
              Expert brow &amp; lash treatments, advanced skin care and premium
              beauty services across Sydney.
              <br />
              Mon–Sat 9am–7pm · Sun 10am–5pm
            </p>

            <div className="bbh-socials">
              <a
                aria-label="Instagram"
                href="https://www.instagram.com/eyebrowbeautyhub/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <i className="fa-brands fa-instagram"></i>
              </a>

              <a
                aria-label="Facebook"
                href="https://www.facebook.com/eyebrowbeautyhub/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <i className="fa-brands fa-facebook-f"></i>
              </a>

              <a
                aria-label="TikTok"
                href="https://www.tiktok.com/tag/browbeautyhub"
                rel="noopener noreferrer"
                target="_blank"
              >
                <i className="fa-brands fa-tiktok"></i>
              </a>
            </div>
          </div>

          <div className="bbh-footer-col">
            <span className="bbh-eyebrow">Services</span>
            <Link to="/services">Threading</Link>
            <Link to="/services">Eyelash extensions</Link>
            <Link to="/services">Facials</Link>
            <Link to="/services">Waxing</Link>
          </div>

          <div className="bbh-footer-col">
            <span className="bbh-eyebrow">Studio</span>
            <Link to="/about">About us</Link>
            <Link to="/lookbook">Lookbook</Link>
            <Link to="/locations">Locations</Link>
            <Link to="/shop">Shop</Link>
          </div>

          <div className="bbh-footer-col">
            <span className="bbh-eyebrow">Contact</span>
            <a href="tel:0426962461">0426 962 461 — Roselands</a>
            <a href="tel:0414205503">0414 205 503 — Hurstville</a>
            <a href="tel:0284170814">02 8417 0814 — Hornsby</a>
            <a href="mailto:eyebrowbeautyhub@gmail.com">
              eyebrowbeautyhub@gmail.com
            </a>
            <Link to="/book">Book an appointment</Link>
            <Link to="/manage">Manage a booking</Link>
          </div>
        </div>

        <div className="bbh-footer-bottom">
          <span>© 2026 Brow Beauty Hub</span>
          <span>Precision brows. Flawless results.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
